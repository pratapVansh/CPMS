import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import * as cloudinaryService from '../services/cloudinary.service';

// Validation schemas
const updateCpiSchema = z.object({
  cgpa: z.number().min(0).max(10),
});

const updateYearSemesterSchema = z.object({
  currentYear: z.number().min(1).max(4).nullable(),
  currentSemester: z.number().min(1).max(8).nullable(),
});

/**
 * Get student profile with documents
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const student = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      cgpa: true,
      branch: true,
      currentYear: true,
      currentSemester: true,
      resumePublicId: true,
      resumeUrl: true,
      marksheetPublicId: true,
      marksheetUrl: true,
      createdAt: true,
    },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  // Generate signed URLs for documents if they exist
  const resumeSignedUrl = student.resumePublicId
    ? cloudinaryService.generateSignedUrl(student.resumePublicId)
    : null;
  const marksheetSignedUrl = student.marksheetPublicId
    ? cloudinaryService.generateSignedUrl(student.marksheetPublicId)
    : null;

  res.json({
    success: true,
    data: {
      profile: {
        id: student.id,
        name: student.name,
        email: student.email,
        cgpa: student.cgpa,
        branch: student.branch,
        currentYear: student.currentYear,
        currentSemester: student.currentSemester,
        createdAt: student.createdAt,
        hasResume: !!student.resumePublicId,
        hasMarksheet: !!student.marksheetPublicId,
        resumeUrl: resumeSignedUrl,
        marksheetUrl: marksheetSignedUrl,
      },
    },
  });
}

/**
 * Update student CPI/CGPA
 */
export async function updateCpi(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { cgpa } = updateCpiSchema.parse(req.body);

  const updatedStudent = await prisma.user.update({
    where: { id: req.user.userId },
    data: { cgpa },
    select: {
      id: true,
      cgpa: true,
    },
  });

  res.json({
    success: true,
    data: {
      cgpa: updatedStudent.cgpa,
    },
    message: 'CPI updated successfully',
  });
}

/**
 * Update student year and semester
 */
export async function updateYearSemester(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { currentYear, currentSemester } = updateYearSemesterSchema.parse(req.body);

  const updatedStudent = await prisma.user.update({
    where: { id: req.user.userId },
    data: { 
      currentYear,
      currentSemester,
    },
    select: {
      id: true,
      currentYear: true,
      currentSemester: true,
    },
  });

  res.json({
    success: true,
    data: {
      currentYear: updatedStudent.currentYear,
      currentSemester: updatedStudent.currentSemester,
    },
    message: 'Year and semester updated successfully',
  });
}

/**
 * Upload resume
 */
export async function uploadResume(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  if (!req.file) {
    throw AppError.badRequest('No file uploaded', 'NO_FILE');
  }

  const userId = req.user.userId;

  // Get current resume public_id to delete later
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { resumePublicId: true },
  });

  // Upload new resume to Cloudinary
  const uploadResult = await cloudinaryService.uploadDocument(
    req.file.buffer,
    userId,
    'resume'
  );

  // Update database with new resume info
  await prisma.user.update({
    where: { id: userId },
    data: {
      resumePublicId: uploadResult.publicId,
      resumeUrl: uploadResult.secureUrl,
    },
  });

  // Delete old resume from Cloudinary (after successful DB update)
  if (currentUser?.resumePublicId) {
    await cloudinaryService.deleteDocument(currentUser.resumePublicId);
  }

  // Generate signed URL for immediate use
  const signedUrl = cloudinaryService.generateSignedUrl(uploadResult.publicId);

  res.json({
    success: true,
    data: {
      resumeUrl: signedUrl,
    },
    message: 'Resume uploaded successfully',
  });
}

/**
 * Upload marksheet
 */
export async function uploadMarksheet(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  if (!req.file) {
    throw AppError.badRequest('No file uploaded', 'NO_FILE');
  }

  const userId = req.user.userId;

  // Get current marksheet public_id to delete later
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { marksheetPublicId: true },
  });

  // Upload new marksheet to Cloudinary
  const uploadResult = await cloudinaryService.uploadDocument(
    req.file.buffer,
    userId,
    'marksheet'
  );

  // Update database with new marksheet info
  await prisma.user.update({
    where: { id: userId },
    data: {
      marksheetPublicId: uploadResult.publicId,
      marksheetUrl: uploadResult.secureUrl,
    },
  });

  // Delete old marksheet from Cloudinary (after successful DB update)
  if (currentUser?.marksheetPublicId) {
    await cloudinaryService.deleteDocument(currentUser.marksheetPublicId);
  }

  // Generate signed URL for immediate use
  const signedUrl = cloudinaryService.generateSignedUrl(uploadResult.publicId);

  res.json({
    success: true,
    data: {
      marksheetUrl: signedUrl,
    },
    message: 'Marksheet uploaded successfully',
  });
}

/**
 * Delete resume
 */
export async function deleteResume(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const userId = req.user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { resumePublicId: true },
  });

  if (!user?.resumePublicId) {
    throw AppError.notFound('No resume found', 'RESUME_NOT_FOUND');
  }

  // Delete from Cloudinary
  await cloudinaryService.deleteDocument(user.resumePublicId);

  // Update database
  await prisma.user.update({
    where: { id: userId },
    data: {
      resumePublicId: null,
      resumeUrl: null,
    },
  });

  res.json({
    success: true,
    message: 'Resume deleted successfully',
  });
}

/**
 * Delete marksheet
 */
export async function deleteMarksheet(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const userId = req.user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marksheetPublicId: true },
  });

  if (!user?.marksheetPublicId) {
    throw AppError.notFound('No marksheet found', 'MARKSHEET_NOT_FOUND');
  }

  // Delete from Cloudinary
  await cloudinaryService.deleteDocument(user.marksheetPublicId);

  // Update database
  await prisma.user.update({
    where: { id: userId },
    data: {
      marksheetPublicId: null,
      marksheetUrl: null,
    },
  });

  res.json({
    success: true,
    message: 'Marksheet deleted successfully',
  });
}

/**
 * Get document download URL (for viewing)
 * This endpoint generates a fresh signed URL
 */
export async function getDocumentUrl(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { type } = req.params;

  if (type !== 'resume' && type !== 'marksheet') {
    throw AppError.badRequest('Invalid document type', 'INVALID_DOC_TYPE');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      resumePublicId: true,
      marksheetPublicId: true,
    },
  });

  if (!user) {
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }

  const publicId = type === 'resume' ? user.resumePublicId : user.marksheetPublicId;

  if (!publicId) {
    throw AppError.notFound(`No ${type} found`, 'DOCUMENT_NOT_FOUND');
  }

  const signedUrl = cloudinaryService.generateSignedUrl(publicId);

  res.json({
    success: true,
    data: {
      url: signedUrl,
      type,
    },
  });
}
