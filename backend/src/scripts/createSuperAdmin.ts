import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q: string): Promise<string> => {
  return new Promise((r) => rl.question(q, r));
};

async function main() {
  console.log('\n🔐 CPMS Super Admin Setup\n');

  const existing = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });

  if (existing) {
    console.log('❌ Super Admin already exists!');
    console.log(`Email: ${existing.email}`);
    console.log('\nOnly one Super Admin is allowed.');
    process.exit(1);
  }

  let email = process.env.SUPER_ADMIN_EMAIL;
  let password = process.env.SUPER_ADMIN_PASSWORD;
  let name = process.env.SUPER_ADMIN_NAME;

  if (!email || !password || !name) {
    console.log('Enter Super Admin details:\n');
    name = await ask('Name: ');
    email = await ask('Email: ');
    password = await ask('Password (min 8 chars): ');
  }

  if (!name || name.length < 2) {
    console.log('❌ Name must be at least 2 characters');
    process.exit(1);
  }

  if (!email || !email.includes('@')) {
    console.log('❌ Invalid email');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.log('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('\n✅ Super Admin created successfully!');
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Name: ${user.name}`);
  console.log('\n🔒 Keep these credentials safe!\n');

  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
