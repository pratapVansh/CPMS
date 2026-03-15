/**
 * CPMS Email Worker
 *
 * Standalone BullMQ worker that processes email jobs from the 'emailQueue'.
 * Connects to the same Redis and PostgreSQL instances as the backend.
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { prisma, connectDatabase, disconnectDatabase } from './config/db';
import { sendTemplatedEmail } from './services/email.service';
import { getTemplateByEvent, TemplateVariables } from './templates/emailTemplates';

dotenv.config();

// ── Redis connection ──────────────────────────────────────────────────────────
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => console.log('✅ Redis connected'));
redisConnection.on('error', (err) => console.error('❌ Redis error:', err.message));

console.log('🔌 Connecting to Redis:', {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || '6379',
});

// ── Job types ─────────────────────────────────────────────────────────────────
interface EmailJobData {
  userId: string;
  eventType: string;
  data: TemplateVariables;
  priority?: number;
  messageLogId?: string;
  directEmail?: {
    to: string;
    subject: string;
    html: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getUserInfo(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, rollNo: true },
  });
}

async function getInstitutionName(): Promise<string> {
  const settings = await prisma.systemSettings.findFirst({
    select: { institutionName: true },
  });
  return settings?.institutionName || 'Institution';
}

// ── Job processor ─────────────────────────────────────────────────────────────
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { data } = job;

  console.log(
    `[EMAIL WORKER] Processing job ${job.id} — Event: ${data.eventType} for user ${data.userId}`
  );

  // Campaign emails carry pre-rendered subject + html and bypass the template engine
  if (data.eventType === 'CAMPAIGN_EMAIL' && data.directEmail) {
    const { to, subject, html } = data.directEmail;
    const result = await sendTemplatedEmail(to, { subject, body: html });
    if (!result.success) {
      throw new Error(result.error || 'Failed to send campaign email');
    }
    if (data.messageLogId) {
      await prisma.messageLog.update({
        where: { id: data.messageLogId },
        data: {
          deliveryStatus: 'SENT',
          sentAt: new Date(),
          messageId: result.messageId,
          attempts: job.attemptsMade + 1,
        },
      });
    }
    console.log(`[EMAIL WORKER] ✅ Campaign email sent — Job ${job.id}`);
    return;
  }

  // Get user info from database
  const user = await getUserInfo(data.userId);
  if (!user || !user.email) {
    throw new Error(`User email not found for user ID: ${data.userId}`);
  }

  // Build template variables — merge job data with fresh DB values
  const institutionName = await getInstitutionName();
  const templateVars: TemplateVariables = {
    ...data.data,
    studentName: data.data?.studentName || user.name,
    studentRollNo: data.data?.studentRollNo || user.rollNo || undefined,
    institutionName: data.data?.institutionName || institutionName,
  };

  // Get email template
  const template = getTemplateByEvent(data.eventType, templateVars);
  if (!template) {
    throw new Error(`No template found for event type: ${data.eventType}`);
  }

  // Send email
  const result = await sendTemplatedEmail(user.email, template);
  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }

  console.log(
    `[EMAIL WORKER] ✅ Email sent — Job ${job.id} — MessageID: ${result.messageId}`
  );

  // Write audit log (non-blocking: failure here must not fail the job)
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: 'EMAIL_SENT',
        target: data.eventType,
        meta: {
          recipient: user.email,
          subject: template.subject,
          messageId: result.messageId,
        },
      },
    });
  } catch (auditError) {
    console.error('[EMAIL WORKER] Failed to write audit log:', auditError);
  }
}

// ── Worker ────────────────────────────────────────────────────────────────────
// Queue name MUST match backend/src/queues/email.queue.ts: 'emailQueue'
const emailWorker = new Worker<EmailJobData>('emailQueue', processEmailJob, {
  connection: redisConnection,
  concurrency: 3,
  limiter: {
    max: 10,         // max 10 emails
    duration: 60000, // per 60 seconds
  },
});

emailWorker.on('completed', (job) => {
  console.log(`[EMAIL WORKER] ✅ Job ${job.id} completed`);
});

emailWorker.on('failed', async (job, err) => {
  console.error(
    `[EMAIL WORKER] ❌ Job ${job?.id} failed after ${job?.attemptsMade} attempt(s): ${err.message}`
  );
  if (job && job.attemptsMade >= 3) {
    console.error(`[EMAIL WORKER] 🚨 Job ${job.id} permanently failed — manual review required`);
    if (job.data.messageLogId) {
      await prisma.messageLog.update({
        where: { id: job.data.messageLogId },
        data: {
          deliveryStatus: 'FAILED',
          error: err.message,
          attempts: job.attemptsMade,
        },
      }).catch(e => console.error('[EMAIL WORKER] Failed to update message log:', e));
    }
  }
});

emailWorker.on('error', (err) => {
  console.error('[EMAIL WORKER] Worker error:', err);
});

emailWorker.on('stalled', (jobId) => {
  console.warn(`[EMAIL WORKER] ⚠️ Job ${jobId} stalled`);
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  await connectDatabase();
  console.log('🚀 CPMS Email Worker started — listening on queue: emailQueue');
}

start().catch((err) => {
  console.error('❌ Worker failed to start:', err);
  process.exit(1);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received — shutting down worker...`);
  try {
    await emailWorker.close();
    await redisConnection.quit();
    await disconnectDatabase();
    console.log('👋 Worker shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[EMAIL WORKER] Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[EMAIL WORKER] Uncaught exception:', error);
  process.exit(1);
});
