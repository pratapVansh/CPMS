import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('\n🗑️  Deleting Super Admin...\n');

  const existing = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });

  if (!existing) {
    console.log('❌ No Super Admin found!');
    process.exit(1);
  }

  console.log(`Found Super Admin: ${existing.email}`);

  await prisma.user.delete({
    where: { id: existing.id },
  });

  console.log('✅ Super Admin deleted successfully!\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
