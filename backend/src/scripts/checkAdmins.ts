import { prisma } from '../config/db';

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      password: true,
    },
  });

  console.log('Admins found:', admins.length);
  admins.forEach((admin) => {
    console.log({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      hasPassword: !!admin.password,
      passwordLength: admin.password?.length,
    });
  });

  await prisma.$disconnect();
}

main().catch(console.error);
