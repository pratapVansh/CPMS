'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    roleOffered: string;
  };
}

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
  applications: Application[];
}

export default function AdminStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchStudent();
  }, [router, studentId]);

  const fetchStudent = async () => {
    setLoading(true);
    setError('');

    const response = await apiGet<{ student: StudentProfile }>(
      `/admin/students/${studentId}`
    );

    if (response.success && response.data) {
      setStudent(response.data.student);
    } else {
      setError(response.error?.message || 'Failed to load student');
    }
    setLoading(false);
  };

  const openDocument = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-100 text-blue-700';
      case 'SHORTLISTED':
        return 'bg-yellow-100 text-yellow-700';
      case 'SELECTED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/students"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Students
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Student Details</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.name}</span>
            <button
              onClick={() => logout()}
              className="text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : student ? (
          <div className="space-y-6">
            {/* Profile Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">Name</label>
                  <p className="text-gray-900 font-medium">{student.name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Email</label>
                  <p className="text-gray-900">{student.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Branch</label>
                  <p className="text-gray-900">{student.branch || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">CGPA</label>
                  <p className="text-gray-900 font-medium">
                    {student.cgpa?.toFixed(2) || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Registered</label>
                  <p className="text-gray-900">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Documents</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resume */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Resume</h3>
                  {student.hasResume ? (
                    <div>
                      <span className="inline-flex items-center text-green-600 text-sm mb-3">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Uploaded
                      </span>
                      <button
                        onClick={() => openDocument(student.resumeUrl)}
                        className="block w-full mt-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 text-center"
                      >
                        View Resume
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Not uploaded</span>
                  )}
                </div>

                {/* Marksheet */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Marksheet</h3>
                  {student.hasMarksheet ? (
                    <div>
                      <span className="inline-flex items-center text-green-600 text-sm mb-3">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Uploaded
                      </span>
                      <button
                        onClick={() => openDocument(student.marksheetUrl)}
                        className="block w-full mt-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 text-center"
                      >
                        View Marksheet
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Not uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Applications Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Applications</h2>

              {student.applications.length === 0 ? (
                <p className="text-gray-500">No applications yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          Company
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          Role
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          Applied On
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {student.applications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">
                            {app.company.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {app.company.roleOffered}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                app.status
                              )}`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Student not found
          </div>
        )}
      </main>
    </div>
  );
}
