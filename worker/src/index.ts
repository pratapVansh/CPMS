import { Worker } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

console.log('🔌 Connecting to Redis:', {
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || '6379'
});

// Email worker
const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    console.log(`📧 Processing email job ${job.id}:`, job.name);
    
    try {
      // Process email job
      const { to, subject, body } = job.data;
      console.log(`Sending email to: ${to}`);
      
      // Add your email sending logic here
      // This could call backend API or external email service
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      
      return { success: true, jobId: job.id };
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

emailWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('🚀 Worker started and listening for email jobs...');

// Graceful shutdown
const shutdown = async () => {
  console.log('📴 Shutting down worker...');
  try {
    await emailWorker.close();
    await redisConnection.quit();
    console.log('👋 Worker shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);