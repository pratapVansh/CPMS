/**
 * Notification Service for CPMS
 * 
 * Central orchestration layer for all notification types.
 * Handles email, SMS, and push notifications with proper queueing and error handling.
 */

import { prisma } from '../config/db';
import { addNotificationJob } from '../queues/notification.queue';
import {
  getTemplateByEvent,
  getEventFromApplicationStatus,
  TemplateVariables,
} from '../templates/emailTemplates';

export interface NotificationPayload {
  userId: string;
  eventType: string;
  data: any;
  channels?: ('EMAIL' | 'SMS' | 'PUSH')[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

/**
 * Get user email by user ID
 */
async function getUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  
  return user?.email || null;
}

/**
 * Get institution settings for templates
 */
async function getInstitutionSettings() {
  const settings = await prisma.systemSettings.findFirst();
  
  return {
    institutionName: settings?.institutionName || 'Institution',
    institutionEmail: settings?.contactEmail || undefined,
    institutionPhone: settings?.contactPhone || undefined,
  };
}

/**
 * Check if notification should be sent based on settings
 */
async function shouldSendNotification(eventType: string, channel: string): Promise<boolean> {
  const settings = await prisma.systemSettings.findFirst();
  
  if (!settings) return true; // Default to enabled
  
  // Check channel-specific settings
  if (channel === 'EMAIL' && !settings.emailNotifications) {
    return false;
  }
  if (channel === 'SMS' && !settings.smsNotifications) {
    return false;
  }
  if (channel === 'PUSH' && !settings.pushNotifications) {
    return false;
  }
  
  // Check event-specific settings
  if (eventType.includes('APPLICATION') && !settings.notifyApplicationStatus) {
    return false;
  }
  if (eventType.includes('DRIVE') && !settings.notifyNewDrive) {
    return false;
  }
  
  return true;
}

/**
 * Send notification (main entry point)
 * 
 * This function queues notifications for processing.
 * Use this instead of directly sending emails/SMS.
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    const channels = payload.channels || ['EMAIL'];
    
    // Check if any channel is enabled for this event
    const enabledChannels = await Promise.all(
      channels.map(async (channel) => {
        const enabled = await shouldSendNotification(payload.eventType, channel);
        return enabled ? channel : null;
      })
    );
    
    const validChannels = enabledChannels.filter(c => c !== null) as Array<'EMAIL' | 'SMS' | 'PUSH'>;
    
    if (validChannels.length === 0) {
      console.log(`[NOTIFICATION] All channels disabled for ${payload.eventType}`);
      return;
    }
    
    // Queue the notification job
    await addNotificationJob({
      ...payload,
      channels: validChannels,
    });
    
    console.log(`[NOTIFICATION] Queued: ${payload.eventType} for user ${payload.userId}`);
  } catch (error) {
    console.error('[NOTIFICATION] Error queuing notification:', error);
    throw error;
  }
}

/**
 * Send notification to student on registration
 */
export async function notifyStudentRegistration(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, rollNo: true },
  });
  
  if (!user) {
    console.error('[NOTIFICATION] User not found:', userId);
    return;
  }
  
  const institutionSettings = await getInstitutionSettings();
  
  await sendNotification({
    userId,
    eventType: 'REGISTRATION_WELCOME',
    data: {
      studentName: user.name,
      studentRollNo: user.rollNo || undefined,
      institutionName: institutionSettings.institutionName,
      institutionEmail: institutionSettings.institutionEmail,
      institutionPhone: institutionSettings.institutionPhone,
    },
    channels: ['EMAIL'],
    priority: 'NORMAL',
  });
}

/**
 * Send notification for incomplete profile
 */
export async function notifyProfileIncomplete(
  userId: string,
  userName: string,
  profileIssues: string[]
): Promise<void> {
  const institutionSettings = await getInstitutionSettings();
  
  await sendNotification({
    userId,
    eventType: 'PROFILE_INCOMPLETE',
    data: {
      studentName: userName,
      profileIssues,
      institutionName: institutionSettings.institutionName,
      institutionEmail: institutionSettings.institutionEmail,
      institutionPhone: institutionSettings.institutionPhone,
    },
    channels: ['EMAIL'],
    priority: 'HIGH',
  });
}

/**
 * Send notification when application is submitted
 */
export async function notifyApplicationSubmitted(applicationId: string): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: { select: { id: true, name: true, rollNo: true } },
      company: {
        select: {
          name: true,
          roleOffered: true,
          ctc: true,
          location: true,
          driveDate: true,
        },
      },
    },
  });
  
  if (!application) {
    console.error('[NOTIFICATION] Application not found:', applicationId);
    return;
  }
  
  const institutionSettings = await getInstitutionSettings();
  
  await sendNotification({
    userId: application.student.id,
    eventType: 'APPLICATION_SUBMITTED',
    data: {
      studentName: application.student.name,
      studentRollNo: application.student.rollNo || undefined,
      companyName: application.company.name,
      roleName: application.company.roleOffered,
      ctc: application.company.ctc,
      location: application.company.location,
      driveDate: application.company.driveDate?.toLocaleDateString(),
      institutionName: institutionSettings.institutionName,
      institutionEmail: institutionSettings.institutionEmail,
      institutionPhone: institutionSettings.institutionPhone,
    },
    channels: ['EMAIL'],
    priority: 'NORMAL',
  });
}

/**
 * Send notification when application status changes
 * 
 * This is the main function for status change notifications.
 * It only sends notification if status actually changed (idempotent).
 */
export async function notifyApplicationStatusChange(applicationId: string): Promise<void> {
  
  try {
    // Get application details with student and company info
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          select: { id: true, name: true, email: true, rollNo: true },
        },
        company: {
          select: {
            name: true,
            roleOffered: true,
            ctc: true,
            location: true,
            driveDate: true,
          },
        },
      },
    });
    
    if (!application) {
      console.error('[NOTIFICATION] Application not found:', applicationId);
      return;
    }
    
    // Get event type from current status
    const eventType = getEventFromApplicationStatus(application.status);
    if (!eventType) {
      console.log('[NOTIFICATION] No event mapping for status:', application.status);
      return;
    }
    
    const institutionSettings = await getInstitutionSettings();
    
    // Prepare notification data
    const notificationData = {
      studentName: application.student.name,
      studentRollNo: application.student.rollNo || undefined,
      companyName: application.company.name,
      roleName: application.company.roleOffered,
      ctc: application.company.ctc || undefined,
      location: application.company.location || undefined,
      driveDate: application.company.driveDate 
        ? new Date(application.company.driveDate).toLocaleDateString()
        : undefined,
      institutionName: institutionSettings.institutionName,
      institutionEmail: institutionSettings.institutionEmail,
      institutionPhone: institutionSettings.institutionPhone,
    };
    
    await sendNotification({
      userId: application.student.id,
      eventType,
      data: notificationData,
      channels: ['EMAIL'],
      priority: application.status === 'SELECTED' ? 'URGENT' : 
               application.status === 'SHORTLISTED' ? 'HIGH' : 'NORMAL',
    });
    
    console.log(`[NOTIFICATION] Status change notification queued for status: ${application.status}`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending status change notification:', error);
    throw error;
  }
}

/**
 * Send notification when new drive is published
 */
export async function notifyNewDrivePublished(
  companyId: string,
  targetStudentIds?: string[]
): Promise<void> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        roleOffered: true,
        ctc: true,
        location: true,
        deadline: true,
        driveDate: true,
        jobDescription: true,
      },
    });
    
    if (!company) {
      console.error('[NOTIFICATION] Company not found:', companyId);
      return;
    }
    
    // Get eligible students if not specified
    let students;
    if (targetStudentIds && targetStudentIds.length > 0) {
      students = await prisma.user.findMany({
        where: {
          id: { in: targetStudentIds },
          role: 'STUDENT',
          status: 'ACTIVE',
        },
        select: { id: true, name: true, rollNo: true },
      });
    } else {
      // Get all active students
      students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          status: 'ACTIVE',
        },
        select: { id: true, name: true, rollNo: true },
      });
    }
    
    const institutionSettings = await getInstitutionSettings();
    
    // Send notification to each eligible student
    const notifications = students.map(student => {
      const notificationData = {
        studentName: student.name,
        studentRollNo: student.rollNo || undefined,
        companyName: company.name,
        roleName: company.roleOffered,
        ctc: company.ctc || undefined,
        location: company.location || undefined,
        deadline: company.deadline 
          ? new Date(company.deadline).toLocaleDateString()
          : undefined,
        driveDate: company.driveDate 
          ? new Date(company.driveDate).toLocaleDateString()
          : undefined,
        additionalInfo: company.jobDescription || undefined,
        institutionName: institutionSettings.institutionName,
        institutionEmail: institutionSettings.institutionEmail,
        institutionPhone: institutionSettings.institutionPhone,
      };
      
      return sendNotification({
        userId: student.id,
        eventType: 'NEW_DRIVE_PUBLISHED',
        data: notificationData,
        channels: ['EMAIL'],
        priority: 'HIGH',
      });
    });
    
    await Promise.all(notifications);
    
    console.log(`[NOTIFICATION] New drive notifications queued for ${students.length} students`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending new drive notifications:', error);
    throw error;
  }
}

/**
 * Send drive deadline reminder
 */
export async function notifyDriveDeadlineReminder(companyId: string): Promise<void> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        roleOffered: true,
        deadline: true,
      },
    });
    
    if (!company) {
      console.error('[NOTIFICATION] Company not found:', companyId);
      return;
    }
    
    // Get students who haven't applied yet (eligible but not applied)
    const eligibleStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'ACTIVE',
        applications: {
          none: {
            companyId: companyId,
          },
        },
      },
      select: { id: true, name: true, rollNo: true },
    });
    
    const institutionSettings = await getInstitutionSettings();
    
    const notifications = eligibleStudents.map(student => {
      const notificationData = {
        studentName: student.name,
        studentRollNo: student.rollNo || undefined,
        companyName: company.name,
        roleName: company.roleOffered,
        deadline: company.deadline 
          ? new Date(company.deadline).toLocaleDateString()
          : undefined,
        institutionName: institutionSettings.institutionName,
        institutionEmail: institutionSettings.institutionEmail,
        institutionPhone: institutionSettings.institutionPhone,
      };
      
      return sendNotification({
        userId: student.id,
        eventType: 'DRIVE_DEADLINE_REMINDER',
        data: notificationData,
        channels: ['EMAIL'],
        priority: 'HIGH',
      });
    });
    
    await Promise.all(notifications);
    
    console.log(`[NOTIFICATION] Deadline reminders queued for ${eligibleStudents.length} students`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending deadline reminders:', error);
    throw error;
  }
}

/**
 * Send bulk status update notifications
 * Used when updating multiple applications at once (e.g., bulk shortlisting)
 */
export async function notifyBulkApplicationStatusChange(
  updates: Array<{
    applicationId: string;
    oldStatus: string;
    newStatus: string;
  }>
): Promise<void> {
  // Filter out unchanged statuses
  const validUpdates = updates.filter(u => u.oldStatus !== u.newStatus);
  
  if (validUpdates.length === 0) {
    console.log('[NOTIFICATION] No valid status changes in bulk update');
    return;
  }
  
  console.log(`[NOTIFICATION] Processing ${validUpdates.length} bulk status updates`);
  
  // Process notifications sequentially to avoid overwhelming the queue
  for (const update of validUpdates) {
    try {
      await notifyApplicationStatusChange(update.applicationId);
    } catch (error) {
      console.error(`[NOTIFICATION] Failed to notify for application ${update.applicationId}:`, error);
      // Continue with other notifications even if one fails
    }
  }
  
  console.log('[NOTIFICATION] Bulk notification processing complete');
}
