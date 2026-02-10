/**
 * Email Service for CPMS
 * 
 * Handles all email sending operations using SMTP configuration from database.
 * Implements proper error handling, retry logic, and logging.
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';
import { prisma } from '../config/db';
import { EmailTemplate } from '../templates/emailTemplates';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get SMTP settings from database
 */
async function getSMTPSettings() {
  const settings = await prisma.systemSettings.findFirst();
  
  if (!settings || !settings.smtpHost || !settings.smtpUser) {
    throw new Error('SMTP settings not configured. Please configure email settings in the admin panel.');
  }

  return {
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure ?? false, // false for 587 (STARTTLS), true for 465 (SSL)
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword || '',
    },
    from: settings.emailFrom || settings.smtpUser,
    fromName: settings.emailFromName || 'Placement Cell',
  };
}

/**
 * Get institution settings for email branding
 */
async function getInstitutionSettings() {
  const settings = await prisma.systemSettings.findFirst();
  
  return {
    institutionName: settings?.institutionName || 'Institution',
    institutionEmail: settings?.contactEmail || '',
    institutionPhone: settings?.contactPhone || '',
  };
}

/**
 * Check if email notifications are enabled
 */
export async function areEmailNotificationsEnabled(): Promise<boolean> {
  const settings = await prisma.systemSettings.findFirst();
  return settings?.emailNotifications ?? true;
}

/**
 * Check if specific notification type is enabled
 */
export async function isNotificationTypeEnabled(type: string): Promise<boolean> {
  const settings = await prisma.systemSettings.findFirst();
  
  if (!settings) return true; // Default to enabled if no settings
  
  // Check specific notification settings
  switch (type) {
    case 'APPLICATION_STATUS':
      return settings.notifyApplicationStatus ?? true;
    case 'NEW_DRIVE':
      return settings.notifyNewDrive ?? true;
    default:
      return settings.emailNotifications ?? true;
  }
}

/**
 * Create email transporter with current SMTP settings
 */
// Custom DNS lookup to force IPv4
const lookup4 = promisify(dns.lookup);
const customLookup = async (hostname: string, options: any, callback: any) => {
  try {
    const result = await lookup4(hostname, { family: 4, all: false });
    callback(null, result.address, 4);
  } catch (error) {
    callback(error);
  }
};

async function createTransporter() {
  const smtpSettings = await getSMTPSettings();
  
  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.secure,
    auth: {
      user: smtpSettings.auth.user,
      pass: smtpSettings.auth.pass,
    },
    // Connection timeout and retry settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,
    socketTimeout: 20000,
    // Force IPv4 to avoid IPv6 network unreachable errors
    dnsOptions: {
      lookup: customLookup,
    },
  });

  return { transporter, smtpSettings };
}

/**
 * Send a single email
 * 
 * @param options - Email options (to, subject, html, etc.)
 * @returns Result object with success status and message ID or error
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Check if email notifications are enabled globally
    const notificationsEnabled = await areEmailNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('[EMAIL] Notifications disabled. Email not sent:', options.subject);
      return {
        success: false,
        error: 'Email notifications are disabled',
      };
    }

    const { transporter, smtpSettings } = await createTransporter();
    
    // Prepare email
    const mailOptions = {
      from: options.from || `"${smtpSettings.fromName}" <${smtpSettings.from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('[EMAIL] Sent successfully:', {
      to: mailOptions.to,
      subject: options.subject,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send email with retry logic
 * 
 * @param options - Email options
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 5000)
 * @returns Result object
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries: number = 3,
  retryDelay: number = 5000
): Promise<EmailResult> {
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options);
    
    if (result.success) {
      if (attempt > 1) {
        console.log(`[EMAIL] Sent successfully on attempt ${attempt}`);
      }
      return result;
    }
    
    lastError = result.error || 'Unknown error';
    
    if (attempt < maxRetries) {
      console.log(`[EMAIL] Retry attempt ${attempt}/${maxRetries} after ${retryDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.error('[EMAIL] Failed after all retries:', lastError);
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Send bulk emails (with rate limiting to avoid overwhelming SMTP server)
 * 
 * @param emails - Array of email options
 * @param delayBetweenEmails - Delay between each email in ms (default: 1000)
 * @returns Array of results
 */
export async function sendBulkEmails(
  emails: EmailOptions[],
  delayBetweenEmails: number = 1000
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  console.log(`[EMAIL] Sending ${emails.length} emails in bulk...`);
  
  for (let i = 0; i < emails.length; i++) {
    const result = await sendEmailWithRetry(emails[i]);
    results.push(result);
    
    // Add delay between emails to avoid overwhelming SMTP server
    if (i < emails.length - 1 && delayBetweenEmails > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`[EMAIL] Bulk send complete: ${successCount} success, ${failureCount} failed`);
  
  return results;
}

/**
 * Send templated email
 * 
 * @param to - Recipient email address(es)
 * @param template - Email template (subject and body)
 * @returns Result object
 */
export async function sendTemplatedEmail(
  to: string | string[],
  template: EmailTemplate
): Promise<EmailResult> {
  return sendEmailWithRetry({
    to,
    subject: template.subject,
    html: template.body,
  });
}

/**
 * Verify SMTP connection
 * 
 * @returns True if connection successful, false otherwise
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter } = await createTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'SMTP connection verified successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'SMTP connection failed',
    };
  }
}

/**
 * Send test email
 * 
 * @param to - Test recipient email
 * @returns Result object
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  const institutionSettings = await getInstitutionSettings();
  
  return sendEmail({
    to,
    subject: 'Test Email from CPMS',
    html: `
      <h2>Test Email - Campus Placement Management System</h2>
      <p>This is a test email to verify that the SMTP configuration is working correctly.</p>
      <p><strong>Institution:</strong> ${institutionSettings.institutionName}</p>
      <p>If you received this email, your email service is configured properly.</p>
      <hr>
      <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
    `,
  });
}
