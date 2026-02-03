'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiPost } from '@/lib/api';
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

export default function CreateCompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Company Details
    name: '',
    logoUrl: '',
    industry: '',
    website: '',
    description: '',
    
    // Job Details
    roleOffered: '',
    jobDescription: '',
    ctc: '',
    location: '',
    jobType: 'Full-time',
    
    // Eligibility Criteria
    minCgpa: '',
    maxBacklogs: '',
    allowedBranches: [] as string[],
    allowedYears: [] as number[],
    
    // Drive Schedule
    driveDate: '',
    deadline: '',
    selectionRounds: '',
    
    // Additional Info
    requiredDocuments: '',
    specialInstructions: '',
  });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

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
    setLoading(true);

    const response = await apiPost('/admin/companies', {
      // Company Details
      name: formData.name,
      logoUrl: formData.logoUrl || undefined,
      industry: formData.industry || undefined,
      website: formData.website || undefined,
      description: formData.description || undefined,
      
      // Job Details
      roleOffered: formData.roleOffered,
      jobDescription: formData.jobDescription || undefined,
      ctc: formData.ctc || undefined,
      location: formData.location || undefined,
      jobType: formData.jobType,
      
      // Eligibility Criteria
      minCgpa: formData.minCgpa ? parseFloat(formData.minCgpa) : undefined,
      maxBacklogs: formData.maxBacklogs ? parseInt(formData.maxBacklogs) : undefined,
      allowedBranches: formData.allowedBranches.length > 0 ? formData.allowedBranches : undefined,
      allowedYears: formData.allowedYears.length > 0 ? formData.allowedYears : undefined,
      
      // Drive Schedule
      driveDate: formData.driveDate || undefined,
      deadline: formData.deadline,
      selectionRounds: formData.selectionRounds || undefined,
      
      // Additional Info
      requiredDocuments: formData.requiredDocuments || undefined,
      specialInstructions: formData.specialInstructions || undefined,
    });

    setLoading(false);

    if (response.success) {
      router.push('/admin/drives');
    } else {
      setError(response.error?.message || 'Failed to create placement drive');
    }
  };

  if (!user) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-16 md:pt-16">
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <PageTitle description="Add a new company placement drive">Create Placement Drive</PageTitle>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <Card>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                {/* Company Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  
                  <Input
                    label="Company Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Google, Microsoft, Reliance"
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
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
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
                    placeholder="Brief description about the company..."
                  />
                </div>

                {/* Job Details Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                  
                  <Input
                    label="Role/Position Offered"
                    name="roleOffered"
                    value={formData.roleOffered}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Software Engineer, Data Analyst"
                  />

                  <Textarea
                    label="Job Description"
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the role, responsibilities, and requirements..."
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
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Eligibility Criteria Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Criteria</h3>
                  
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
                    <p className="text-xs text-gray-500 mb-2">
                      Leave unchecked to allow all branches
                    </p>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eligible Years
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Leave unchecked to allow all years
                    </p>
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

                {/* Drive Schedule Section */}
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
                    placeholder="e.g., Round 1: Online Test, Round 2: Technical Interview, Round 3: HR Interview"
                  />
                </div>

                {/* Additional Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  
                  <Textarea
                    label="Required Documents"
                    name="requiredDocuments"
                    value={formData.requiredDocuments}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g., Resume, Marksheets, ID Proof"
                  />

                  <Textarea
                    label="Special Instructions"
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any special notes or instructions for students..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="submit" loading={loading} fullWidth>
                    Create Placement Drive
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
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
