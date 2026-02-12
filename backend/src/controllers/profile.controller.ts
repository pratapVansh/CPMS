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
      rollNo: true,
      cgpa: true,
      branch: true,
      currentYear: true,
      currentSemester: true,
      resumePublicId: true,
      resumeUrl: true,
      marksheetPublicId: true,
      marksheetUrl: true,
      verificationStatus: true,
      rejectionReason: true,
      verifiedBy: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  // Generate preview URLs for documents if they exist
  const resumePreviewUrl = student.resumePublicId
    ? cloudinaryService.generatePreviewUrl(student.resumePublicId)
    : null;
  const marksheetPreviewUrl = student.marksheetPublicId
    ? cloudinaryService.generatePreviewUrl(student.marksheetPublicId)
    : null;

  res.json({
    success: true,
    data: {
      profile: {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
        cgpa: student.cgpa,
        branch: student.branch,
        currentYear: student.currentYear,
        currentSemester: student.currentSemester,
        verificationStatus: student.verificationStatus,
        rejectionReason: student.rejectionReason,
        createdAt: student.createdAt,
        hasResume: !!student.resumePublicId,
        hasMarksheet: !!student.marksheetPublicId,
        resumeUrl: resumePreviewUrl,
        marksheetUrl: marksheetPreviewUrl,
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
    data: { 
      cgpa,
      verificationStatus: 'PENDING',
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: null,
    },
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

  console.log(`📝 Resume upload request from user: ${userId}`);

  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { resumePublicId: true, rollNo: true, email: true },
  });

  if (!currentUser) {
    console.error('❌ User not found:', userId);
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }

  console.log(`   User email: ${currentUser.email}`);
  console.log(`   Roll number: ${currentUser.rollNo || 'NOT SET'}`);

  if (!currentUser.rollNo) {
    console.error('❌ Roll number not set for user:', userId);
    throw AppError.badRequest(
      'Roll number is required to upload documents. Please contact your administrator to set your roll number.',
      'NO_ROLL_NUMBER'
    );
  }

  // Upload new resume to Cloudinary
  const uploadResult = await cloudinaryService.uploadDocument(
    req.file.buffer,
    currentUser.rollNo,
    'resume'
  );

  // Update database with new resume info
  await prisma.user.update({
    where: { id: userId },
    data: {
      resumePublicId: uploadResult.publicId,
      resumeUrl: uploadResult.secureUrl,
      verificationStatus: 'PENDING',
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: null,
    },
  });

  // Delete old resume from Cloudinary (after successful DB update)
  // Only delete if it's a different file (different public_id)
  if (currentUser?.resumePublicId && currentUser.resumePublicId !== uploadResult.publicId) {
    await cloudinaryService.deleteDocument(currentUser.resumePublicId);
  }

  // Generate preview URL for immediate use
  const previewUrl = cloudinaryService.generatePreviewUrl(uploadResult.publicId);

  res.json({
    success: true,
    data: {
      resumeUrl: previewUrl,
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

  console.log(`📝 Marksheet upload request from user: ${userId}`);

  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { marksheetPublicId: true, rollNo: true, email: true },
  });

  if (!currentUser) {
    console.error('❌ User not found:', userId);
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }

  console.log(`   User email: ${currentUser.email}`);
  console.log(`   Roll number: ${currentUser.rollNo || 'NOT SET'}`);

  if (!currentUser.rollNo) {
    console.error('❌ Roll number not set for user:', userId);
    throw AppError.badRequest(
      'Roll number is required to upload documents. Please contact your administrator to set your roll number.',
      'NO_ROLL_NUMBER'
    );
  }

  // Upload new marksheet to Cloudinary
  const uploadResult = await cloudinaryService.uploadDocument(
    req.file.buffer,
    currentUser.rollNo,
    'marksheet'
  );

  // Update database with new marksheet info
  await prisma.user.update({
    where: { id: userId },
    data: {
      marksheetPublicId: uploadResult.publicId,
      marksheetUrl: uploadResult.secureUrl,
      verificationStatus: 'PENDING',
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: null,
    },
  });

  // Delete old marksheet from Cloudinary (after successful DB update)
  // Only delete if it's a different file (different public_id)
  if (currentUser?.marksheetPublicId && currentUser.marksheetPublicId !== uploadResult.publicId) {
    await cloudinaryService.deleteDocument(currentUser.marksheetPublicId);
  }

  // Generate preview URL for immediate use
  const previewUrl = cloudinaryService.generatePreviewUrl(uploadResult.publicId);

  res.json({
    success: true,
    data: {
      marksheetUrl: previewUrl,
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
 * Get document preview URL (inline viewing)
 */
export async function getDocumentPreviewUrl(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { type } = req.params;

  if (type !== 'resume' && type !== 'marksheet') {
    throw AppError.badRequest('Invalid document type', 'INVALID_DOC_TYPE');
  }

  console.log(`👁️  Preview URL request for ${type} from user: ${req.user.userId}`);

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

  const previewUrl = cloudinaryService.generatePreviewUrl(publicId);

  res.json({
    success: true,
    data: {
      url: previewUrl,
      type,
    },
  });
}
