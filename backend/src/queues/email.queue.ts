import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export interface EmailJobData {
  studentEmail: string;
  companyName: string;
  studentName?: string;
  roleOffered?: string;
  type?: 'SHORTLIST_NOTIFICATION' | 'SELECTION_NOTIFICATION' | 'REJECTION_NOTIFICATION';
}

export const emailQueue = new Queue<EmailJobData>('emailQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 60 * 60, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 60 * 60, // 7 days
    },
  },
});

// Helper function to add email job
export async function addEmailJob(data: EmailJobData, options?: { delay?: number; priority?: number }) {
  const job = await emailQueue.add('send-email', data, {
    delay: options?.delay,
    priority: options?.priority,
  });
  console.log(`📧 Email job ${job.id} added to queue`);
  return job;
}

// Helper to get queue stats
export async function getEmailQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

// Close queue connection
export async function closeEmailQueue() {
  await emailQueue.close();
  console.log('📧 Email queue closed');
}
