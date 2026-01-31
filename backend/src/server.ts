import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { disconnectRedis } from './config/redis';
import { closeEmailQueue } from './queues/email.queue';
import { closeEmailWorker } from './jobs/email.worker';

const server = app.listen(env.PORT, async () => {
  await connectDatabase();
  console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`📧 Email worker started`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🛑 HTTP server closed');
    
    await closeEmailWorker();
    await closeEmailQueue();
    await disconnectDatabase();
    await disconnectRedis();
    
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
