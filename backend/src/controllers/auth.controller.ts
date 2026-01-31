import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/AppError';
import * as cloudinaryService from '../services/cloudinary.service';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  cgpa: z.string().transform((val) => val ? parseFloat(val) : undefined).optional(),
  branch: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response): Promise<void> {
  const validatedData = registerSchema.parse(req.body);

  // Handle file uploads
  let resumeData: { publicId: string; url: string } | undefined;
  let marksheetData: { publicId: string; url: string } | undefined;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  // First create the user to get the userId
  const result = await authService.register({
    name: validatedData.name,
    email: validatedData.email,
    password: validatedData.password,
    cgpa: validatedData.cgpa,
    branch: validatedData.branch,
  });

  // Upload files to Cloudinary if provided
  try {
    if (files?.resume?.[0]) {
      const uploadResult = await cloudinaryService.uploadDocument(
        files.resume[0].buffer,
        result.user.id,
        'resume'
      );
      resumeData = { publicId: uploadResult.publicId, url: uploadResult.secureUrl };
    }

    if (files?.marksheet?.[0]) {
      const uploadResult = await cloudinaryService.uploadDocument(
        files.marksheet[0].buffer,
        result.user.id,
        'marksheet'
      );
      marksheetData = { publicId: uploadResult.publicId, url: uploadResult.secureUrl };
    }

    // Update user with document info if files were uploaded
    if (resumeData || marksheetData) {
      await authService.updateUserDocuments(result.user.id, {
        resumePublicId: resumeData?.publicId,
        resumeUrl: resumeData?.url,
        marksheetPublicId: marksheetData?.publicId,
        marksheetUrl: marksheetData?.url,
      });
    }
  } catch (uploadError) {
    // Log error but don't fail registration
    console.error('File upload error during registration:', uploadError);
  }

  // Set refresh token in HTTP-only cookie
  res.cookie(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const validatedData = loginSchema.parse(req.body);

  const result = await authService.login(validatedData);

  // Set refresh token in HTTP-only cookie
  res.cookie(REFRESH_TOKEN_COOKIE, result.tokens.refreshToken, COOKIE_OPTIONS);

  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    throw AppError.unauthorized('Refresh token not provided', 'NO_REFRESH_TOKEN');
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  // Clear the cookie
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  await authService.logoutAllDevices(userId);

  // Clear the cookie
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
}
