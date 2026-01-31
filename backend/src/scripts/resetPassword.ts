import { prisma } from '../config/db';
import { hashPassword } from '../utils/password';

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('Usage: npx ts-node src/scripts/resetPassword.ts <email> <newPassword>');
    process.exit(1);
  }

  const hashedPassword = await hashPassword(newPassword);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`✅ Password reset for ${user.email}`);
  console.log(`New password: ${newPassword}`);

  await prisma.$disconnect();
}

main().catch(console.error);
