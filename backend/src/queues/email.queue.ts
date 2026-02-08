import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export interface EmailJobData {
  userId: string;
  eventType: string;
  data: any;
  priority?: number;
}

export const emailQueue = new Queue<EmailJobData>('emailQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
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
  const job = await emailQueue.add('send-notification-email', data, {
    delay: options?.delay,
    priority: data.priority || options?.priority || 3,
  });
  console.log(`📧 Email job ${job.id} added to queue for user ${data.userId}`);
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
