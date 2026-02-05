/**
 * Email Processor for CPMS Notification System
 * 
 * Processes email jobs from the queue and sends emails using the email service.
 * Handles retries, logging, and error tracking.
 */

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/db';
import { sendTemplatedEmail } from '../services/email.service';
import { getTemplateByEvent, TemplateVariables } from '../templates/emailTemplates';

export interface EmailJobData {
  userId: string;
  eventType: string;
  data: any;
  priority?: number;
}

/**
 * Get user email from database
 */
async function getUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  
  return user?.email || null;
}

/**
 * Process email job
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { data } = job;

  console.log(`[EMAIL WORKER] Processing job ${job.id} - Event: ${data.eventType} for user ${data.userId}`);

  try {
    // Get user email
    const userEmail = await getUserEmail(data.userId);
    if (!userEmail) {
      throw new Error(`User email not found for user ID: ${data.userId}`);
    }
    
    // Get email template
    const template = getTemplateByEvent(data.eventType, data.data as TemplateVariables);
    if (!template) {
      throw new Error(`No template found for event type: ${data.eventType}`);
    }
    
    // Send email
    const result = await sendTemplatedEmail(userEmail, template);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }
    
    console.log(`[EMAIL WORKER] ✅ Email sent successfully - Job ${job.id} - MessageID: ${result.messageId}`);
    
    // Log successful notification in audit log (optional)
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: 'EMAIL_SENT',
          target: data.eventType,
          meta: {
            recipient: userEmail,
            subject: template.subject,
            messageId: result.messageId,
          },
        },
      });
    } catch (auditError) {
      console.error('[EMAIL WORKER] Failed to log audit:', auditError);
      // Don't fail the job if audit logging fails
    }
    
  } catch (error: any) {
    console.error(`[EMAIL WORKER] ❌ Failed to process job ${job.id}:`, error.message);
    
    // Log failed attempt (but don't fail the job on logging failure)
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: 'EMAIL_FAILED',
          target: data.eventType,
          meta: {
            error: error.message,
            attempt: job.attemptsMade,
          },
        },
      });
    } catch (auditError) {
      console.error('[EMAIL WORKER] Failed to log failure:', auditError);
    }
    
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Create and start the email worker
 */
export const emailWorker = new Worker('emailQueue', processEmailJob, {
  connection: redisConnection,
  concurrency: 3, // Process 3 emails concurrently
  limiter: {
    max: 10, // Maximum 10 emails
    duration: 60000, // per minute (rate limiting to avoid SMTP issues)
  },
});

// Event handlers
emailWorker.on('completed', (job) => {
  console.log(`[EMAIL WORKER] ✅ Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EMAIL WORKER] ❌ Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
  
  if (job && job.attemptsMade >= 3) {
    console.error(`[EMAIL WORKER] 🚨 Job ${job.id} permanently failed - Manual intervention required`);
  }
});

emailWorker.on('error', (err) => {
  console.error('[EMAIL WORKER] Worker error:', err);
});

emailWorker.on('stalled', (jobId) => {
  console.warn(`[EMAIL WORKER] ⚠️ Job ${jobId} stalled`);
});

console.log('[EMAIL WORKER] Started and listening for jobs...');

export async function closeEmailWorker(): Promise<void> {
  await emailWorker.close();
  console.log('📧 Email worker closed');
}
