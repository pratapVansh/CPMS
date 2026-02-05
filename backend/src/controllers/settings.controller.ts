import { Request, Response } from 'express';
import { z } from 'zod';
import * as settingsService from '../services/settings.service';

const smtpSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().email().optional(),
  smtpPassword: z.string().optional(),
  emailFrom: z.string().email().optional(),
  emailFromName: z.string().optional(),
  smtpSecure: z.boolean().optional(),
});

export async function getSettings(_req: Request, res: Response) {
  const settings = await settingsService.getSettings();

  const response = { ...settings };
  if (response.smtpPassword) {
    response.smtpPassword = '••••••••';
  }

  res.json({
    success: true,
    data: { settings: response },
  });
}

export async function updateSMTPSettings(req: Request, res: Response) {
  const data = smtpSettingsSchema.parse(req.body);
  const settings = await settingsService.updateSMTPSettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'SMTP settings updated successfully',
  });
}

export async function testSMTP(req: Request, res: Response) {
  const data = smtpSettingsSchema.parse(req.body);
  const result = await settingsService.testSMTPConnection(data);

  res.json({
    success: result.success,
    message: result.message,
  });
}


const institutionSettingsSchema = z.object({
  institutionName: z.string().min(1).max(200).optional(),
  institutionLogo: z.string().url().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().min(10).max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
});

export async function updateInstitutionSettings(req: Request, res: Response) {
  const data = institutionSettingsSchema.parse(req.body);
  const settings = await settingsService.updateInstitutionSettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'Institution settings updated successfully',
  });
}

const placementSettingsSchema = z.object({
  academicYear: z.string().optional(),
  placementStartDate: z.string().datetime().optional(),
  placementEndDate: z.string().datetime().optional(),
  defaultMinCgpa: z.number().min(0).max(10).optional(),
  defaultMaxBacklogs: z.number().int().min(0).optional(),
  maxResumeSize: z.number().int().min(1).max(10).optional(),
  allowedResumeFormats: z.string().optional(),
});

export async function updatePlacementSettings(req: Request, res: Response) {
  const data = placementSettingsSchema.parse(req.body);
  const settings = await settingsService.updatePlacementSettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'Placement settings updated successfully',
  });
}

const studentSettingsSchema = z.object({
  studentRegistrationOpen: z.boolean().optional(),
  autoApproveStudents: z.boolean().optional(),
  allowedBranches: z.string().optional(),
  requiredProfileFields: z.string().optional(),
});

export async function updateStudentSettings(req: Request, res: Response) {
  const data = studentSettingsSchema.parse(req.body);
  const settings = await settingsService.updateStudentSettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'Student settings updated successfully',
  });
}

const companySettingsSchema = z.object({
  requireDriveApproval: z.boolean().optional(),
  notifyOnNewDrive: z.boolean().optional(),
  maxApplicationsPerStudent: z.number().int().min(1).optional(),
});

export async function updateCompanySettings(req: Request, res: Response) {
  const data = companySettingsSchema.parse(req.body);
  const settings = await settingsService.updateCompanySettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'Company settings updated successfully',
  });
}

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  notifyApplicationStatus: z.boolean().optional(),
  notifyNewDrive: z.boolean().optional(),
});

export async function updateNotificationSettings(req: Request, res: Response) {
  const data = notificationSettingsSchema.parse(req.body);
  const settings = await settingsService.updateNotificationSettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'Notification settings updated successfully',
  });
}

const securitySettingsSchema = z.object({
  sessionTimeout: z.number().int().min(300).max(86400).optional(),
  minPasswordLength: z.number().int().min(6).max(32).optional(),
  requirePasswordComplexity: z.boolean().optional(),
  maxLoginAttempts: z.number().int().min(3).max(10).optional(),
  enableTwoFactor: z.boolean().optional(),
});

export async function updateSecuritySettings(req: Request, res: Response) {
  const data = securitySettingsSchema.parse(req.body);
  const settings = await settingsService.updateSecuritySettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'Security settings updated successfully',
  });
}

const appearanceSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  loginBannerUrl: z.string().url().optional().nullable(),
  customCss: z.string().optional().nullable(),
});

export async function updateAppearanceSettings(req: Request, res: Response) {
  const data = appearanceSettingsSchema.parse(req.body);
  const settings = await settingsService.updateAppearanceSettings(data, req.user!.userId);

  res.json({
    success: true,
    data: { settings },
    message: 'Appearance settings updated successfully',
  });
}