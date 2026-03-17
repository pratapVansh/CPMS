import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import { ApplicationStatus, NoticePriority } from '@prisma/client';
import { addEmailJob } from '../queues/email.queue';
import { invalidateEligibleCompaniesCache } from './student.service';
import { notifyApplicationStatusChange, notifyNewDrivePublished } from './notification.service';

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

export interface UpdateCompanyInput {
  name?: string;
  logoUrl?: string;
  industry?: string;
  website?: string;
  description?: string;
  roleOffered?: string;
  jobDescription?: string;
  ctc?: string;
  location?: string;
  jobType?: string;
  minCgpa?: number | null;
  maxBacklogs?: number | null;
  allowedBranches?: string[];
  allowedYears?: number[];
  driveDate?: Date | null;
  deadline?: Date;
  selectionRounds?: string;
  requiredDocuments?: string;
  specialInstructions?: string;
  status?: string;
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

  // Send notification to eligible students about the new drive
  try {
    await notifyNewDrivePublished(company.id);
  } catch (error) {
    // Log the error but don't fail the company creation
    console.error('Failed to send new drive notifications:', error);
  }

  return company;
}

export async function updateCompany(companyId: string, input: UpdateCompanyInput) {
  const existing = await prisma.company.findUnique({ where: { id: companyId } });
  if (!existing) {
    throw AppError.notFound('Company not found', 'COMPANY_NOT_FOUND');
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
      ...(input.industry !== undefined && { industry: input.industry }),
      ...(input.website !== undefined && { website: input.website }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.roleOffered !== undefined && { roleOffered: input.roleOffered }),
      ...(input.jobDescription !== undefined && { jobDescription: input.jobDescription }),
      ...(input.ctc !== undefined && { ctc: input.ctc }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.jobType !== undefined && { jobType: input.jobType }),
      ...('minCgpa' in input && { minCgpa: input.minCgpa }),
      ...('maxBacklogs' in input && { maxBacklogs: input.maxBacklogs }),
      ...(input.allowedBranches !== undefined && { allowedBranches: input.allowedBranches }),
      ...(input.allowedYears !== undefined && { allowedYears: input.allowedYears }),
      ...('driveDate' in input && { driveDate: input.driveDate }),
      ...(input.deadline !== undefined && { deadline: input.deadline }),
      ...(input.selectionRounds !== undefined && { selectionRounds: input.selectionRounds }),
      ...(input.requiredDocuments !== undefined && { requiredDocuments: input.requiredDocuments }),
      ...(input.specialInstructions !== undefined && { specialInstructions: input.specialInstructions }),
      ...(input.status !== undefined && { status: input.status }),
    },
  });

  // Invalidate cache for all students so they see updated drive info
  await invalidateEligibleCompaniesCache();

  // Notify students who are newly eligible due to relaxed criteria
  try {
    const newlyEligibleIds = await findNewlyEligibleStudents(existing, updated);
    if (newlyEligibleIds.length > 0) {
      await notifyNewDrivePublished(companyId, newlyEligibleIds);
    }
  } catch (error) {
    console.error('Failed to send newly eligible notifications:', error);
  }

  return updated;
}

async function findNewlyEligibleStudents(
  existing: { minCgpa: number | null; allowedBranches: string[] },
  updated: { minCgpa: number | null; allowedBranches: string[] }
): Promise<string[]> {
  const ids: string[] = [];

  // --- Case 1: minCgpa was lowered or removed ---
  const cgpaRelaxed =
    existing.minCgpa !== null &&
    (updated.minCgpa === null || updated.minCgpa < existing.minCgpa);

  if (cgpaRelaxed) {
    const cgpaFilter =
      updated.minCgpa !== null
        ? { not: null as null, gte: updated.minCgpa, lt: existing.minCgpa! }
        : { not: null as null, lt: existing.minCgpa! };

    const byGgpa = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'ACTIVE',
        cgpa: cgpaFilter,
        ...(updated.allowedBranches.length > 0 && {
          branch: { in: updated.allowedBranches },
        }),
      },
      select: { id: true },
    });
    ids.push(...byGgpa.map((s) => s.id));
  }

  // --- Case 2: allowedBranches was expanded ---
  if (existing.allowedBranches.length > 0) {
    const cgpaCondition =
      updated.minCgpa !== null ? { cgpa: { gte: updated.minCgpa } } : {};

    if (updated.allowedBranches.length === 0) {
      // Old was restricted, new is all branches → everyone not in old branches is newly eligible
      const byBranch = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          status: 'ACTIVE',
          branch: { notIn: existing.allowedBranches },
          ...cgpaCondition,
        },
        select: { id: true },
      });
      ids.push(...byBranch.map((s) => s.id));
    } else {
      const addedBranches = updated.allowedBranches.filter(
        (b) => !existing.allowedBranches.includes(b)
      );
      if (addedBranches.length > 0) {
        const byBranch = await prisma.user.findMany({
          where: {
            role: 'STUDENT',
            status: 'ACTIVE',
            branch: { in: addedBranches },
            ...cgpaCondition,
          },
          select: { id: true },
        });
        ids.push(...byBranch.map((s) => s.id));
      }
    }
  }

  return [...new Set(ids)];
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

  // Store old status to check if it changed
  const oldStatus = application.status;

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

  // Send notification only if status actually changed
  if (oldStatus !== status) {
    try {
      await notifyApplicationStatusChange(applicationId);
    } catch (error) {
      // Log the error but don't fail the status update
      console.error('Failed to send notification for status change:', error);
    }
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

/**
 * Get comprehensive report statistics for admin dashboard
 */
export async function getReportsStats() {
  // Get total students
  const totalStudents = await prisma.user.count({ 
    where: { role: 'STUDENT', status: 'ACTIVE' } 
  });

  // Get total companies
  const totalCompanies = await prisma.company.count();

  // Get total applications
  const totalApplications = await prisma.application.count();

  // Get students with SELECTED status (placed students)
  const placedStudents = await prisma.application.findMany({
    where: { status: ApplicationStatus.SELECTED },
    select: { studentId: true },
    distinct: ['studentId'],
  });
  const totalPlacedStudents = placedStudents.length;
  const totalUnplacedStudents = totalStudents - totalPlacedStudents;

  // Get application counts by status
  const [appliedCount, shortlistedCount, selectedCount, rejectedCount] = await Promise.all([
    prisma.application.count({ where: { status: ApplicationStatus.APPLIED } }),
    prisma.application.count({ where: { status: ApplicationStatus.SHORTLISTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.SELECTED } }),
    prisma.application.count({ where: { status: ApplicationStatus.REJECTED } }),
  ]);

  // Get branch-wise statistics
  const studentsByBranch = await prisma.user.groupBy({
    by: ['branch'],
    where: {
      role: 'STUDENT',
      status: 'ACTIVE',
      branch: { not: null },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  // Fetch all placed students with their branch in one query (replaces N per-branch queries)
  const placedApplications = await prisma.application.findMany({
    where: { status: ApplicationStatus.SELECTED },
    select: {
      studentId: true,
      student: { select: { branch: true } },
    },
    distinct: ['studentId'],
  });

  // Aggregate placed count per branch in memory
  const placedPerBranch = new Map<string, number>();
  for (const app of placedApplications) {
    const branch = app.student.branch ?? 'Unknown';
    placedPerBranch.set(branch, (placedPerBranch.get(branch) ?? 0) + 1);
  }

  const branchStats = studentsByBranch.map((branchData) => {
    const branch = branchData.branch ?? 'Unknown';
    const total = branchData._count.id;
    const placed = placedPerBranch.get(branch) ?? 0;
    const rate = total > 0 ? (placed / total) * 100 : 0;
    return { branch, total, placed, rate };
  });

  // Get top companies by applications
  const topCompanies = await prisma.company.findMany({
    select: {
      name: true,
      _count: {
        select: {
          applications: true,
        },
      },
      applications: {
        where: { status: ApplicationStatus.SELECTED },
        select: { id: true },
      },
    },
    orderBy: {
      applications: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  const topCompaniesData = topCompanies.map((company) => ({
    name: company.name,
    applications: company._count.applications,
    selected: company.applications.length,
  }));

  // Calculate overall placement rate
  const placementRate = totalStudents > 0 ? (totalPlacedStudents / totalStudents) * 100 : 0;

  return {
    totalStudents,
    totalCompanies,
    totalApplications,
    totalPlacedStudents,
    totalUnplacedStudents,
    placementRate,
    byStatus: {
      applied: appliedCount,
      shortlisted: shortlistedCount,
      selected: selectedCount,
      rejected: rejectedCount,
    },
    byBranch: branchStats,
    topCompanies: topCompaniesData,
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
