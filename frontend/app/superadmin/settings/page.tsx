'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { Mail, CheckCircle, AlertCircle, Building2, GraduationCap, Building, Bell, Shield, Palette } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  SectionTitle,
  Input,
  Button,
  Grid,
  PageLoading,
} from '@/components/common';

interface AllSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  emailFrom?: string;
  emailFromName?: string;
  smtpSecure?: boolean;
  institutionName?: string;
  institutionLogo?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  academicYear?: string;
  placementStartDate?: string | null;
  placementEndDate?: string | null;
  defaultMinCgpa?: number;
  defaultMaxBacklogs?: number;
  maxResumeSize?: number;
  allowedResumeFormats?: string;
  studentRegistrationOpen?: boolean;
  autoApproveStudents?: boolean;
  allowedBranches?: string;
  requiredProfileFields?: string;
  requireDriveApproval?: boolean;
  notifyOnNewDrive?: boolean;
  maxApplicationsPerStudent?: number;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  notifyApplicationStatus?: boolean;
  notifyNewDrive?: boolean;
  sessionTimeout?: number;
  minPasswordLength?: number;
  requirePasswordComplexity?: boolean;
  maxLoginAttempts?: number;
  enableTwoFactor?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  loginBannerUrl?: string | null;
  customCss?: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [settings, setSettings] = useState<AllSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    emailFrom: '',
    emailFromName: '',
    smtpSecure: true,
    institutionName: '',
    institutionLogo: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    websiteUrl: null,
    academicYear: '',
    placementStartDate: null,
    placementEndDate: null,
    defaultMinCgpa: 6.0,
    defaultMaxBacklogs: 0,
    maxResumeSize: 2,
    allowedResumeFormats: 'pdf,docx',
    studentRegistrationOpen: true,
    autoApproveStudents: false,
    allowedBranches: '',
    requiredProfileFields: '',
    requireDriveApproval: false,
    notifyOnNewDrive: true,
    maxApplicationsPerStudent: 10,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    notifyApplicationStatus: true,
    notifyNewDrive: true,
    sessionTimeout: 3600,
    minPasswordLength: 8,
    requirePasswordComplexity: true,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    loginBannerUrl: null,
    customCss: null,
  });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadSettings();
  }, [router]);

  async function loadSettings() {
    try {
      const response = await apiGet<{ settings: any }>('/superadmin/settings');
      if (response.success && response.data) {
        const data = response.data.settings;
        setSettings({
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || '',
          smtpPassword: '',
          emailFrom: data.emailFrom || '',
          emailFromName: data.emailFromName || '',
          smtpSecure: data.smtpSecure ?? true,
          institutionName: data.institutionName || '',
          institutionLogo: data.institutionLogo || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          address: data.address || null,
          websiteUrl: data.websiteUrl || null,
          academicYear: data.academicYear || '',
          placementStartDate: data.placementStartDate ? new Date(data.placementStartDate).toISOString().split('T')[0] : null,
          placementEndDate: data.placementEndDate ? new Date(data.placementEndDate).toISOString().split('T')[0] : null,
          defaultMinCgpa: data.defaultMinCgpa ?? 6.0,
          defaultMaxBacklogs: data.defaultMaxBacklogs ?? 0,
          maxResumeSize: data.maxResumeSize ?? 2,
          allowedResumeFormats: data.allowedResumeFormats || 'pdf,docx',
          studentRegistrationOpen: data.studentRegistrationOpen ?? true,
          autoApproveStudents: data.autoApproveStudents ?? false,
          allowedBranches: data.allowedBranches || '',
          requiredProfileFields: data.requiredProfileFields || '',
          requireDriveApproval: data.requireDriveApproval ?? false,
          notifyOnNewDrive: data.notifyOnNewDrive ?? true,
          maxApplicationsPerStudent: data.maxApplicationsPerStudent ?? 10,
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? false,
          pushNotifications: data.pushNotifications ?? false,
          notifyApplicationStatus: data.notifyApplicationStatus ?? true,
          notifyNewDrive: data.notifyNewDrive ?? true,
          sessionTimeout: data.sessionTimeout ?? 3600,
          minPasswordLength: data.minPasswordLength ?? 8,
          requirePasswordComplexity: data.requirePasswordComplexity ?? true,
          maxLoginAttempts: data.maxLoginAttempts ?? 5,
          enableTwoFactor: data.enableTwoFactor ?? false,
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#10B981',
          loginBannerUrl: data.loginBannerUrl || null,
          customCss: data.customCss || null,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(section: string, data: any) {
    setSaving(section);
    try {
      const response = await apiPatch(`/superadmin/settings/${section}`, data);
      if (response.success) {
        alert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
        if (section !== 'smtp') await loadSettings();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save settings');
    } finally {
      setSaving(null);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await apiPost('/superadmin/settings/smtp/test', {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        emailFrom: settings.emailFrom,
        emailFromName: settings.emailFromName,
        smtpSecure: settings.smtpSecure,
      } as Record<string, unknown>);
      setTestResult({
        success: response.success,
        message: response.message || 'Test completed',
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
      });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <InstitutionalNavbar user={user!} role="superadmin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
      <PageContainer>
        <div className="mb-6">
          <PageTitle description="Configure system-wide preferences">System Settings</PageTitle>
        </div>

        <div className="space-y-8">
          {/* SMTP Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-blue-600" />
              <SectionTitle>Email (SMTP) Settings</SectionTitle>
            </div>
            <Grid cols={2}>
              <Input
                label="SMTP Host"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
              <Input
                label="SMTP Port"
                type="number"
                value={settings.smtpPort?.toString()}
                onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
              />
              <Input
                label="SMTP Username"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              />
              <Input
                label="SMTP Password"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                placeholder="Leave empty to keep current"
              />
              <Input
                label="From Email"
                type="email"
                value={settings.emailFrom}
                onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
              />
              <Input
                label="From Name"
                value={settings.emailFromName}
                onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
              />
            </Grid>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={settings.smtpSecure}
                onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="smtpSecure" className="text-sm text-gray-700">Use SSL/TLS</label>
            </div>
            {testResult && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {testResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{testResult.message}</span>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleTest}
                variant="secondary"
                disabled={testing}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                onClick={() => handleSave('smtp', {
                  smtpHost: settings.smtpHost || undefined,
                  smtpPort: settings.smtpPort,
                  smtpUser: settings.smtpUser || undefined,
                  smtpPassword: settings.smtpPassword || undefined,
                  emailFrom: settings.emailFrom || undefined,
                  emailFromName: settings.emailFromName || undefined,
                  smtpSecure: settings.smtpSecure,
                })}
                disabled={saving === 'smtp'}
              >
                {saving === 'smtp' ? 'Saving...' : 'Save SMTP Settings'}
              </Button>
            </div>
          </Card>

          {/* Institution Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-blue-600" />
              <SectionTitle>Institution Settings</SectionTitle>
            </div>
            <Grid cols={2}>
              <Input
                label="Institution Name"
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
              />
              <Input
                label="Contact Email"
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
              <Input
                label="Contact Phone"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
              <Input
                label="Website URL"
                value={settings.websiteUrl || ''}
                onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
              />
            </Grid>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-6">
              <Button
                onClick={() => handleSave('institution', {
                  institutionName: settings.institutionName,
                  contactEmail: settings.contactEmail,
                  contactPhone: settings.contactPhone,
                  address: settings.address,
                  websiteUrl: settings.websiteUrl,
                })}
                disabled={saving === 'institution'}
              >
                {saving === 'institution' ? 'Saving...' : 'Save Institution Settings'}
              </Button>
            </div>
          </Card>

          {/* Placement Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <SectionTitle>Placement Settings</SectionTitle>
            </div>
            <Grid cols={2}>
              <Input
                label="Academic Year"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                placeholder="2025-2026"
              />
              <Input
                label="Placement Start Date"
                type="date"
                value={settings.placementStartDate || ''}
                onChange={(e) => setSettings({ ...settings, placementStartDate: e.target.value })}
              />
              <Input
                label="Placement End Date"
                type="date"
                value={settings.placementEndDate || ''}
                onChange={(e) => setSettings({ ...settings, placementEndDate: e.target.value })}
              />
              <Input
                label="Default Min CGPA"
                type="number"
                step="0.1"
                value={settings.defaultMinCgpa?.toString()}
                onChange={(e) => setSettings({ ...settings, defaultMinCgpa: parseFloat(e.target.value) })}
              />
              <Input
                label="Default Max Backlogs"
                type="number"
                value={settings.defaultMaxBacklogs?.toString()}
                onChange={(e) => setSettings({ ...settings, defaultMaxBacklogs: parseInt(e.target.value) })}
              />
              <Input
                label="Max Resume Size (MB)"
                type="number"
                value={settings.maxResumeSize?.toString()}
                onChange={(e) => setSettings({ ...settings, maxResumeSize: parseInt(e.target.value) })}
              />
              <Input
                label="Allowed Resume Formats"
                value={settings.allowedResumeFormats}
                onChange={(e) => setSettings({ ...settings, allowedResumeFormats: e.target.value })}
                placeholder="pdf,docx"
              />
            </Grid>
            <div className="mt-6">
              <Button
                onClick={() => handleSave('placement', {
                  academicYear: settings.academicYear,
                  placementStartDate: settings.placementStartDate,
                  placementEndDate: settings.placementEndDate,
                  defaultMinCgpa: settings.defaultMinCgpa,
                  defaultMaxBacklogs: settings.defaultMaxBacklogs,
                  maxResumeSize: settings.maxResumeSize,
                  allowedResumeFormats: settings.allowedResumeFormats,
                })}
                disabled={saving === 'placement'}
              >
                {saving === 'placement' ? 'Saving...' : 'Save Placement Settings'}
              </Button>
            </div>
          </Card>

          {/* Student Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-blue-600" />
              <SectionTitle>Student Settings</SectionTitle>
            </div>
            <Grid cols={2}>
              <Input
                label="Allowed Branches"
                value={settings.allowedBranches}
                onChange={(e) => setSettings({ ...settings, allowedBranches: e.target.value })}
                placeholder="CSE,IT,ECE,EEE,ME"
              />
              <Input
                label="Required Profile Fields"
                value={settings.requiredProfileFields}
                onChange={(e) => setSettings({ ...settings, requiredProfileFields: e.target.value })}
                placeholder="name,email,cgpa,branch"
              />
            </Grid>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="studentRegistrationOpen"
                  checked={settings.studentRegistrationOpen}
                  onChange={(e) => setSettings({ ...settings, studentRegistrationOpen: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="studentRegistrationOpen" className="text-sm text-gray-700">Student Registration Open</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoApproveStudents"
                  checked={settings.autoApproveStudents}
                  onChange={(e) => setSettings({ ...settings, autoApproveStudents: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="autoApproveStudents" className="text-sm text-gray-700">Auto-Approve Students</label>
              </div>
            </div>
            <div className="mt-6">
              <Button
                onClick={() => handleSave('student', {
                  studentRegistrationOpen: settings.studentRegistrationOpen,
                  autoApproveStudents: settings.autoApproveStudents,
                  allowedBranches: settings.allowedBranches,
                  requiredProfileFields: settings.requiredProfileFields,
                })}
                disabled={saving === 'student'}
              >
                {saving === 'student' ? 'Saving...' : 'Save Student Settings'}
              </Button>
            </div>
          </Card>

          {/* Company/Drive Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-blue-600" />
              <SectionTitle>Company & Drive Settings</SectionTitle>
            </div>
            <Grid cols={2}>
              <Input
                label="Max Applications Per Student"
                type="number"
                value={settings.maxApplicationsPerStudent?.toString()}
                onChange={(e) => setSettings({ ...settings, maxApplicationsPerStudent: parseInt(e.target.value) })}
              />
            </Grid>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireDriveApproval"
                  checked={settings.requireDriveApproval}
                  onChange={(e) => setSettings({ ...settings, requireDriveApproval: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="requireDriveApproval" className="text-sm text-gray-700">Require Drive Approval</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyOnNewDrive"
                  checked={settings.notifyOnNewDrive}
                  onChange={(e) => setSettings({ ...settings, notifyOnNewDrive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="notifyOnNewDrive" className="text-sm text-gray-700">Notify on New Drive</label>
              </div>
            </div>
            <div className="mt-6">
              <Button
                onClick={() => handleSave('company', {
                  requireDriveApproval: settings.requireDriveApproval,
                  notifyOnNewDrive: settings.notifyOnNewDrive,
                  maxApplicationsPerStudent: settings.maxApplicationsPerStudent,
                })}
                disabled={saving === 'company'}
              >
                {saving === 'company' ? 'Saving...' : 'Save Company Settings'}
              </Button>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-blue-600" />
              <SectionTitle>Notification Settings</SectionTitle>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="emailNotifications" className="text-sm text-gray-700">Email Notifications</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="smsNotifications" className="text-sm text-gray-700">SMS Notifications</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="pushNotifications" className="text-sm text-gray-700">Push Notifications</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyApplicationStatus"
                  checked={settings.notifyApplicationStatus}
                  onChange={(e) => setSettings({ ...settings, notifyApplicationStatus: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="notifyApplicationStatus" className="text-sm text-gray-700">Notify Application Status Changes</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyNewDrive"
                  checked={settings.notifyNewDrive}
                  onChange={(e) => setSettings({ ...settings, notifyNewDrive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="notifyNewDrive" className="text-sm text-gray-700">Notify New Drive</label>
              </div>
            </div>
            <div className="mt-6">
              <Button
                onClick={() => handleSave('notification', {
                  emailNotifications: settings.emailNotifications,
                  smsNotifications: settings.smsNotifications,
                  pushNotifications: settings.pushNotifications,
                  notifyApplicationStatus: settings.notifyApplicationStatus,
                  notifyNewDrive: settings.notifyNewDrive,
                })}
                disabled={saving === 'notification'}
              >
                {saving === 'notification' ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </div>
          </Card>

          {/* Security Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-blue-600" />
              <SectionTitle>Security Settings</SectionTitle>
            </div>
            <Grid cols={2}>
              <Input
                label="Session Timeout (seconds)"
                type="number"
                value={settings.sessionTimeout?.toString()}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              />
              <Input
                label="Min Password Length"
                type="number"
                value={settings.minPasswordLength?.toString()}
                onChange={(e) => setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) })}
              />
              <Input
                label="Max Login Attempts"
                type="number"
                value={settings.maxLoginAttempts?.toString()}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
              />
            </Grid>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requirePasswordComplexity"
                  checked={settings.requirePasswordComplexity}
                  onChange={(e) => setSettings({ ...settings, requirePasswordComplexity: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="requirePasswordComplexity" className="text-sm text-gray-700">Require Password Complexity</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableTwoFactor"
                  checked={settings.enableTwoFactor}
                  onChange={(e) => setSettings({ ...settings, enableTwoFactor: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="enableTwoFactor" className="text-sm text-gray-700">Enable Two-Factor Authentication</label>
              </div>
            </div>
            <div className="mt-6">
              <Button
                onClick={() => handleSave('security', {
                  sessionTimeout: settings.sessionTimeout,
                  minPasswordLength: settings.minPasswordLength,
                  requirePasswordComplexity: settings.requirePasswordComplexity,
                  maxLoginAttempts: settings.maxLoginAttempts,
                  enableTwoFactor: settings.enableTwoFactor,
                })}
                disabled={saving === 'security'}
              >
                {saving === 'security' ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-blue-600" />
              <SectionTitle>Appearance Settings</SectionTitle>
            </div>
            <Grid cols={2}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
              <Input
                label="Login Banner URL"
                value={settings.loginBannerUrl || ''}
                onChange={(e) => setSettings({ ...settings, loginBannerUrl: e.target.value })}
                placeholder="https://example.com/banner.jpg"
              />
            </Grid>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
              <textarea
                value={settings.customCss || ''}
                onChange={(e) => setSettings({ ...settings, customCss: e.target.value })}
                rows={4}
                placeholder="/* Add custom CSS styles here */"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <div className="mt-6">
              <Button
                onClick={() => handleSave('appearance', {
                  primaryColor: settings.primaryColor,
                  secondaryColor: settings.secondaryColor,
                  loginBannerUrl: settings.loginBannerUrl,
                  customCss: settings.customCss,
                })}
                disabled={saving === 'appearance'}
              >
                {saving === 'appearance' ? 'Saving...' : 'Save Appearance Settings'}
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
      <AppFooter />
      </div>
    </div>
  );
}
