import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import { ApplicationStatus, NoticePriority } from '@prisma/client';
import { addEmailJob } from '../queues/email.queue';
import { invalidateEligibleCompaniesCache } from './student.service';

export interface CreateCompanyInput {
  name: string;
  logoUrl?: string;
  industry?: string;
  website?: string;
  description?: string;
  roleOffered: string;
  jobDescription?: string;
  ctc?: string;
  location?: string;
  jobType?: string;
  minCgpa?: number;
  maxBacklogs?: number;
  allowedBranches: string[];
  allowedYears: number[];
  driveDate?: Date;
  deadline: Date;
  selectionRounds?: string;
  requiredDocuments?: string;
  specialInstructions?: string;
  status?: string;
  createdBy?: string;
}

export interface UpdateApplicationStatusInput {
  applicationId: string;
  status: ApplicationStatus;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CreateNoticeInput {
  title: string;
  description: string;
  priority: NoticePriority;
  createdBy: string;
}

export interface UpdateNoticeInput {
  title?: string;
  description?: string;
  priority?: NoticePriority;
  isActive?: boolean;
}

export async function createCompany(input: CreateCompanyInput) {
  const { 
    name, 
    logoUrl,
    industry,
    website,
    description,
    roleOffered, 
    jobDescription,
    ctc,
    location,
    jobType,
    minCgpa, 
    maxBacklogs,
    allowedBranches, 
    allowedYears, 
    driveDate,
    deadline,
    selectionRounds,
    requiredDocuments,
    specialInstructions,
    status,
    createdBy,
  } = input;

  // Validate deadline is in the future
  if (new Date(deadline) <= new Date()) {
    throw AppError.badRequest('Deadline must be in the future', 'INVALID_DEADLINE');
  }

  const company = await prisma.company.create({
    data: {
      name,
      logoUrl,
      industry,
      website,
      description,
      roleOffered,
      jobDescription,
      ctc,
      location,
      jobType: jobType ?? 'Full-time',
      minCgpa,
      maxBacklogs,
      allowedBranches,
      allowedYears,
      driveDate,
      deadline: new Date(deadline),
      selectionRounds,
      requiredDocuments,
      specialInstructions,
      status: status ?? 'upcoming',
      createdBy,
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
    include: {
      applications: {
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
      },
    },
  });

  if (!company) {
    throw AppError.notFound('Company not found', 'COMPANY_NOT_FOUND');
  }

  // Transform applications to match frontend expectation (user instead of student)
  const transformedApplications = company.applications.map((app) => ({
    id: app.id,
    status: app.status,
    createdAt: app.createdAt,
    user: app.student,
  }));

  return {
    company: {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      industry: company.industry,
      website: company.website,
      description: company.description,
      roleOffered: company.roleOffered,
      jobDescription: company.jobDescription,
      ctc: company.ctc,
      location: company.location,
      jobType: company.jobType,
      minCgpa: company.minCgpa,
      maxBacklogs: company.maxBacklogs,
      allowedBranches: company.allowedBranches,
      allowedYears: company.allowedYears,
      driveDate: company.driveDate,
      deadline: company.deadline,
      selectionRounds: company.selectionRounds,
      requiredDocuments: company.requiredDocuments,
      specialInstructions: company.specialInstructions,
      status: company.status,
      applications: transformedApplications,
      _count: {
        applications: company.applications.length,
      },
    },
    applications: transformedApplications,
    pagination: {
      page,
      limit,
      total: company.applications.length,
      totalPages: Math.ceil(company.applications.length / limit),
      hasMore: false,
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

// Notice Management
export async function createNotice(input: CreateNoticeInput) {
  const notice = await prisma.notice.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      createdBy: input.createdBy,
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return notice;
}

export async function getAllNotices(pagination: PaginationParams) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.notice.count(),
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

export async function updateNotice(noticeId: string, input: UpdateNoticeInput) {
  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
  });

  if (!notice) {
    throw AppError.notFound('Notice not found', 'NOTICE_NOT_FOUND');
  }

  const updatedNotice = await prisma.notice.update({
    where: { id: noticeId },
    data: input,
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedNotice;
}

export async function deleteNotice(noticeId: string) {
  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
  });

  if (!notice) {
    throw AppError.notFound('Notice not found', 'NOTICE_NOT_FOUND');
  }

  await prisma.notice.delete({
    where: { id: noticeId },
  });

  return { success: true };
}
