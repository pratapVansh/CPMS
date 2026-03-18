'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPut } from '@/lib/api';
import { usePageShowGuard } from '@/lib/hooks';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  FormGroup,
  FormRow,
  Checkbox,
  PageLoading,
} from '@/components/common';
import { ArrowLeft } from 'lucide-react';

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Computer Science and Design',
  'Mathematics and Computing',
  'Petroleum Engineering',
  'Chemical Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
];

const YEARS = [1, 2, 3, 4];

const INDUSTRIES = [
  'Information Technology',
  'Consulting',
  'Finance & Banking',
  'E-commerce',
  'Manufacturing',
  'Energy & Oil',
  'Automotive',
  'Healthcare',
  'Telecommunications',
  'Other',
];

const JOB_TYPES = ['Full-time', 'Internship', 'Part-time', 'Contract'];
const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

function toDateInput(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  return isoDate.split('T')[0];
}

interface CompanyData {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  roleOffered: string;
  jobDescription: string | null;
  ctc: string | null;
  location: string | null;
  jobType: string | null;
  minCgpa: number | null;
  maxBacklogs: number | null;
  allowedBranches: string[];
  allowedYears: number[];
  driveDate: string | null;
  deadline: string;
  selectionRounds: string | null;
  requiredDocuments: string | null;
  specialInstructions: string | null;
  status: string;
}

export default function EditCompanyPage() {
  usePageShowGuard(['ADMIN', 'SUPER_ADMIN']);
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    industry: '',
    website: '',
    description: '',
    roleOffered: '',
    jobDescription: '',
    ctc: '',
    location: '',
    jobType: 'Full-time',
    minCgpa: '',
    maxBacklogs: '',
    allowedBranches: [] as string[],
    allowedYears: [] as number[],
    driveDate: '',
    deadline: '',
    selectionRounds: '',
    requiredDocuments: '',
    specialInstructions: '',
    status: 'upcoming',
  });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadDrive();
  }, [router, companyId]);

  const loadDrive = async () => {
    const response = await apiGet<{ company: CompanyData }>(`/admin/companies/${companyId}`);
    if (response.success && response.data) {
      const c = response.data.company;
      setFormData({
        name: c.name,
        logoUrl: c.logoUrl ?? '',
        industry: c.industry ?? '',
        website: c.website ?? '',
        description: c.description ?? '',
        roleOffered: c.roleOffered,
        jobDescription: c.jobDescription ?? '',
        ctc: c.ctc ?? '',
        location: c.location ?? '',
        jobType: c.jobType ?? 'Full-time',
        minCgpa: c.minCgpa !== null && c.minCgpa !== undefined ? String(c.minCgpa) : '',
        maxBacklogs: c.maxBacklogs !== null && c.maxBacklogs !== undefined ? String(c.maxBacklogs) : '',
        allowedBranches: c.allowedBranches ?? [],
        allowedYears: c.allowedYears ?? [],
        driveDate: toDateInput(c.driveDate),
        deadline: toDateInput(c.deadline),
        selectionRounds: c.selectionRounds ?? '',
        requiredDocuments: c.requiredDocuments ?? '',
        specialInstructions: c.specialInstructions ?? '',
        status: c.status ?? 'upcoming',
      });
    }
    setPageLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBranchToggle = (branch: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedBranches: prev.allowedBranches.includes(branch)
        ? prev.allowedBranches.filter((b) => b !== branch)
        : [...prev.allowedBranches, branch],
    }));
  };

  const handleYearToggle = (year: number) => {
    setFormData((prev) => ({
      ...prev,
      allowedYears: prev.allowedYears.includes(year)
        ? prev.allowedYears.filter((y) => y !== year)
        : [...prev.allowedYears, year],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const response = await apiPut(`/admin/companies/${companyId}`, {
      name: formData.name,
      logoUrl: formData.logoUrl || undefined,
      industry: formData.industry || undefined,
      website: formData.website || undefined,
      description: formData.description || undefined,
      roleOffered: formData.roleOffered,
      jobDescription: formData.jobDescription || undefined,
      ctc: formData.ctc || undefined,
      location: formData.location || undefined,
      jobType: formData.jobType,
      minCgpa: formData.minCgpa ? parseFloat(formData.minCgpa) : null,
      maxBacklogs: formData.maxBacklogs ? parseInt(formData.maxBacklogs) : null,
      allowedBranches: formData.allowedBranches,
      allowedYears: formData.allowedYears,
      driveDate: formData.driveDate || undefined,
      deadline: formData.deadline,
      selectionRounds: formData.selectionRounds || undefined,
      requiredDocuments: formData.requiredDocuments || undefined,
      specialInstructions: formData.specialInstructions || undefined,
      status: formData.status,
    });

    setSaving(false);

    if (response.success) {
      router.push(`/admin/company/${companyId}`);
    } else {
      setError(response.error?.message || 'Failed to update placement drive');
    }
  };

  if (!user || pageLoading) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
        <PageContainer>
          <div className="max-w-2xl mx-auto">
            <div className="mb-4">
              <Link
                href={`/admin/company/${companyId}`}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Drive Details
              </Link>
            </div>

            <PageTitle description="Update the placement drive details">Edit Placement Drive</PageTitle>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <Card>
              <form onSubmit={handleSubmit}>
                <FormGroup>
                  {/* Company Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>

                    <Input
                      label="Company Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />

                    <Input
                      label="Company Logo URL"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/logo.png"
                    />

                    <FormRow>
                      <Select
                        label="Industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                      >
                        <option value="">Select Industry</option>
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </Select>

                      <Input
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://company.com"
                      />
                    </FormRow>

                    <Textarea
                      label="Company Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  {/* Job Details */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>

                    <Input
                      label="Role/Position Offered"
                      name="roleOffered"
                      value={formData.roleOffered}
                      onChange={handleChange}
                      required
                    />

                    <Textarea
                      label="Job Description"
                      name="jobDescription"
                      value={formData.jobDescription}
                      onChange={handleChange}
                      rows={4}
                    />

                    <FormRow>
                      <Input
                        label="CTC Package"
                        name="ctc"
                        value={formData.ctc}
                        onChange={handleChange}
                        placeholder="e.g., 12-15 LPA"
                      />
                      <Input
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Bangalore, Remote"
                      />
                    </FormRow>

                    <Select
                      label="Job Type"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                    >
                      {JOB_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </div>

                  {/* Eligibility Criteria */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Criteria</h3>
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
                      If you relax the criteria (e.g. lower the min CPI or add branches), students who become
                      newly eligible will automatically receive an email notification.
                    </p>

                    <FormRow>
                      <Input
                        label="Minimum CPI"
                        name="minCgpa"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.minCgpa}
                        onChange={handleChange}
                        placeholder="e.g., 7.0"
                      />
                      <Input
                        label="Maximum Backlogs Allowed"
                        name="maxBacklogs"
                        type="number"
                        min="0"
                        value={formData.maxBacklogs}
                        onChange={handleChange}
                        placeholder="e.g., 0"
                      />
                    </FormRow>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Eligible Branches
                      </label>
                      <p className="text-xs text-gray-500 mb-2">Leave unchecked to allow all branches</p>
                      <div className="grid grid-cols-2 gap-2">
                        {BRANCHES.map((branch) => (
                          <Checkbox
                            key={branch}
                            label={branch}
                            checked={formData.allowedBranches.includes(branch)}
                            onChange={() => handleBranchToggle(branch)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Eligible Years
                      </label>
                      <p className="text-xs text-gray-500 mb-2">Leave unchecked to allow all years</p>
                      <div className="grid grid-cols-4 gap-2">
                        {YEARS.map((year) => (
                          <Checkbox
                            key={year}
                            label={`Year ${year}`}
                            checked={formData.allowedYears.includes(year)}
                            onChange={() => handleYearToggle(year)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Drive Schedule */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Drive Schedule</h3>

                    <FormRow>
                      <Input
                        label="Drive Date"
                        name="driveDate"
                        type="date"
                        value={formData.driveDate}
                        onChange={handleChange}
                      />
                      <Input
                        label="Application Deadline"
                        name="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={handleChange}
                        required
                      />
                    </FormRow>

                    <Textarea
                      label="Selection Process/Rounds"
                      name="selectionRounds"
                      value={formData.selectionRounds}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g., Round 1: Online Test, Round 2: Technical Interview"
                    />
                  </div>

                  {/* Additional Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>

                    <Textarea
                      label="Required Documents"
                      name="requiredDocuments"
                      value={formData.requiredDocuments}
                      onChange={handleChange}
                      rows={2}
                    />

                    <Textarea
                      label="Special Instructions"
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  {/* Drive Status */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Drive Status</h3>
                    <Select
                      label="Status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" loading={saving} fullWidth>
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push(`/admin/company/${companyId}`)}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </FormGroup>
              </form>
            </Card>
          </div>
        </PageContainer>
        <AppFooter />
      </div>
    </div>
  );
}
