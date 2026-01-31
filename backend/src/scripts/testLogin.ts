import { prisma } from '../config/db';
import { comparePassword } from '../utils/password';

async function main() {
  // Get test password from command line
  const testEmail = process.argv[2];
  const testPassword = process.argv[3];

  if (!testEmail || !testPassword) {
    console.log('Usage: npx ts-node src/scripts/testLogin.ts <email> <password>');
    process.exit(1);
  }

  console.log(`Testing login for: ${testEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }

  console.log('User found:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  console.log('Stored password hash:', user.password);
  console.log('Testing password:', testPassword);

  const isValid = await comparePassword(testPassword, user.password);
  console.log('Password valid:', isValid);

  if (user.status !== 'ACTIVE') {
    console.log('❌ Account is not active');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
