import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/password';

export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateAdminInput {
  name?: string;
  email?: string;
  password?: string;
  status?: UserStatus;
}

export async function createAdmin(input: CreateAdminInput, createdBy: string) {
  const { name, email, password } = input;

  // Debug logging
  console.log('Creating admin with:', { name, email, passwordLength: password?.length, password: password?.substring(0, 3) + '***' });

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw AppError.conflict('Email already exists', 'EMAIL_EXISTS');
  }

  const hash = await hashPassword(password);
  console.log('Password hashed, hash length:', hash.length);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      createdBy,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  await logAction(createdBy, 'CREATE_ADMIN', admin.id, { email });

  return admin;
}

export async function getAdmins() {
  return prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      createdBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAdminById(id: string) {
  const admin = await prisma.user.findUnique({
    where: { id, role: Role.ADMIN },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      createdBy: true,
    },
  });

  if (!admin) {
    throw AppError.notFound('Admin not found', 'ADMIN_NOT_FOUND');
  }

  return admin;
}

export async function updateAdmin(id: string, input: UpdateAdminInput, updatedBy: string) {
  const admin = await prisma.user.findUnique({
    where: { id, role: Role.ADMIN },
  });

  if (!admin) {
    throw AppError.notFound('Admin not found', 'ADMIN_NOT_FOUND');
  }

  if (input.email && input.email !== admin.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw AppError.conflict('Email already exists', 'EMAIL_EXISTS');
    }
  }

  const data: any = {};
  if (input.name) data.name = input.name;
  if (input.email) data.email = input.email;
  if (input.status) data.status = input.status;
  if (input.password) data.password = await hashPassword(input.password);

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  await logAction(updatedBy, 'UPDATE_ADMIN', id, { changes: Object.keys(data) });

  return updated;
}

export async function disableAdmin(id: string, disabledBy: string) {
  const admin = await prisma.user.findUnique({
    where: { id, role: Role.ADMIN },
  });

  if (!admin) {
    throw AppError.notFound('Admin not found', 'ADMIN_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.DISABLED },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  await logAction(disabledBy, 'DISABLE_ADMIN', id, { email: admin.email });

  return updated;
}

export async function deleteAdmin(id: string, deletedBy: string) {
  const admin = await prisma.user.findUnique({
    where: { id, role: Role.ADMIN },
  });

  if (!admin) {
    throw AppError.notFound('Admin not found', 'ADMIN_NOT_FOUND');
  }

  await prisma.user.delete({ where: { id } });

  await logAction(deletedBy, 'DELETE_ADMIN', id, { email: admin.email });

  return { message: 'Admin deleted' };
}

async function logAction(userId: string, action: string, target?: string, meta?: any) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      target,
      meta,
    },
  });
}

export async function getAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
