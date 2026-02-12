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
    createdBy: req.user.userId,
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
 * Get comprehensive report statistics
 */
export async function getReports(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const reports = await adminService.getReportsStats();

  res.json({
    success: true,
    data: reports,
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

  // Extract filter parameters
  const { search, branch, minCgpa, year } = req.query;

  // Build where clause with filters
  const where: any = { role: 'STUDENT' };

  // Search by name, email, or roll number
  if (search && typeof search === 'string') {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { rollNo: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filter by branch
  if (branch && typeof branch === 'string') {
    where.branch = branch;
  }

  // Filter by minimum CGPA
  if (minCgpa && typeof minCgpa === 'string') {
    const cgpaValue = parseFloat(minCgpa);
    if (!isNaN(cgpaValue)) {
      where.cgpa = { gte: cgpaValue };
    }
  }

  // Filter by current year
  if (year && typeof year === 'string') {
    const yearValue = parseInt(year, 10);
    if (!isNaN(yearValue)) {
      where.currentYear = yearValue;
    }
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        cgpa: true,
        branch: true,
        currentYear: true,
        currentSemester: true,
        status: true,
        resumePublicId: true,
        marksheetPublicId: true,
        verificationStatus: true,
        verifiedAt: true,
        createdAt: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Math.min(limit, 50),
    }),
    prisma.user.count({
      where,
    }),
  ]);

  // Add flags for document availability
  const studentsWithFlags = students.map((student) => ({
    ...student,
    hasResume: !!student.resumePublicId,
    hasMarksheet: !!student.marksheetPublicId,
    documentsVerified: student.verificationStatus === 'VERIFIED',
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
      rollNo: true,
      cgpa: true,
      branch: true,
      currentYear: true,
      currentSemester: true,
      status: true,
      resumePublicId: true,
      marksheetPublicId: true,
      verificationStatus: true,
      verifiedBy: true,
      verifiedAt: true,
      rejectionReason: true,
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

  // Generate preview URLs if documents exist
  const resumeUrl = student.resumePublicId
    ? cloudinaryService.generatePreviewUrl(student.resumePublicId)
    : null;
  const marksheetUrl = student.marksheetPublicId
    ? cloudinaryService.generatePreviewUrl(student.marksheetPublicId)
    : null;

  res.json({
    success: true,
    data: {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
        cgpa: student.cgpa,
        branch: student.branch,
        currentYear: student.currentYear,
        currentSemester: student.currentSemester,
        status: student.status,
        verificationStatus: student.verificationStatus,
        verifiedBy: student.verifiedBy,
        verifiedAt: student.verifiedAt,
        rejectionReason: student.rejectionReason,
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
 * Get a student's document preview URL (for inline viewing)
 */
export async function getStudentDocumentPreview(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id: studentId, type } = req.params;

  if (type !== 'resume' && type !== 'marksheet') {
    throw AppError.badRequest('Invalid document type', 'INVALID_DOC_TYPE');
  }

  console.log(`👁️  Admin preview request for student ${studentId} ${type}`);

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

  const previewUrl = cloudinaryService.generatePreviewUrl(publicId);

  res.json({
    success: true,
    data: {
      studentName: student.name,
      type,
      url: previewUrl,
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

export async function verifyStudent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id: studentId } = req.params;

  const student = await prisma.user.findFirst({
    where: { 
      id: studentId,
      role: 'STUDENT',
    },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: {
      verificationStatus: 'VERIFIED',
      verifiedBy: req.user.userId,
      verifiedAt: new Date(),
      rejectionReason: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      verificationStatus: true,
      verifiedAt: true,
    },
  });

  res.json({
    success: true,
    data: { student: updated },
    message: 'Student verified successfully',
  });
}

export async function rejectStudent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { id: studentId } = req.params;
  const { reason } = req.body;

  const student = await prisma.user.findFirst({
    where: { 
      id: studentId,
      role: 'STUDENT',
    },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: {
      verificationStatus: 'REJECTED',
      verifiedBy: req.user.userId,
      verifiedAt: new Date(),
      rejectionReason: reason || 'Documents rejected',
    },
    select: {
      id: true,
      name: true,
      email: true,
      verificationStatus: true,
      verifiedAt: true,
      rejectionReason: true,
    },
  });

  res.json({
    success: true,
    data: { student: updated },
    message: 'Student verification rejected',
  });
}
