import { Request, Response } from 'express';
import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';
import * as adminService from '../services/admin.service';
import { AppError } from '../utils/AppError';
import { prisma } from '../config/db';
import * as cloudinaryService from '../services/cloudinary.service';

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(2).max(200),
  roleOffered: z.string().min(2).max(200),
  minCgpa: z.number().min(0).max(10),
  allowedBranches: z.array(z.string()).default([]),
  deadline: z.string().datetime(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
});

export async function createCompany(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const validatedData = createCompanySchema.parse(req.body);

  const company = await adminService.createCompany({
    ...validatedData,
    deadline: new Date(validatedData.deadline),
  });

  res.status(201).json({
    success: true,
    data: {
      company,
    },
    message: 'Company placement drive created successfully',
  });
}

export async function getCompanyApplicants(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id: companyId } = req.params;
  const { page, limit } = paginationSchema.parse(req.query);

  if (!companyId) {
    throw AppError.badRequest('Company ID is required', 'MISSING_COMPANY_ID');
  }

  const result = await adminService.getCompanyApplicants(companyId, {
    page,
    limit: Math.min(limit, 100),
  });

  res.json({
    success: true,
    data: result,
  });
}

export async function updateApplicationStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id: applicationId } = req.params;
  const { status } = updateStatusSchema.parse(req.body);

  if (!applicationId) {
    throw AppError.badRequest('Application ID is required', 'MISSING_APPLICATION_ID');
  }

  const application = await adminService.updateApplicationStatus({
    applicationId,
    status,
  });

  res.json({
    success: true,
    data: {
      application,
    },
    message: `Application status updated to ${status}`,
  });
}

export async function getAllCompanies(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { page, limit } = paginationSchema.parse(req.query);

  const result = await adminService.getAllCompanies({
    page,
    limit: Math.min(limit, 50),
  });

  res.json({
    success: true,
    data: result,
  });
}

export async function getStats(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const stats = await adminService.getApplicationStats();

  res.json({
    success: true,
    data: {
      stats,
    },
  });
}

/**
 * Get all students with their documents
 */
export async function getAllStudents(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        cgpa: true,
        branch: true,
        resumePublicId: true,
        marksheetPublicId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Math.min(limit, 50),
    }),
    prisma.user.count({
      where: { role: 'STUDENT' },
    }),
  ]);

  // Add flags for document availability
  const studentsWithFlags = students.map((student) => ({
    ...student,
    hasResume: !!student.resumePublicId,
    hasMarksheet: !!student.marksheetPublicId,
    resumePublicId: undefined,
    marksheetPublicId: undefined,
  }));

  res.json({
    success: true,
    data: {
      students: studentsWithFlags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + students.length < total,
      },
    },
  });
}

/**
 * Get a specific student's profile with documents
 */
export async function getStudentProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id: studentId } = req.params;

  const student = await prisma.user.findFirst({
    where: { 
      id: studentId,
      role: 'STUDENT',
    },
    select: {
      id: true,
      name: true,
      email: true,
      cgpa: true,
      branch: true,
      resumePublicId: true,
      marksheetPublicId: true,
      createdAt: true,
      applications: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
              roleOffered: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  // Generate signed URLs if documents exist
  const resumeUrl = student.resumePublicId
    ? cloudinaryService.generateSignedUrl(student.resumePublicId)
    : null;
  const marksheetUrl = student.marksheetPublicId
    ? cloudinaryService.generateSignedUrl(student.marksheetPublicId)
    : null;

  res.json({
    success: true,
    data: {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        cgpa: student.cgpa,
        branch: student.branch,
        createdAt: student.createdAt,
        hasResume: !!student.resumePublicId,
        hasMarksheet: !!student.marksheetPublicId,
        resumeUrl,
        marksheetUrl,
        applications: student.applications,
      },
    },
  });
}

/**
 * Get a student's document (generates signed URL)
 */
export async function getStudentDocument(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id: studentId, type } = req.params;

  if (type !== 'resume' && type !== 'marksheet') {
    throw AppError.badRequest('Invalid document type', 'INVALID_DOC_TYPE');
  }

  const student = await prisma.user.findFirst({
    where: { 
      id: studentId,
      role: 'STUDENT',
    },
    select: {
      id: true,
      name: true,
      resumePublicId: true,
      marksheetPublicId: true,
    },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  const publicId = type === 'resume' ? student.resumePublicId : student.marksheetPublicId;

  if (!publicId) {
    throw AppError.notFound(`Student has no ${type} uploaded`, 'DOCUMENT_NOT_FOUND');
  }

  const signedUrl = cloudinaryService.generateSignedUrl(publicId);

  res.json({
    success: true,
    data: {
      studentName: student.name,
      type,
      url: signedUrl,
    },
  });
}
