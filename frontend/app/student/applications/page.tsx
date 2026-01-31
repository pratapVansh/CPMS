'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import Link from 'next/link';

interface Application {
  id: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';
  createdAt: string;
  company: {
    id: string;
    name: string;
    roleOffered: string;
    deadline: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    // Check if applying to a company
    const applyTo = searchParams.get('apply');
    if (applyTo) {
      handleApply(applyTo);
    }

    fetchApplications(1);
  }, [router, searchParams]);

  const fetchApplications = async (page: number) => {
    setLoading(true);
    const response = await apiGet<{ applications: Application[]; pagination: PaginationInfo }>(
      `/student/applications/my?page=${page}&limit=10`
    );
    if (response.success && response.data) {
      setApplications(response.data.applications);
      setPagination(response.data.pagination);
    }
    setLoading(false);
  };

  const handleApply = async (companyId: string) => {
    setApplying(true);
    setMessage(null);

    const response = await apiPost<{ application: Application }>('/student/applications/apply', {
      companyId,
    });

    if (response.success) {
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
      fetchApplications(1);
      // Remove query param
      router.replace('/student/applications');
    } else {
      setMessage({ type: 'error', text: response.error?.message || 'Failed to apply' });
    }

    setApplying(false);
  };

  const getStatusBadge = (status: Application['status']) => {
    const styles = {
      APPLIED: 'bg-blue-100 text-blue-800',
      SHORTLISTED: 'bg-yellow-100 text-yellow-800',
      SELECTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
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
              className="py-3 border-b-2 border-primary-500 text-primary-600 font-medium"
            >
              My Applications
            </Link>
            <Link
              href="/student/profile"
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {applying && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
            Submitting application...
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : applications.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">
            No applications yet.{' '}
            <Link href="/student/dashboard" className="text-primary-600 hover:underline">
              Browse eligible companies
            </Link>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Applied On</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-4 py-4 font-medium text-gray-900">{app.company.name}</td>
                      <td className="px-4 py-4 text-gray-600">{app.company.roleOffered}</td>
                      <td className="px-4 py-4 text-gray-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => fetchApplications(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchApplications(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
