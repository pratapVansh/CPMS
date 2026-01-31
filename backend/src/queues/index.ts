import { Queue, Worker, QueueEvents } from 'bullmq';
import { redisConnection } from '../config/redis';

// Queue factory function
export function createQueue(name: string): Queue {
  return new Queue(name, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
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
}

// Worker factory function
export function createWorker<T>(
  queueName: string,
  processor: (job: { data: T; id?: string }) => Promise<void>
): Worker {
  return new Worker(queueName, processor, {
    connection: redisConnection,
    concurrency: 5,
  });
}

// Queue events factory function
export function createQueueEvents(queueName: string): QueueEvents {
  return new QueueEvents(queueName, {
    connection: redisConnection,
  });
}

// Queues will be defined here
// export const emailQueue = createQueue('email');
// export const notificationQueue = createQueue('notification');
