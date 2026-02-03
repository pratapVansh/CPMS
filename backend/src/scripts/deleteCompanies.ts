import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCompanies() {
  try {
    console.log('Starting to delete companies...');

    const companiesToDelete = ['Adobe', 'Alphabet', 'Microsoft', 'Google'];

    // Delete applications related to these companies first
    const deletedApplications = await prisma.application.deleteMany({
      where: {
        company: {
          name: {
            in: companiesToDelete
          }
        }
      }
    });
    console.log(`✓ Deleted ${deletedApplications.count} applications`);

    // Delete the companies
    const deletedCompanies = await prisma.company.deleteMany({
      where: {
        name: {
          in: companiesToDelete
        }
      }
    });
    console.log(`✓ Deleted ${deletedCompanies.count} companies`);

    console.log('\n✅ All specified companies have been deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting companies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteCompanies();
