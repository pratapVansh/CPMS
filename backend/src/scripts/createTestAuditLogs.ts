import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('\n📝 Creating test audit logs...\n');

  // Get super admin user
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!superAdmin) {
    console.log('❌ No super admin found!');
    process.exit(1);
  }

  // Create some test audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        action: 'LOGIN',
        target: null,
        meta: { ip: '127.0.0.1' },
      },
      {
        userId: superAdmin.id,
        action: 'VIEW_ADMINS',
        target: null,
        meta: {},
      },
      {
        userId: superAdmin.id,
        action: 'VIEW_AUDIT_LOGS',
        target: null,
        meta: {},
      },
    ],
  });

  console.log('✅ Test audit logs created!\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
