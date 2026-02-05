import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { AppError } from '../utils/AppError';
import { ApplicationStatus } from '@prisma/client';
import { notifyApplicationSubmitted } from './notification.service';

const ELIGIBLE_COMPANIES_CACHE_PREFIX = 'eligible_companies:';
const CACHE_TTL = 600; // 10 minutes in seconds

export interface EligibleCompaniesQuery {
  userId: string;
  cgpa: number | null;
  branch: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApplyInput {
  studentId: string;
  companyId: string;
}

export interface ResumeInput {
  userId: string;
  url: string;
}

export async function getEligibleCompanies(query: EligibleCompaniesQuery) {
  const { userId, cgpa, branch } = query;

  // Build cache key based on user's criteria
  const cacheKey = `${ELIGIBLE_COMPANIES_CACHE_PREFIX}${userId}`;

  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query eligible companies
  const now = new Date();

  const companies = await prisma.company.findMany({
    where: {
      deadline: { gte: now },
      ...(cgpa !== null && { minCgpa: { lte: cgpa } }),
      ...(branch !== null && {
        OR: [
          { allowedBranches: { has: branch } },
          { allowedBranches: { isEmpty: true } }, // Empty means all branches allowed
        ],
      }),
    },
    orderBy: { deadline: 'asc' },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      industry: true,
      website: true,
      description: true,
      roleOffered: true,
      jobDescription: true,
      ctc: true,
      location: true,
      jobType: true,
      minCgpa: true,
      maxBacklogs: true,
      allowedBranches: true,
      allowedYears: true,
      driveDate: true,
      deadline: true,
      selectionRounds: true,
      requiredDocuments: true,
      specialInstructions: true,
      createdAt: true,
    },
  });

  // Cache the result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(companies));

  return companies;
}

export async function applyToCompany(input: ApplyInput) {
  const { studentId, companyId } = input;

  // Check if company exists and deadline hasn't passed
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw AppError.notFound('Company not found', 'COMPANY_NOT_FOUND');
  }

  if (company.deadline < new Date()) {
    throw AppError.badRequest('Application deadline has passed', 'DEADLINE_PASSED');
  }

  // Get student details to check eligibility
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { cgpa: true, branch: true },
  });

  if (!student) {
    throw AppError.notFound('Student not found', 'STUDENT_NOT_FOUND');
  }

  // Check CGPA eligibility
  if (student.cgpa !== null && company.minCgpa !== null && student.cgpa < company.minCgpa) {
    throw AppError.badRequest(
      `Minimum CGPA requirement is ${company.minCgpa}`,
      'CGPA_NOT_ELIGIBLE'
    );
  }

  // Check branch eligibility
  if (
    company.allowedBranches.length > 0 &&
    student.branch &&
    !company.allowedBranches.includes(student.branch)
  ) {
    throw AppError.badRequest(
      'Your branch is not eligible for this company',
      'BRANCH_NOT_ELIGIBLE'
    );
  }

  // Check for duplicate application
  const existingApplication = await prisma.application.findUnique({
    where: {
      studentId_companyId: {
        studentId,
        companyId,
      },
    },
  });

  if (existingApplication) {
    throw AppError.conflict('You have already applied to this company', 'ALREADY_APPLIED');
  }

  // Create application
  const application = await prisma.application.create({
    data: {
      studentId,
      companyId,
      status: ApplicationStatus.APPLIED,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          roleOffered: true,
          deadline: true,
        },
      },
    },
  });

  // Invalidate eligible companies cache for this student
  await redis.del(`${ELIGIBLE_COMPANIES_CACHE_PREFIX}${studentId}`);

  // Send application confirmation email (async, don't wait)
  notifyApplicationSubmitted(application.id).catch(error => {
    console.error('Failed to send application confirmation email:', error);
  });

  return application;
}

export async function getMyApplications(
  studentId: string,
  pagination: PaginationParams
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: { studentId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            roleOffered: true,
            minCgpa: true,
            deadline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.application.count({
      where: { studentId },
    }),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + applications.length < total,
    },
  };
}

export async function upsertResume(input: ResumeInput) {
  const { userId, url } = input;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }

  // Upsert resume
  const resume = await prisma.resume.upsert({
    where: { userId },
    update: { url },
    create: { userId, url },
  });

  return resume;
}

export async function getResume(userId: string) {
  const resume = await prisma.resume.findUnique({
    where: { userId },
  });

  return resume;
}

// Helper to invalidate cache when companies are updated
export async function invalidateEligibleCompaniesCache() {
  const keys = await redis.keys(`${ELIGIBLE_COMPANIES_CACHE_PREFIX}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Get active notices for students
export async function getActiveNotices(pagination: PaginationParams) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
    }),
    prisma.notice.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  return {
    notices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + notices.length < total,
    },
  };
}
