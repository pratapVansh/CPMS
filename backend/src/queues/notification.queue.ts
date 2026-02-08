/**
 * Notification Queue for CPMS
 * 
 * Manages the job queue for sending notifications (emails, SMS, push).
 * Uses BullMQ for reliable, persistent job processing.
 */

import { addEmailJob } from './email.queue';

export interface NotificationJobData {
  userId: string;
  eventType: string;
  data: any;
  channels: ('EMAIL' | 'SMS' | 'PUSH')[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

/**
 * Add notification job to appropriate queues
 * 
 * This function routes notifications to the correct channel queues
 */
export async function addNotificationJob(jobData: NotificationJobData): Promise<void> {
  const { channels, priority } = jobData;
  
  // Determine job priority for queue
  let queuePriority = 3; // Normal
  if (priority === 'LOW') queuePriority = 5;
  if (priority === 'HIGH') queuePriority = 2;
  if (priority === 'URGENT') queuePriority = 1;
  
  // Route to appropriate channel queues
  const promises = channels.map(async (channel) => {
    if (channel === 'EMAIL') {
      return addEmailJob({
        ...jobData,
        priority: queuePriority,
      });
    }
    
    // Future: Add SMS and PUSH queue handlers here
    if (channel === 'SMS') {
      console.log('[NOTIFICATION] SMS channel not yet implemented');
      // return addSMSJob(jobData);
    }
    
    if (channel === 'PUSH') {
      console.log('[NOTIFICATION] PUSH channel not yet implemented');
      // return addPushJob(jobData);
    }
  });
  
  await Promise.all(promises);
}
