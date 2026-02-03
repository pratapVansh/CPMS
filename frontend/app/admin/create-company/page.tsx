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

export default function CreateCompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    roleOffered: '',
    description: '',
    minCgpa: '',
    package: '',
    deadline: '',
    allowedBranches: [] as string[],
    allowedYears: [] as number[],
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
      name: formData.name,
      roleOffered: formData.roleOffered,
      description: formData.description || undefined,
      minCgpa: formData.minCgpa ? parseFloat(formData.minCgpa) : undefined,
      package: formData.package || undefined,
      deadline: formData.deadline,
      allowedBranches: formData.allowedBranches.length > 0 ? formData.allowedBranches : undefined,
      allowedYears: formData.allowedYears.length > 0 ? formData.allowedYears : undefined,
    });

    setLoading(false);

    if (response.success) {
      router.push('/admin/dashboard');
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
                <Input
                  label="Company Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Google, Microsoft, Reliance"
                />

                <Input
                  label="Role Offered"
                  name="roleOffered"
                  value={formData.roleOffered}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Software Engineer, Data Analyst"
                />

                <Textarea
                  label="Job Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the role, responsibilities, and requirements..."
                />

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
                    label="Package (LPA)"
                    name="package"
                    value={formData.package}
                    onChange={handleChange}
                    placeholder="e.g., 12-15 LPA"
                  />
                </FormRow>

                <Input
                  label="Application Deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                />

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

                <div className="flex gap-3 pt-4">
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
