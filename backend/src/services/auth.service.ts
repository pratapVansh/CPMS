import { Role } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  getRefreshTokenExpiryDate,
  TokenPayload,
} from '../utils/jwt';
import { notifyStudentRegistration } from './notification.service';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  cgpa?: number;
  branch?: string;
  currentYear?: number;
  currentSemester?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  tokens: AuthTokens;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { name, email, password, cgpa, branch, currentYear, currentSemester } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw AppError.conflict('User with this email already exists', 'EMAIL_EXISTS');
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.STUDENT,
      cgpa,
      branch,
      currentYear,
      currentSemester,
    },
  });

  // Generate tokens
  const tokens = await generateTokens({ userId: user.id, role: user.role });

  // Send welcome email notification (async, don't wait)
  notifyStudentRegistration(user.id).catch(error => {
    console.error('Failed to send welcome email:', error);
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    tokens,
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'ACTIVE') {
    throw AppError.forbidden('Account is disabled', 'ACCOUNT_DISABLED');
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const tokens = await generateTokens({ userId: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    tokens,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  // Verify the refresh token
  let payload: TokenPayload;
  try {
    const decoded = verifyToken(refreshToken);
    payload = { userId: decoded.userId, role: decoded.role };
  } catch {
    throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw AppError.unauthorized('Refresh token not found', 'REFRESH_TOKEN_NOT_FOUND');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw AppError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
  }

  // Generate new access token
  const accessToken = generateAccessToken(payload);

  return { accessToken };
}

export async function logout(refreshToken: string): Promise<void> {
  // Delete refresh token from database
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

export async function logoutAllDevices(userId: string): Promise<void> {
  // Delete all refresh tokens for the user
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

async function generateTokens(payload: TokenPayload): Promise<AuthTokens> {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: payload.userId,
      expiresAt: getRefreshTokenExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

export interface UpdateDocumentsInput {
  resumePublicId?: string;
  resumeUrl?: string;
  marksheetPublicId?: string;
  marksheetUrl?: string;
}

export async function updateUserDocuments(
  userId: string,
  documents: UpdateDocumentsInput
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(documents.resumePublicId && { resumePublicId: documents.resumePublicId }),
      ...(documents.resumeUrl && { resumeUrl: documents.resumeUrl }),
      ...(documents.marksheetPublicId && { marksheetPublicId: documents.marksheetPublicId }),
      ...(documents.marksheetUrl && { marksheetUrl: documents.marksheetUrl }),
    },
  });
}
