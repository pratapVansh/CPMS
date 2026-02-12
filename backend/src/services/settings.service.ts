import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 
'cpms-default-key-change-in-production-32'; 
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export interface SMTPSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  emailFrom?: string;
  emailFromName?: string;
  smtpSecure?: boolean;
}

export async function getSettings() {
  let settings = await prisma.systemSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.systemSettings.create({ data: {} });
  }

  if (settings.smtpPassword) {
    try {
      settings.smtpPassword = decrypt(settings.smtpPassword);
    } catch (error) {
      console.error('Failed to decrypt SMTP password');
      settings.smtpPassword = '';
    }
  }

  return settings;
}

export async function updateSMTPSettings(data: SMTPSettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  let encryptedPassword = data.smtpPassword;
  if (encryptedPassword) {
    encryptedPassword = encrypt(encryptedPassword);
  }

  const updateData: any = { updatedBy };
  if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost;
  if (data.smtpPort !== undefined) updateData.smtpPort = data.smtpPort;
  if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser;
  if (encryptedPassword !== undefined) updateData.smtpPassword = encryptedPassword;
  if (data.emailFrom !== undefined) updateData.emailFrom = data.emailFrom;
  if (data.emailFromName !== undefined) updateData.emailFromName = data.emailFromName;
  if (data.smtpSecure !== undefined) updateData.smtpSecure = data.smtpSecure;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  const result = { ...settings };
  if (result.smtpPassword) {
    result.smtpPassword = '••••••••';
  }

  return result;
}

export async function testSMTPConnection(data: SMTPSettings): Promise<{ success: boolean; message: string }> {
  if (!data.smtpHost || !data.smtpPort || !data.smtpUser || !data.smtpPassword) {
    throw AppError.badRequest('Missing required SMTP configuration');
  }

  try {
    console.log('Testing SMTP:', { host: data.smtpHost, port: data.smtpPort, user: data.smtpUser });
    
    // Import nodemailer for testing
    const nodemailer = require('nodemailer');
    
    // Custom DNS lookup to force IPv4
    const lookup4 = promisify(dns.lookup);
    const customLookup = async (hostname: string, options: any, callback: any) => {
      try {
        const result = await lookup4(hostname, { family: 4, all: false });
        callback(null, result.address, 4);
      } catch (error) {
        callback(error);
      }
    };
    
    // Create transporter with provided settings
    const transporter = nodemailer.createTransport({
      host: data.smtpHost,
      port: data.smtpPort,
      secure: data.smtpSecure ?? false, // false for 587 (STARTTLS), true for 465 (SSL)
      auth: {
        user: data.smtpUser,
        pass: data.smtpPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      // Force IPv4 to avoid IPv6 network errors
      dnsOptions: {
        lookup: customLookup,
      },
    });
    
    // Actually verify the connection
    await transporter.verify();
    
    console.log('[SMTP TEST] Connection successful');

    return {
      success: true,
      message: 'SMTP configuration is valid. Email service ready.',
    };
  } catch (error: any) {
    console.error('[SMTP TEST] Connection failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to connect to SMTP server',
    };
  }
}


export interface InstitutionSettings {
  institutionName?: string;
  institutionLogo?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
}

export async function updateInstitutionSettings(data: InstitutionSettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  const updateData: any = { updatedBy };
  if (data.institutionName !== undefined) updateData.institutionName = data.institutionName;
  if (data.institutionLogo !== undefined) updateData.institutionLogo = data.institutionLogo;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  return settings;
}

export interface PlacementSettings {
  academicYear?: string;
  placementStartDate?: Date | string;
  placementEndDate?: Date | string;
  defaultMinCgpa?: number;
  defaultMaxBacklogs?: number;
  maxResumeSize?: number;
  allowedResumeFormats?: string;
}

export async function updatePlacementSettings(data: PlacementSettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  const updateData: any = { updatedBy };
  if (data.academicYear !== undefined) updateData.academicYear = data.academicYear;
  if (data.placementStartDate !== undefined) updateData.placementStartDate = data.placementStartDate;
  if (data.placementEndDate !== undefined) updateData.placementEndDate = data.placementEndDate;
  if (data.defaultMinCgpa !== undefined) updateData.defaultMinCgpa = data.defaultMinCgpa;
  if (data.defaultMaxBacklogs !== undefined) updateData.defaultMaxBacklogs = data.defaultMaxBacklogs;
  if (data.maxResumeSize !== undefined) updateData.maxResumeSize = data.maxResumeSize;
  if (data.allowedResumeFormats !== undefined) updateData.allowedResumeFormats = data.allowedResumeFormats;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  return settings;
}

export interface StudentSettings {
  studentRegistrationOpen?: boolean;
  autoApproveStudents?: boolean;
  allowedBranches?: string;
  requiredProfileFields?: string;
}

export async function updateStudentSettings(data: StudentSettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  const updateData: any = { updatedBy };
  if (data.studentRegistrationOpen !== undefined) updateData.studentRegistrationOpen = data.studentRegistrationOpen;
  if (data.autoApproveStudents !== undefined) updateData.autoApproveStudents = data.autoApproveStudents;
  if (data.allowedBranches !== undefined) updateData.allowedBranches = data.allowedBranches;
  if (data.requiredProfileFields !== undefined) updateData.requiredProfileFields = data.requiredProfileFields;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  return settings;
}

export interface CompanySettings {
  requireDriveApproval?: boolean;
  notifyOnNewDrive?: boolean;
  maxApplicationsPerStudent?: number;
}

export async function updateCompanySettings(data: CompanySettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  const updateData: any = { updatedBy };
  if (data.requireDriveApproval !== undefined) updateData.requireDriveApproval = data.requireDriveApproval;
  if (data.notifyOnNewDrive !== undefined) updateData.notifyOnNewDrive = data.notifyOnNewDrive;
  if (data.maxApplicationsPerStudent !== undefined) updateData.maxApplicationsPerStudent = data.maxApplicationsPerStudent;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  return settings;
}

export interface NotificationSettings {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  notifyApplicationStatus?: boolean;
  notifyNewDrive?: boolean;
}

export async function updateNotificationSettings(data: NotificationSettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  const updateData: any = { updatedBy };
  if (data.emailNotifications !== undefined) updateData.emailNotifications = data.emailNotifications;
  if (data.smsNotifications !== undefined) updateData.smsNotifications = data.smsNotifications;
  if (data.pushNotifications !== undefined) updateData.pushNotifications = data.pushNotifications;
  if (data.notifyApplicationStatus !== undefined) updateData.notifyApplicationStatus = data.notifyApplicationStatus;
  if (data.notifyNewDrive !== undefined) updateData.notifyNewDrive = data.notifyNewDrive;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  return settings;
}

export interface SecuritySettings {
  sessionTimeout?: number;
  minPasswordLength?: number;
  requirePasswordComplexity?: boolean;
  maxLoginAttempts?: number;
  enableTwoFactor?: boolean;
}

export async function updateSecuritySettings(data: SecuritySettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  const updateData: any = { updatedBy };
  if (data.sessionTimeout !== undefined) updateData.sessionTimeout = data.sessionTimeout;
  if (data.minPasswordLength !== undefined) updateData.minPasswordLength = data.minPasswordLength;
  if (data.requirePasswordComplexity !== undefined) updateData.requirePasswordComplexity = data.requirePasswordComplexity;
  if (data.maxLoginAttempts !== undefined) updateData.maxLoginAttempts = data.maxLoginAttempts;
  if (data.enableTwoFactor !== undefined) updateData.enableTwoFactor = data.enableTwoFactor;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  return settings;
}

export interface AppearanceSettings {
  primaryColor?: string;
  secondaryColor?: string;
  loginBannerUrl?: string | null;
  customCss?: string | null;
}

export async function updateAppearanceSettings(data: AppearanceSettings, updatedBy: string) {
  let settings = await prisma.systemSettings.findFirst();

  const updateData: any = { updatedBy };
  if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
  if (data.secondaryColor !== undefined) updateData.secondaryColor = data.secondaryColor;
  if (data.loginBannerUrl !== undefined) updateData.loginBannerUrl = data.loginBannerUrl;
  if (data.customCss !== undefined) updateData.customCss = data.customCss;

  if (settings) {
    settings = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    settings = await prisma.systemSettings.create({
      data: { ...updateData, updatedBy },
    });
  }

  return settings;
}