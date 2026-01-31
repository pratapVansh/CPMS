import { Request, Response } from 'express';
import { z } from 'zod';
import * as studentService from '../services/student.service';
import { AppError } from '../utils/AppError';

// Validation schemas
const applySchema = z.object({
  companyId: z.string().uuid(),
});

const resumeSchema = z.object({
  url: z.string().url(),
});

const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
});

export async function getEligibleCompanies(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  // Get student's cgpa and branch from database
  const { prisma } = await import('../config/db');
  const student = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { cgpa: true, branch: true },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  const companies = await studentService.getEligibleCompanies({
    userId: req.user.userId,
    cgpa: student.cgpa,
    branch: student.branch,
  });

  res.json({
    success: true,
    data: {
      companies,
      count: companies.length,
    },
  });
}

export async function applyToCompany(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { companyId } = applySchema.parse(req.body);

  const application = await studentService.applyToCompany({
    studentId: req.user.userId,
    companyId,
  });

  res.status(201).json({
    success: true,
    data: {
      application,
    },
    message: 'Application submitted successfully',
  });
}

export async function getMyApplications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { page, limit } = paginationSchema.parse(req.query);

  const result = await studentService.getMyApplications(req.user.userId, {
    page,
    limit: Math.min(limit, 50), // Cap at 50 per page
  });

  res.json({
    success: true,
    data: result,
  });
}

export async function upsertResume(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const { url } = resumeSchema.parse(req.body);

  const resume = await studentService.upsertResume({
    userId: req.user.userId,
    url,
  });

  res.json({
    success: true,
    data: {
      resume,
    },
    message: 'Resume saved successfully',
  });
}

export async function getResume(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw AppError.unauthorized('User not authenticated', 'NOT_AUTHENTICATED');
  }

  const resume = await studentService.getResume(req.user.userId);

  res.json({
    success: true,
    data: {
      resume,
    },
  });
}
