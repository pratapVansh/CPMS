'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setAccessToken } from '@/lib/api';
import { saveUser, User } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cgpa: '',
    branch: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [marksheetFile, setMarksheetFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const marksheetInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'resume' | 'marksheet'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size (5MB)
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
      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      if (formData.cgpa) submitData.append('cgpa', formData.cgpa);
      if (formData.branch) submitData.append('branch', formData.branch);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="cgpa" className="block text-sm font-medium text-gray-700 mb-1">
              CGPA
            </label>
            <input
              id="cgpa"
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.cgpa}
              onChange={handleChange}
              className="input"
              placeholder="Enter your CGPA"
            />
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <input
              id="branch"
              name="branch"
              type="text"
              value={formData.branch}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Computer Science"
            />
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume (PDF only, max 5MB)
            </label>
            <div className="flex items-center gap-3">
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
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm"
              >
                {resumeFile ? (
                  <span className="text-green-600 truncate">{resumeFile.name}</span>
                ) : (
                  <span className="text-gray-500">Choose Resume PDF</span>
                )}
              </label>
              {resumeFile && (
                <button
                  type="button"
                  onClick={() => {
                    setResumeFile(null);
                    if (resumeInputRef.current) resumeInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Marksheet Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latest Semester Marksheet (PDF only, max 5MB)
            </label>
            <div className="flex items-center gap-3">
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
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm"
              >
                {marksheetFile ? (
                  <span className="text-green-600 truncate">{marksheetFile.name}</span>
                ) : (
                  <span className="text-gray-500">Choose Marksheet PDF</span>
                )}
              </label>
              {marksheetFile && (
                <button
                  type="button"
                  onClick={() => {
                    setMarksheetFile(null);
                    if (marksheetInputRef.current) marksheetInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="Min 8 characters"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
