import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import { ApplicationStatus } from '@prisma/client';
import { addEmailJob } from '../queues/email.queue';
import { invalidateEligibleCompaniesCache } from './student.service';

export interface CreateCompanyInput {
  name: string;
  roleOffered: string;
  description?: string;
  minCgpa?: number;
  package?: string;
  allowedBranches: string[];
  allowedYears: number[];
  deadline: Date;
}

export interface UpdateApplicationStatusInput {
  applicationId: string;
  status: ApplicationStatus;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export async function createCompany(input: CreateCompanyInput) {
  const { name, roleOffered, minCgpa, allowedBranches, allowedYears, deadline } = input;

  // Validate deadline is in the future
  if (new Date(deadline) <= new Date()) {
    throw AppError.badRequest('Deadline must be in the future', 'INVALID_DEADLINE');
  }

  const company = await prisma.company.create({
    data: {
      name,
      roleOffered,
      minCgpa: minCgpa ?? 0,
      allowedBranches,
      allowedYears,
      deadline: new Date(deadline),
    },
  });

  // Invalidate eligible companies cache for all students
  await invalidateEligibleCompaniesCache();

  return company;
}

export async function getCompanyApplicants(
  companyId: string,
  pagination: PaginationParams
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw AppError.notFound('Company not found', 'COMPANY_NOT_FOUND');
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: { companyId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            cgpa: true,
            branch: true,
            resume: {
              select: {
                url: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.application.count({
      where: { companyId },
    }),
  ]);

  return {
    company: {
      id: company.id,
      name: company.name,
      roleOffered: company.roleOffered,
    },
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

export async function updateApplicationStatus(input: UpdateApplicationStatusInput) {
  const { applicationId, status } = input;

  // Find the application with student details
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          roleOffered: true,
        },
      },
    },
  });

  if (!application) {
    throw AppError.notFound('Application not found', 'APPLICATION_NOT_FOUND');
  }

  // Update the status
  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          roleOffered: true,
        },
      },
    },
  });

  // If status is SHORTLISTED, add job to email queue
  if (status === ApplicationStatus.SHORTLISTED) {
    await addEmailJob({
      studentEmail: application.student.email,
      companyName: application.company.name,
      studentName: application.student.name,
      roleOffered: application.company.roleOffered,
      type: 'SHORTLIST_NOTIFICATION',
    });
  }

  return updatedApplication;
}

export async function getAllCompanies(pagination: PaginationParams) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    }),
    prisma.company.count(),
  ]);

  return {
    companies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + companies.length < total,
    },
  };
}

export async function getApplicationStats() {
  const [
    totalApplications,
    appliedCount,
    shortlistedCount,
    selectedCount,
    rejectedCount,
    totalStudents,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: ApplicationStatus.APPLIED } }),
    prisma.application.count({ where: { status: ApplicationStatus.SHORTLISTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.SELECTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.REJECTED } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
  ]);

  return {
    total: totalApplications,
    totalStudents,
    byStatus: {
      applied: appliedCount,
      shortlisted: shortlistedCount,
      selected: selectedCount,
      rejected: rejectedCount,
    },
  };
}
