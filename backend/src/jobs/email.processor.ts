import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';

interface ShortlistNotificationData {
  type: 'SHORTLIST_NOTIFICATION';
  to: string;
  studentName: string;
  companyName: string;
  roleOffered: string;
  applicationId: string;
}

type EmailJobData = ShortlistNotificationData;

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { data } = job;

  console.log(`Processing email job: ${job.id}`);

  switch (data.type) {
    case 'SHORTLIST_NOTIFICATION':
      await sendShortlistNotification(data);
      break;
    default:
      console.warn(`Unknown email job type: ${(data as EmailJobData).type}`);
  }
}

async function sendShortlistNotification(data: ShortlistNotificationData): Promise<void> {
  // TODO: Implement actual email sending (e.g., using nodemailer, SendGrid, etc.)
  console.log(`📧 Sending shortlist notification email:`);
  console.log(`   To: ${data.to}`);
  console.log(`   Student: ${data.studentName}`);
  console.log(`   Company: ${data.companyName}`);
  console.log(`   Role: ${data.roleOffered}`);
  
  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  console.log(`✅ Email sent successfully for application: ${data.applicationId}`);
}

// Create the email worker
export const emailWorker = new Worker('email', processEmailJob, {
  connection: redisConnection,
  concurrency: 5,
});

emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('Email worker error:', err);
});

export async function closeEmailWorker(): Promise<void> {
  await emailWorker.close();
  console.log('📧 Email worker closed');
}
