'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPatch, apiDelete, apiUploadFile } from '@/lib/api';
import { Upload, Trash2, Eye, Loader2 } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  CardHeader,
  InfoRow,
  Button,
  Input,
  PageLoading,
  StatusBadge,
} from '@/components/common';

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  cgpa: number | null;
  branch: string | null;
  currentYear: number | null;
  currentSemester: number | null;
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
  const [currentYear, setCurrentYear] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [isEditingYearSem, setIsEditingYearSem] = useState(false);

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
      setCurrentYear(response.data.profile.currentYear?.toString() || '');
      setCurrentSemester(response.data.profile.currentSemester?.toString() || '');
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

  const handleUpdateYearSem = async () => {
    setError('');
    setSuccess('');

    const year = parseInt(currentYear);
    const semester = parseInt(currentSemester);

    if (currentYear && (isNaN(year) || year < 1 || year > 4)) {
      setError('Year must be between 1 and 4');
      return;
    }

    if (currentSemester && (isNaN(semester) || semester < 1 || semester > 8)) {
      setError('Semester must be between 1 and 8');
      return;
    }

    const response = await apiPatch('/profile/year-semester', {
      currentYear: currentYear ? year : null,
      currentSemester: currentSemester ? semester : null,
    });

    if (response.success) {
      setSuccess('Year and semester updated successfully!');
      setIsEditingYearSem(false);
      fetchProfile();
    } else {
      setError(response.error?.message || 'Failed to update year and semester');
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'resume' | 'marksheet'
  ) => {
    const file = event.target.files?.[0];
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

  if (!user) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="student" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <PageTitle description="Manage your personal information and documents">My Profile</PageTitle>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded text-sm">
              {success}
            </div>
          )}

          {loading ? (
            <Card>
              <p className="text-center text-gray-500 py-4">Loading profile...</p>
            </Card>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Info Card */}
              <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Name</label>
                      <p className="text-gray-900 font-medium">{profile.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Branch</label>
                      <p className="text-gray-900">{profile.branch || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Member Since</label>
                      <p className="text-gray-900">
                        {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Year and Semester Card */}
              <Card padding="none">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Academic Year & Semester</h2>
                  {!isEditingYearSem && (
                    <button
                      onClick={() => setIsEditingYearSem(true)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {isEditingYearSem ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Current Year</label>
                          <select
                            value={currentYear}
                            onChange={(e) => setCurrentYear(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Current Semester</label>
                          <select
                            value={currentSemester}
                            onChange={(e) => setCurrentSemester(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Semester</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="6">Semester 6</option>
                            <option value="7">Semester 7</option>
                            <option value="8">Semester 8</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button onClick={handleUpdateYearSem} size="sm">
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsEditingYearSem(false);
                            setCurrentYear(profile?.currentYear?.toString() || '');
                            setCurrentSemester(profile?.currentSemester?.toString() || '');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Current Year</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {profile.currentYear ? `Year ${profile.currentYear}` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Current Semester</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {profile.currentSemester ? `Semester ${profile.currentSemester}` : 'Not set'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* CPI Card */}
              <Card padding="none">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">CPI / CGPA</h2>
                  {!isEditingCgpa && (
                    <button
                      onClick={() => setIsEditingCgpa(true)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {isEditingCgpa ? (
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        placeholder="0.00"
                        className="w-32"
                      />
                      <Button onClick={handleUpdateCgpa} size="sm">
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingCgpa(false);
                          setCgpa(profile.cgpa?.toString() || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-blue-600">
                      {profile.cgpa?.toFixed(2) || 'Not set'}
                    </p>
                  )}
                </div>
              </Card>

              {/* Documents Card */}
              <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your resume and latest semester marksheet (PDF only, max 5MB)
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Resume */}
                  <div className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">Resume</h3>
                        <p className="text-sm mt-1">
                          {profile.hasResume ? (
                            <StatusBadge status="uploaded">Uploaded</StatusBadge>
                          ) : (
                            <StatusBadge status="not_uploaded">Not uploaded</StatusBadge>
                          )}
                        </p>
                      </div>
                      {profile.hasResume && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDocument(profile.resumeUrl)}
                            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteDocument('resume')}
                            className="flex items-center gap-1 text-red-600 hover:underline text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <input
                        ref={resumeInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => handleFileSelect(e, 'resume')}
                        className="hidden"
                        id="resume-upload"
                        disabled={uploading === 'resume'}
                      />
                      <label
                        htmlFor="resume-upload"
                        className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-sm ${
                          uploading === 'resume' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading === 'resume' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {profile.hasResume ? 'Replace Resume' : 'Upload Resume'}
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Marksheet */}
                  <div className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">Latest Semester Marksheet</h3>
                        <p className="text-sm mt-1">
                          {profile.hasMarksheet ? (
                            <StatusBadge status="uploaded">Uploaded</StatusBadge>
                          ) : (
                            <StatusBadge status="not_uploaded">Not uploaded</StatusBadge>
                          )}
                        </p>
                      </div>
                      {profile.hasMarksheet && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDocument(profile.marksheetUrl)}
                            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteDocument('marksheet')}
                            className="flex items-center gap-1 text-red-600 hover:underline text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <input
                        ref={marksheetInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => handleFileSelect(e, 'marksheet')}
                        className="hidden"
                        id="marksheet-upload"
                        disabled={uploading === 'marksheet'}
                      />
                      <label
                        htmlFor="marksheet-upload"
                        className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-sm ${
                          uploading === 'marksheet' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading === 'marksheet' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {profile.hasMarksheet ? 'Replace Marksheet' : 'Upload Marksheet'}
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-4">Failed to load profile</p>
            </Card>
          )}
        </div>
      </PageContainer>
      <AppFooter />
      </div>
    </div>
  );
}
