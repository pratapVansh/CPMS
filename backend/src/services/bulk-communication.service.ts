/**
 * Bulk Communication Service
 * 
 * Handles bulk email campaigns for applicant management.
 * Supports multiple message blocks with different target groups in one campaign.
 */

import { prisma } from '../config/db';
import { sendEmail, sendBulkEmails } from './email.service';
import { 
  ApplicationStatus,
  Prisma 
} from '@prisma/client';
import { addEmailJob } from '../queues/email.queue';

// ==================== TYPES ====================
// Note: These will be imported from @prisma/client after running migration

export type TargetType = 'STATUS' | 'MANUAL_ALL' | 'MANUAL_SELECTED' | 'MANUAL_REMAINING';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type MessageDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED' | 'DEFERRED';

export interface CreateCampaignInput {
  name: string;
  driveId: string;
  createdBy: string;
  messageBlocks: CreateMessageBlockInput[];
  scheduledAt?: Date;
}

export interface CreateMessageBlockInput {
  blockOrder: number;
  targetType: TargetType;
  targetValue: string; // JSON string
  subject: string;
  body: string; // Rich text HTML
}

export interface TemplatVariable {
  student_name: string;
  company_name: string;
  round_name?: string;
  date: string;
  student_email: string;
  student_branch?: string;
  student_cgpa?: string;
}

export interface RecipientResolution {
  studentId: string;
  email: string;
  name: string;
  branch?: string;
  cgpa?: number;
}

export interface CampaignStats {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  deliveryRate: number;
}

export interface SendCampaignResult {
  success: boolean;
  campaignId: string;
  stats: {
    totalBlocks: number;
    totalRecipients: number;
    emailsSent: number;
    emailsFailed: number;
  };
  errors?: string[];
}

// ==================== TEMPLATE VARIABLES ====================

/**
 * Resolve template variables for a specific student and drive
 */
export async function resolveTemplateVariables(
  studentId: string,
  driveId: string,
  customVariables?: Partial<TemplatVariable>
): Promise<TemplatVariable> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true, email: true, branch: true, cgpa: true },
  });

  const company = await prisma.company.findUnique({
    where: { id: driveId },
    select: { name: true, selectionRounds: true },
  });

  if (!student || !company) {
    throw new Error('Student or company not found');
  }

  return {
    student_name: student.name,
    student_email: student.email,
    student_branch: student.branch || 'N/A',
    student_cgpa: student.cgpa?.toFixed(2) || 'N/A',
    company_name: company.name,
    round_name: company.selectionRounds || 'Selection Process',
    date: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    ...customVariables,
  };
}

/**
 * Replace template variables in text
 */
export function interpolateTemplate(
  template: string,
  variables: TemplatVariable
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return result;
}

// ==================== RECIPIENT RESOLUTION ====================

/**
 * Resolve recipients based on target type and value
 */
export async function resolveRecipients(
  driveId: string,
  targetType: TargetType,
  targetValue: string
): Promise<RecipientResolution[]> {
  let recipients: RecipientResolution[] = [];

  switch (targetType) {
    case 'STATUS': {
      // Target by application status
      const status = targetValue as ApplicationStatus;
      const applications = await prisma.application.findMany({
        where: {
          companyId: driveId,
          status: status,
        },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              name: true,
              branch: true,
              cgpa: true,
            },
          },
        },
      });

      recipients = applications.map((app) => ({
        studentId: app.student.id,
        email: app.student.email,
        name: app.student.name,
        branch: app.student.branch || undefined,
        cgpa: app.student.cgpa || undefined,
      }));
      break;
    }

    case 'MANUAL_ALL': {
      // All applicants in the drive
      const applications = await prisma.application.findMany({
        where: { companyId: driveId },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              name: true,
              branch: true,
              cgpa: true,
            },
          },
        },
      });

      recipients = applications.map((app) => ({
        studentId: app.student.id,
        email: app.student.email,
        name: app.student.name,
        branch: app.student.branch || undefined,
        cgpa: app.student.cgpa || undefined,
      }));
      break;
    }

    case 'MANUAL_SELECTED': {
      // Specific student IDs
      const studentIds = JSON.parse(targetValue) as string[];
      const students = await prisma.user.findMany({
        where: {
          id: { in: studentIds },
          applications: {
            some: { companyId: driveId },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          branch: true,
          cgpa: true,
        },
      });

      recipients = students.map((student) => ({
        studentId: student.id,
        email: student.email,
        name: student.name,
        branch: student.branch || undefined,
        cgpa: student.cgpa || undefined,
      }));
      break;
    }

    case 'MANUAL_REMAINING': {
      // All except selected IDs (N-X)
      const excludedIds = JSON.parse(targetValue) as string[];
      const applications = await prisma.application.findMany({
        where: {
          companyId: driveId,
          studentId: { notIn: excludedIds },
        },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              name: true,
              branch: true,
              cgpa: true,
            },
          },
        },
      });

      recipients = applications.map((app) => ({
        studentId: app.student.id,
        email: app.student.email,
        name: app.student.name,
        branch: app.student.branch || undefined,
        cgpa: app.student.cgpa || undefined,
      }));
      break;
    }

    default:
      throw new Error(`Unknown target type: ${targetType}`);
  }

  // Remove duplicates based on email
  const uniqueRecipients = recipients.filter(
    (recipient, index, self) =>
      index === self.findIndex((r) => r.email === recipient.email)
  );

  return uniqueRecipients;
}

// ==================== CAMPAIGN MANAGEMENT ====================

/**
 * Create a new bulk message campaign
 */
export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ success: boolean; campaignId: string; message: string }> {
  try {
    // Validate drive exists
    const drive = await prisma.company.findUnique({
      where: { id: input.driveId },
    });

    if (!drive) {
      return {
        success: false,
        campaignId: '',
        message: 'Drive not found',
      };
    }

    // Validate message blocks
    if (!input.messageBlocks || input.messageBlocks.length === 0) {
      return {
        success: false,
        campaignId: '',
        message: 'At least one message block is required',
      };
    }

    // Create campaign with message blocks
    const campaign = await prisma.messageCampaign.create({
      data: {
        name: input.name,
        driveId: input.driveId,
        createdBy: input.createdBy,
        status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: input.scheduledAt,
        messageBlocks: {
          create: input.messageBlocks.map((block) => ({
            blockOrder: block.blockOrder,
            targetType: block.targetType,
            targetValue: block.targetValue,
            subject: block.subject,
            body: block.body,
          })),
        },
      },
      include: {
        messageBlocks: true,
      },
    });

    // Resolve recipients for each message block and update counts
    for (const block of campaign.messageBlocks) {
      const recipients = await resolveRecipients(
        input.driveId,
        block.targetType,
        block.targetValue
      );

      const emails = recipients.map((r) => r.email);

      await prisma.messageBlock.update({
        where: { id: block.id },
        data: {
          resolvedEmails: emails,
          recipientCount: recipients.length,
        },
      });
    }

    // Update campaign total recipients
    const totalRecipients = campaign.messageBlocks.reduce(
      (sum: number, block: any) => sum + block.recipientCount,
      0
    );

    await prisma.messageCampaign.update({
      where: { id: campaign.id },
      data: { totalRecipients },
    });

    return {
      success: true,
      campaignId: campaign.id,
      message: 'Campaign created successfully',
    };
  } catch (error: any) {
    console.error('[BULK-COMM] Error creating campaign:', error);
    return {
      success: false,
      campaignId: '',
      message: error.message || 'Failed to create campaign',
    };
  }
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(campaignId: string) {
  return prisma.messageCampaign.findUnique({
    where: { id: campaignId },
    include: {
      messageBlocks: {
        orderBy: { blockOrder: 'asc' },
      },
      drive: {
        select: {
          id: true,
          name: true,
          roleOffered: true,
        },
      },
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messageLogs: {
        select: {
          id: true,
          deliveryStatus: true,
          sentAt: true,
        },
      },
    },
  });
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const campaign = await prisma.messageCampaign.findUnique({
    where: { id: campaignId },
    include: {
      messageLogs: {
        select: { deliveryStatus: true },
      },
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const sentCount = campaign.messageLogs.filter(
    (log: any) => log.deliveryStatus === 'SENT'
  ).length;
  const failedCount = campaign.messageLogs.filter(
    (log: any) => log.deliveryStatus === 'FAILED'
  ).length;
  const pendingCount = campaign.messageLogs.filter(
    (log: any) => log.deliveryStatus === 'PENDING'
  ).length;

  const deliveryRate =
    campaign.totalRecipients > 0
      ? (sentCount / campaign.totalRecipients) * 100
      : 0;

  return {
    totalRecipients: campaign.totalRecipients,
    sentCount,
    failedCount,
    pendingCount,
    deliveryRate,
  };
}

/**
 * Get all campaigns for a drive
 */
export async function getDriveCampaigns(driveId: string) {
  return prisma.messageCampaign.findMany({
    where: { driveId },
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
      messageBlocks: {
        select: {
          id: true,
          recipientCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ==================== SENDING LOGIC ====================

/**
 * Send a campaign immediately
 */
export async function sendCampaign(
  campaignId: string
): Promise<SendCampaignResult> {
  try {
    // Get campaign with all details
    const campaign = await prisma.messageCampaign.findUnique({
      where: { id: campaignId },
      include: {
        messageBlocks: {
          orderBy: { blockOrder: 'asc' },
        },
        drive: true,
      },
    });

    if (!campaign) {
      return {
        success: false,
        campaignId,
        stats: { totalBlocks: 0, totalRecipients: 0, emailsSent: 0, emailsFailed: 0 },
        errors: ['Campaign not found'],
      };
    }

    // Update campaign status
    await prisma.messageCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENDING',
        startedAt: new Date(),
      },
    });

    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Process each message block
    for (const block of campaign.messageBlocks) {
      try {
        // Resolve recipients for this block
        const recipients = await resolveRecipients(
          campaign.driveId,
          block.targetType,
          block.targetValue
        );

        console.log(
          `[BULK-COMM] Processing block ${block.blockOrder}: ${recipients.length} recipients`
        );

        // Send emails to all recipients
        for (const recipient of recipients) {
          try {
            // Resolve template variables
            const variables = await resolveTemplateVariables(
              recipient.studentId,
              campaign.driveId
            );

            // Interpolate subject and body
            const subject = interpolateTemplate(block.subject, variables);
            const body = interpolateTemplate(block.body, variables);

            // Create message log
            const messageLog = await prisma.messageLog.create({
              data: {
                campaignId: campaign.id,
                messageBlockId: block.id,
                studentId: recipient.studentId,
                email: recipient.email,
                subject,
                body,
                deliveryStatus: 'PENDING',
              },
            });

            // Send email with retry
            const result = await sendEmail({
              to: recipient.email,
              subject,
              html: body,
            });

            // Update message log
            if (result.success) {
              await prisma.messageLog.update({
                where: { id: messageLog.id },
                data: {
                  deliveryStatus: 'SENT',
                  sentAt: new Date(),
                  messageId: result.messageId,
                  attempts: 1,
                },
              });
              totalSent++;
            } else {
              await prisma.messageLog.update({
                where: { id: messageLog.id },
                data: {
                  deliveryStatus: 'FAILED',
                  error: result.error,
                  attempts: 1,
                },
              });
              totalFailed++;
              errors.push(`Failed to send to ${recipient.email}: ${result.error}`);
            }

            // Add delay to avoid rate limiting (1 second between emails)
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (recipientError: any) {
            console.error(
              `[BULK-COMM] Error sending to ${recipient.email}:`,
              recipientError
            );
            totalFailed++;
            errors.push(`Error with ${recipient.email}: ${recipientError.message}`);
          }
        }

        // Update block stats
        await prisma.messageBlock.update({
          where: { id: block.id },
          data: {
            sentCount: recipients.length - totalFailed,
            failedCount: totalFailed,
          },
        });
      } catch (blockError: any) {
        console.error(`[BULK-COMM] Error processing block ${block.id}:`, blockError);
        errors.push(`Block ${block.blockOrder}: ${blockError.message}`);
      }
    }

    // Update campaign status
    await prisma.messageCampaign.update({
      where: { id: campaignId },
      data: {
        status: errors.length > 0 && totalSent === 0 ? 'FAILED' : 'COMPLETED',
        completedAt: new Date(),
        sentCount: totalSent,
        failedCount: totalFailed,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: campaign.createdBy,
        action: 'BULK_EMAIL_SENT',
        target: `campaign:${campaignId}`,
        meta: {
          campaignName: campaign.name,
          driveId: campaign.driveId,
          totalSent,
          totalFailed,
        },
      },
    });

    return {
      success: totalSent > 0,
      campaignId,
      stats: {
        totalBlocks: campaign.messageBlocks.length,
        totalRecipients: campaign.totalRecipients,
        emailsSent: totalSent,
        emailsFailed: totalFailed,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error('[BULK-COMM] Fatal error sending campaign:', error);
    
    // Mark campaign as failed
    await prisma.messageCampaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' },
    });

    return {
      success: false,
      campaignId,
      stats: { totalBlocks: 0, totalRecipients: 0, emailsSent: 0, emailsFailed: 0 },
      errors: [error.message || 'Fatal error while sending campaign'],
    };
  }
}

/**
 * Preview email for a sample recipient
 */
export async function previewEmail(
  driveId: string,
  subject: string,
  body: string,
  sampleStudentId?: string
): Promise<{ subject: string; body: string; recipient: string }> {
  // Get a sample student if not provided
  let studentId = sampleStudentId;
  
  if (!studentId) {
    const application = await prisma.application.findFirst({
      where: { companyId: driveId },
      select: { studentId: true },
    });
    
    if (!application) {
      throw new Error('No applicants found for this drive');
    }
    
    studentId = application.studentId;
  }

  // Resolve template variables
  const variables = await resolveTemplateVariables(studentId, driveId);

  // Interpolate
  const previewSubject = interpolateTemplate(subject, variables);
  const previewBody = interpolateTemplate(body, variables);

  return {
    subject: previewSubject,
    body: previewBody,
    recipient: variables.student_email,
  };
}

/**
 * Get default templates for status changes
 */
export async function getDefaultTemplates() {
  return prisma.messageTemplate.findMany({
    where: {
      isActive: true,
    },
    orderBy: { applicantStatus: 'asc' },
  });
}

/**
 * Create or update a default template
 */
export async function upsertTemplate(
  status: ApplicationStatus,
  subject: string,
  body: string,
  createdBy: string
) {
  const name = `${status}_DEFAULT`;
  
  return prisma.messageTemplate.upsert({
    where: { name },
    update: { subject, body, updatedAt: new Date() },
    create: {
      name,
      description: `Default template for ${status} status`,
      applicantStatus: status,
      subject,
      body,
      isDefault: true,
      isActive: true,
      createdBy,
    },
  });
}

// ==================== DUPLICATE PREVENTION ====================

/**
 * Check if a student has already received an email for this campaign
 */
export async function hasReceivedEmail(
  campaignId: string,
  studentId: string
): Promise<boolean> {
  const existingLog = await prisma.messageLog.findFirst({
    where: {
      campaignId,
      studentId,
      deliveryStatus: 'SENT',
    },
  });

  return !!existingLog;
}

/**
 * Get unique recipients across all message blocks to prevent duplicates
 */
export async function deduplicateRecipients(
  recipients: RecipientResolution[][]
): Promise<RecipientResolution[]> {
  const recipientMap = new Map<string, RecipientResolution>();

  recipients.flat().forEach((recipient) => {
    if (!recipientMap.has(recipient.email)) {
      recipientMap.set(recipient.email, recipient);
    }
  });

  return Array.from(recipientMap.values());
}
