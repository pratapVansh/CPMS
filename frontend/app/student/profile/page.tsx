'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiGet, apiPatch, apiDelete, apiUploadFile } from '@/lib/api';
import Link from 'next/link';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  cgpa: number | null;
  branch: string | null;
  createdAt: string;
  hasResume: boolean;
  hasMarksheet: boolean;
  resumeUrl: string | null;
  marksheetUrl: string | null;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<'resume' | 'marksheet' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [isEditingCgpa, setIsEditingCgpa] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const marksheetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    setLoading(true);
    const response = await apiGet<{ profile: StudentProfile }>('/profile');
    if (response.success && response.data) {
      setProfile(response.data.profile);
      setCgpa(response.data.profile.cgpa?.toString() || '');
    }
    setLoading(false);
  };

  const handleUpdateCgpa = async () => {
    setError('');
    setSuccess('');

    const cgpaNum = parseFloat(cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError('CPI must be between 0 and 10');
      return;
    }

    const response = await apiPatch('/profile/cpi', { cgpa: cgpaNum });
    if (response.success) {
      setSuccess('CPI updated successfully!');
      setIsEditingCgpa(false);
      fetchProfile();
    } else {
      setError(response.error?.message || 'Failed to update CPI');
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'resume' | 'marksheet'
  ) => {
    const file = event.target.files?.[0];
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
    setSuccess('');
    setUploading(type);

    const response = await apiUploadFile<{ resumeUrl?: string; marksheetUrl?: string }>(
      `/profile/${type}`,
      file,
      type
    );

    setUploading(null);

    if (response.success) {
      setSuccess(`${type === 'resume' ? 'Resume' : 'Marksheet'} uploaded successfully!`);
      fetchProfile();
    } else {
      setError(response.error?.message || `Failed to upload ${type}`);
    }

    // Reset the input
    if (type === 'resume' && resumeInputRef.current) {
      resumeInputRef.current.value = '';
    }
    if (type === 'marksheet' && marksheetInputRef.current) {
      marksheetInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (type: 'resume' | 'marksheet') => {
    if (!confirm(`Are you sure you want to delete your ${type}?`)) return;

    setError('');
    setSuccess('');

    const response = await apiDelete(`/profile/${type}`);
    if (response.success) {
      setSuccess(`${type === 'resume' ? 'Resume' : 'Marksheet'} deleted successfully!`);
      fetchProfile();
    } else {
      setError(response.error?.message || `Failed to delete ${type}`);
    }
  };

  const openDocument = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.name}</span>
            <button
              onClick={() => logout()}
              className="text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <Link
              href="/student/dashboard"
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/student/applications"
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              My Applications
            </Link>
            <Link
              href="/student/profile"
              className="py-3 border-b-2 border-primary-500 text-primary-600 font-medium"
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">Name</label>
                  <p className="text-gray-900 font-medium">{profile.name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Email</label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Branch</label>
                  <p className="text-gray-900">{profile.branch || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Member since</label>
                  <p className="text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* CPI Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">CPI / CGPA</h2>
                {!isEditingCgpa && (
                  <button
                    onClick={() => setIsEditingCgpa(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingCgpa ? (
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="input w-32"
                    placeholder="0.00"
                  />
                  <button
                    onClick={handleUpdateCgpa}
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCgpa(false);
                      setCgpa(profile.cgpa?.toString() || '');
                    }}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-3xl font-bold text-primary-600">
                  {profile.cgpa?.toFixed(2) || 'Not set'}
                </p>
              )}
            </div>

            {/* Documents Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Documents</h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload your resume and latest semester marksheet (PDF only, max 5MB)
              </p>

              <div className="space-y-6">
                {/* Resume */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Resume</h3>
                      <p className="text-sm text-gray-500">
                        {profile.hasResume ? (
                          <span className="text-green-600">✓ Uploaded</span>
                        ) : (
                          <span className="text-orange-600">Not uploaded</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {profile.hasResume && (
                        <>
                          <button
                            onClick={() => openDocument(profile.resumeUrl)}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteDocument('resume')}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => handleFileSelect(e, 'resume')}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        uploading === 'resume' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading === 'resume' ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          {profile.hasResume ? 'Replace Resume' : 'Upload Resume'}
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Marksheet */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Latest Semester Marksheet</h3>
                      <p className="text-sm text-gray-500">
                        {profile.hasMarksheet ? (
                          <span className="text-green-600">✓ Uploaded</span>
                        ) : (
                          <span className="text-orange-600">Not uploaded</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {profile.hasMarksheet && (
                        <>
                          <button
                            onClick={() => openDocument(profile.marksheetUrl)}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteDocument('marksheet')}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <input
                      ref={marksheetInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => handleFileSelect(e, 'marksheet')}
                      className="hidden"
                      id="marksheet-upload"
                    />
                    <label
                      htmlFor="marksheet-upload"
                      className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        uploading === 'marksheet' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading === 'marksheet' ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          {profile.hasMarksheet ? 'Replace Marksheet' : 'Upload Marksheet'}
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load profile
          </div>
        )}
      </main>
    </div>
  );
}
