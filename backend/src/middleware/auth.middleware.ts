import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { email: string; name: string };
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Access token not provided', 'NO_ACCESS_TOKEN');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      throw AppError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden('Account is disabled', 'ACCOUNT_DISABLED');
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.unauthorized('Invalid or expired access token', 'INVALID_ACCESS_TOKEN');
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Not authenticated', 'NOT_AUTHENTICATED');
    }

    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('Insufficient permissions', 'INSUFFICIENT_ROLE');
    }

    next();
  };
}

export const requireSuperAdmin = requireRole(Role.SUPER_ADMIN);
export const requireAdmin = requireRole(Role.SUPER_ADMIN, Role.ADMIN);
export const requireStudent = requireRole(Role.STUDENT);
export const requireAnyAdmin = requireRole(Role.SUPER_ADMIN, Role.ADMIN);

export async function requireVerifiedStudent(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('Not authenticated', 'NOT_AUTHENTICATED');
  }

  if (req.user.role !== Role.STUDENT) {
    next();
    return;
  }

  const student = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { verificationStatus: true },
  });

  if (!student) {
    throw AppError.unauthorized('User not found', 'USER_NOT_FOUND');
  }

  if (student.verificationStatus !== 'VERIFIED') {
    throw AppError.forbidden(
      'Your documents are not verified yet. To know more, contact the T&P office.',
      'NOT_VERIFIED'
    );
  }

  next();
}
