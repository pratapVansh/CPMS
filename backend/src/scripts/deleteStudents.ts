import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllStudents() {
  try {
    console.log('Starting to delete all student data...');

    // First delete all applications by students
    const deletedApplications = await prisma.application.deleteMany({
      where: {
        student: {
          role: 'STUDENT'
        }
      }
    });
    console.log(`✓ Deleted ${deletedApplications.count} applications`);

    // Then delete all student users
    const deletedStudents = await prisma.user.deleteMany({
      where: {
        role: 'STUDENT'
      }
    });
    console.log(`✓ Deleted ${deletedStudents.count} student accounts`);

    console.log('\n✅ All student data has been deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting students:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllStudents();
