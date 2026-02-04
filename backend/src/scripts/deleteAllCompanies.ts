import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';

const prisma = new PrismaClient();

async function deleteAllCompanies() {
  try {
    console.log('Checking current companies in database...\n');

    // List all companies first
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, roleOffered: true }
    });

    if (companies.length === 0) {
      console.log('No companies found in database.');
      return;
    }

    console.log(`Found ${companies.length} companies:`);
    companies.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} - ${c.roleOffered}`);
    });

    console.log('\nDeleting all companies and their applications...');

    // Delete all applications first
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(`✓ Deleted ${deletedApplications.count} applications`);

    // Delete all companies
    const deletedCompanies = await prisma.company.deleteMany({});
    console.log(`✓ Deleted ${deletedCompanies.count} companies`);

    // Clear Redis cache
    console.log('\nClearing Redis cache...');
    const keys = await redis.keys('eligible_companies:*');
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`✓ Cleared ${keys.length} cache entries`);
    } else {
      console.log('✓ No cache entries to clear');
    }

    console.log('\n✅ All companies have been completely removed from the system!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllCompanies();
