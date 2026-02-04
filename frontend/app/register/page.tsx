'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { GraduationCap, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { setAccessToken, saveUser, User } from '@/lib/auth';
import { institution } from '@/lib/design-system';
import { Card, Button, Input, Select, FormGroup, FormRow, Checkbox, AppFooter } from '@/components/common';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const BRANCHES = [
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Information Technology', label: 'Information Technology' },
  { value: 'Computer Science and Design', label: 'Computer Science and Design' },
  { value: 'Mathematics and Computing', label: 'Mathematics and Computing' },
  { value: 'Petroleum Engineering', label: 'Petroleum Engineering' },
  { value: 'Chemical Engineering', label: 'Chemical Engineering' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering' },
];

const YEARS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

const SEMESTERS = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cgpa: '',
    branch: '',
    currentYear: '',
    currentSemester: '',
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [marksheetFile, setMarksheetFile] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const marksheetInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'resume' | 'marksheet'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    if (type === 'resume') {
      setResumeFile(file);
    } else {
      setMarksheetFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      if (formData.cgpa) submitData.append('cgpa', formData.cgpa);
      if (formData.branch) submitData.append('branch', formData.branch);
      if (formData.currentYear) submitData.append('currentYear', formData.currentYear);
      if (formData.currentSemester) submitData.append('currentSemester', formData.currentSemester);
      if (resumeFile) submitData.append('resume', resumeFile);
      if (marksheetFile) submitData.append('marksheet', marksheetFile);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: submitData,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data) {
        setAccessToken(data.data.accessToken);
        saveUser(data.data.user as User);
        Cookies.set('accessToken', data.data.accessToken, { expires: 7 });
        router.push('/student/dashboard');
      } else {
        setError(data.error?.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{institution.name}</h1>
              <p className="text-xs text-gray-600">{institution.systemFullName}</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Student Registration</h2>
              <p className="text-sm text-gray-500 mt-1">Create your account to get started</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@rgipt.ac.in"
                  required
                />

                <FormRow>
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    required
                  />
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                  />
                </FormRow>

                <FormRow>
                  <Input
                    label="CPI / CGPA"
                    name="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.cgpa}
                    onChange={handleChange}
                    placeholder="e.g., 8.5"
                  />
                  <Select
                    label="Branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    options={BRANCHES}
                    placeholder="Select your branch"
                  />
                </FormRow>

                <FormRow>
                  <Select
                    label="Current Year"
                    name="currentYear"
                    value={formData.currentYear}
                    onChange={handleChange}
                    options={YEARS}
                    placeholder="Select your year"
                  />
                  <Select
                    label="Current Semester"
                    name="currentSemester"
                    value={formData.currentSemester}
                    onChange={handleChange}
                    options={SEMESTERS}
                    placeholder="Select your semester"
                  />
                </FormRow>

                {/* Document Uploads */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Documents (Optional - PDF only, max 5MB)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        ref={resumeInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => handleFileChange(e, 'resume')}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-sm"
                      >
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className={resumeFile ? 'text-green-600' : 'text-gray-600'}>
                          {resumeFile ? 'Resume ✓' : 'Upload Resume'}
                        </span>
                      </label>
                    </div>
                    <div>
                      <input
                        ref={marksheetInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => handleFileChange(e, 'marksheet')}
                        className="hidden"
                        id="marksheet-upload"
                      />
                      <label
                        htmlFor="marksheet-upload"
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-sm"
                      >
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className={marksheetFile ? 'text-green-600' : 'text-gray-600'}>
                          {marksheetFile ? 'Marksheet ✓' : 'Upload Marksheet'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <Button type="submit" loading={loading} fullWidth className="mt-4">
                  Create Account
                </Button>
              </FormGroup>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
