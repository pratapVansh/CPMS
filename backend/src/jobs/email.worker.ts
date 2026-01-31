import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { EmailJobData } from '../queues/email.queue';

async function processEmail(job: Job<EmailJobData>): Promise<void> {
  const { studentEmail, companyName, studentName, roleOffered, type } = job.data;

  console.log(`\n========================================`);
  console.log(`📧 Processing Email Job: ${job.id}`);
  console.log(`========================================`);
  console.log(`To: ${studentEmail}`);
  console.log(`Company: ${companyName}`);
  if (studentName) console.log(`Student: ${studentName}`);
  if (roleOffered) console.log(`Role: ${roleOffered}`);
  if (type) console.log(`Type: ${type}`);
  console.log(`Attempt: ${job.attemptsMade + 1}`);
  console.log(`----------------------------------------`);

  // Simulate email sending delay
  await simulateEmailSending();

  console.log(`✅ Email sent successfully to ${studentEmail}`);
  console.log(`========================================\n`);
}

async function simulateEmailSending(): Promise<void> {
  // Simulate network delay (1-2 seconds)
  const delay = 1000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Create the email worker
export const emailWorker = new Worker<EmailJobData>('emailQueue', processEmail, {
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000, // Max 10 jobs per second
  },
});

// Event listeners
emailWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
  if (job && job.attemptsMade < (job.opts.attempts || 3)) {
    console.log(`🔄 Will retry (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);
  }
});

emailWorker.on('error', (err) => {
  console.error('Worker error:', err.message);
});

emailWorker.on('ready', () => {
  console.log('📧 Email worker is ready');
});

// Close worker
export async function closeEmailWorker(): Promise<void> {
  await emailWorker.close();
  console.log('📧 Email worker closed');
}
