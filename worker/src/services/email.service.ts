/**
 * Email Service for CPMS Worker
 *
 * Handles all email sending operations using SMTP configuration from database.
 * Decrypts the stored SMTP password before use.
 */

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import dns from 'dns';
import crypto from 'crypto';
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

// ── SMTP password decryption ──────────────────────────────────────────────────
// Must match the ENCRYPTION_KEY used in backend settings.service.ts
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY ||
  'cpms-default-key-change-in-production-32';
const ALGORITHM = 'aes-256-cbc';

function decryptPassword(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    // If decryption fails the value was likely stored in plain text (dev mode)
    return encryptedText;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Settings cache ────────────────────────────────────────────────────────────
// systemSettings change very rarely; a 60s TTL avoids one DB call per email
type SystemSettings = NonNullable<Awaited<ReturnType<typeof prisma.systemSettings.findFirst>>>;
let _settingsCache: SystemSettings | null = null;
let _settingsCacheExpiry = 0;
const SETTINGS_CACHE_TTL_MS = 60_000;

async function getSystemSettings(): Promise<SystemSettings | null> {
  if (_settingsCache && Date.now() < _settingsCacheExpiry) {
    return _settingsCache;
  }
  const settings = await prisma.systemSettings.findFirst();
  _settingsCache = settings;
  _settingsCacheExpiry = Date.now() + SETTINGS_CACHE_TTL_MS;
  return settings;
}
// ─────────────────────────────────────────────────────────────────────────────

async function getSMTPSettings() {
  const settings = await getSystemSettings();

  if (!settings || !settings.smtpHost || !settings.smtpUser) {
    throw new Error(
      'SMTP settings not configured. Please configure email settings in the admin panel.'
    );
  }

  // Decrypt the password before passing it to nodemailer
  const plainPassword = settings.smtpPassword
    ? decryptPassword(settings.smtpPassword)
    : '';

  return {
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure ?? false,
    auth: {
      user: settings.smtpUser,
      pass: plainPassword,
    },
    from: settings.emailFrom || settings.smtpUser,
    fromName: settings.emailFromName || 'Placement Cell',
  };
}

async function getInstitutionSettings() {
  const settings = await getSystemSettings();
  return {
    institutionName: settings?.institutionName || 'Institution',
    institutionEmail: settings?.contactEmail || '',
    institutionPhone: settings?.contactPhone || '',
  };
}

export async function areEmailNotificationsEnabled(): Promise<boolean> {
  const settings = await getSystemSettings();
  return settings?.emailNotifications ?? true;
}

export async function isNotificationTypeEnabled(type: string): Promise<boolean> {
  const settings = await getSystemSettings();
  if (!settings) return true;
  switch (type) {
    case 'APPLICATION_STATUS':
      return settings.notifyApplicationStatus ?? true;
    case 'NEW_DRIVE':
      return settings.notifyNewDrive ?? true;
    default:
      return settings.emailNotifications ?? true;
  }
}

// Force IPv4 to avoid ENETUNREACH on EC2 instances without IPv6
const lookup4 = promisify(dns.lookup);
const customLookup = async (hostname: string, _options: unknown, callback: Function) => {
  try {
    const result = await lookup4(hostname, { family: 4, all: false });
    callback(null, result.address, 4);
  } catch (error) {
    callback(error);
  }
};

async function createTransporter() {
  const smtpSettings = await getSMTPSettings();

  const transportOptions = {
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.secure,
    auth: {
      user: smtpSettings.auth.user,
      pass: smtpSettings.auth.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 20000,
    dnsOptions: { lookup: customLookup },
  } as SMTPTransport.Options;

  return { transporter: nodemailer.createTransport(transportOptions), smtpSettings };
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const notificationsEnabled = await areEmailNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('[EMAIL] Notifications disabled. Email not sent:', options.subject);
      return { success: false, error: 'Email notifications are disabled' };
    }

    const { transporter, smtpSettings } = await createTransporter();

    const mailOptions = {
      from: options.from || `"${smtpSettings.fromName}" <${smtpSettings.from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('[EMAIL] Sent successfully:', {
      to: mailOptions.to,
      subject: options.subject,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries = 3,
  retryDelay = 5000
): Promise<EmailResult> {
  let lastError = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options);
    if (result.success) return result;

    lastError = result.error || 'Unknown error';
    if (attempt < maxRetries) {
      console.log(`[EMAIL] Retry attempt ${attempt}/${maxRetries} after ${retryDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  console.error('[EMAIL] Failed after all retries:', lastError);
  return { success: false, error: `Failed after ${maxRetries} attempts: ${lastError}` };
}

export async function sendTemplatedEmail(
  to: string | string[],
  template: EmailTemplate
): Promise<EmailResult> {
  return sendEmailWithRetry({ to, subject: template.subject, html: template.body });
}

export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter } = await createTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'SMTP connection failed' };
  }
}

export async function sendTestEmail(to: string): Promise<EmailResult> {
  const inst = await getInstitutionSettings();
  return sendEmail({
    to,
    subject: 'Test Email from CPMS',
    html: `
      <h2>Test Email - Campus Placement Management System</h2>
      <p>This is a test email to verify that the SMTP configuration is working correctly.</p>
      <p><strong>Institution:</strong> ${inst.institutionName}</p>
      <p>If you received this email, your email service is configured properly.</p>
      <hr>
      <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
    `,
  });
}
