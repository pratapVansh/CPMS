import { Request, Response } from 'express';
import { z } from 'zod';
import { ApplicationStatus, NoticePriority } from '@prisma/client';
import * as adminService from '../services/admin.service';
import { AppError } from '../utils/AppError';
import { prisma } from '../config/db';
import * as cloudinaryService from '../services/cloudinary.service';

// Validation schemas
const createCompanySchema = z.object({
  // Company Details
  name: z.string().min(2).max(200),
  logoUrl: z.string().url().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  
  // Job Details
  roleOffered: z.string().min(2).max(200),
  jobDescription: z.string().optional(),
  ctc: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional().default("Full-time"),
  
  // Eligibility Criteria
  minCgpa: z.number().min(0).max(10).optional(),
  maxBacklogs: z.number().min(0).optional(),
  allowedBranches: z.array(z.string()).optional().default([]),
  allowedYears: z.array(z.number()).optional().default([]),
  
  // Drive Schedule
  driveDate: z.string().transform(date => date ? new Date(date).toISOString() : null).optional(),
  deadline: z.string().transform(date => new Date(date).toISOString()),
  selectionRounds: z.string().optional(),
  
  // Additional Info
  requiredDocuments: z.string().optional(),
  specialInstructions: z.string().optional(),
  
  // Status
  status: z.string().optional().default("upcoming"),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
});

const createNoticeSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  priority: z.nativeEnum(NoticePriority).optional().default(NoticePriority.NORMAL),
});

const updateNoticeSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  priority: z.nativeEnum(NoticePriority).optional(),
  isActive: z.boolean().optional(),
});

export async function createCompany(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const validatedData = createCompanySchema.parse(req.body);

  const company = await adminService.createCompany({
    name: validatedData.name,
    logoUrl: validatedData.logoUrl,
    industry: validatedData.industry,
    website: validatedData.website,
    description: validatedData.description,
    roleOffered: validatedData.roleOffered,
    jobDescription: validatedData.jobDescription,
    ctc: validatedData.ctc,
    location: validatedData.location,
    jobType: validatedData.jobType,
    minCgpa: validatedData.minCgpa,
    maxBacklogs: validatedData.maxBacklogs,
    allowedBranches: validatedData.allowedBranches ?? [],
    allowedYears: validatedData.allowedYears ?? [],
    driveDate: validatedData.driveDate ? new Date(validatedData.driveDate) : undefined,
    deadline: new Date(validatedData.deadline),
    selectionRounds: validatedData.selectionRounds,
    requiredDocuments: validatedData.requiredDocuments,
    specialInstructions: validatedData.specialInstructions,
    status: validatedData.status,
    createdBy: req.user.id,
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
    data: {
      company: result.company,
    },
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

// Notice Management
export async function createNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const validatedData = createNoticeSchema.parse(req.body);

  const notice = await adminService.createNotice({
    title: validatedData.title,
    description: validatedData.description,
    priority: validatedData.priority,
    createdBy: req.user.userId,
  });

  res.status(201).json({
    success: true,
    data: { notice },
    message: 'Notice created successfully',
  });
}

export async function getAllNotices(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { page, limit } = paginationSchema.parse(req.query);

  const result = await adminService.getAllNotices({
    page,
    limit: Math.min(limit, 50),
  });

  res.json({
    success: true,
    data: result,
  });
}

export async function updateNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id } = req.params;
  const validatedData = updateNoticeSchema.parse(req.body);

  const notice = await adminService.updateNotice(id, validatedData);

  res.json({
    success: true,
    data: { notice },
    message: 'Notice updated successfully',
  });
}

export async function deleteNotice(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id } = req.params;

  await adminService.deleteNotice(id);

  res.json({
    success: true,
    message: 'Notice deleted successfully',
  });
}
