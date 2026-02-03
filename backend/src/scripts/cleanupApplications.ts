import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupApplications() {
  try {
    console.log('Cleaning up all applications...\n');

    // Delete all applications
    const result = await prisma.application.deleteMany({});
    
    console.log(`✓ Deleted ${result.count} applications`);
    console.log('\n✅ All applications have been cleaned up!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupApplications();
