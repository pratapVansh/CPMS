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

// ========== Super Admin Management ==========

const MAX_SUPER_ADMINS = 3;
const MIN_SUPER_ADMINS = 1;

/**
 * Create a new Super Admin with transaction to prevent race conditions
 * Maximum 3 Super Admins allowed
 */
export async function createSuperAdmin(input: CreateAdminInput, createdBy: string) {
  const { name, email, password } = input;

  return await prisma.$transaction(async (tx) => {
    // Count current super admins within transaction
    const superAdminCount = await tx.user.count({
      where: { role: Role.SUPER_ADMIN },
    });

    if (superAdminCount >= MAX_SUPER_ADMINS) {
      throw AppError.conflict(
        `Maximum ${MAX_SUPER_ADMINS} Super Admins allowed`,
        'MAX_SUPER_ADMIN_LIMIT'
      );
    }

    // Check if email already exists
    const existing = await tx.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw AppError.conflict('Email already exists', 'EMAIL_EXISTS');
    }

    // Hash password
    const hash = await hashPassword(password);

    // Create super admin
    const superAdmin = await tx.user.create({
      data: {
        name,
        email,
        password: hash,
        role: Role.SUPER_ADMIN,
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
        updatedAt: true,
      },
    });

    // Log the action
    await tx.auditLog.create({
      data: {
        userId: createdBy,
        action: 'CREATE_SUPER_ADMIN',
        target: superAdmin.id,
        meta: {
          email: superAdmin.email,
          name: superAdmin.name,
        },
      },
    });

    return superAdmin;
  });
}

/**
 * Delete a Super Admin permanently (hard delete)
 * Enforces all security rules with transaction
 */
export async function deleteSuperAdmin(targetId: string, deletedBy: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Prevent self-deletion
    if (targetId === deletedBy) {
      throw AppError.forbidden(
        'Cannot delete your own Super Admin account',
        'CANNOT_DELETE_SELF'
      );
    }

    // 2. Verify target is a super admin
    const targetSuperAdmin = await tx.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!targetSuperAdmin) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    if (targetSuperAdmin.role !== Role.SUPER_ADMIN) {
      throw AppError.forbidden(
        'Target user is not a Super Admin',
        'NOT_SUPER_ADMIN'
      );
    }

    // 3. Count remaining super admins
    const superAdminCount = await tx.user.count({
      where: { role: Role.SUPER_ADMIN },
    });

    if (superAdminCount <= MIN_SUPER_ADMINS) {
      throw AppError.forbidden(
        `Cannot delete the last Super Admin. At least ${MIN_SUPER_ADMINS} must exist.`,
        'LAST_SUPER_ADMIN'
      );
    }

    // 4. Delete related data first (cascade delete)
    // Delete refresh tokens
    await tx.refreshToken.deleteMany({
      where: { userId: targetId },
    });

    // Log the deletion action BEFORE deleting the user
    await tx.auditLog.create({
      data: {
        userId: deletedBy,
        action: 'DELETE_SUPER_ADMIN',
        target: targetId,
        meta: {
          deletedEmail: targetSuperAdmin.email,
          deletedName: targetSuperAdmin.name,
        },
      },
    });

    // 5. Hard delete the super admin
    await tx.user.delete({
      where: { id: targetId },
    });

    return {
      message: 'Super Admin deleted permanently',
      deleted: {
        id: targetSuperAdmin.id,
        email: targetSuperAdmin.email,
        name: targetSuperAdmin.name,
      },
    };
  });
}

/**
 * Get all Super Admins with metadata
 */
export async function getSuperAdmins() {
  const superAdmins = await prisma.user.findMany({
    where: { role: Role.SUPER_ADMIN },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const count = superAdmins.length;
  const canCreateMore = count < MAX_SUPER_ADMINS;
  const canDelete = count > MIN_SUPER_ADMINS;

  return {
    superAdmins,
    metadata: {
      total: count,
      max: MAX_SUPER_ADMINS,
      min: MIN_SUPER_ADMINS,
      canCreateMore,
      canDelete,
      slotsAvailable: MAX_SUPER_ADMINS - count,
    },
  };
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
