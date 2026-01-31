'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiGet, apiPut } from '@/lib/api';
import Link from 'next/link';

type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';

interface Application {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    cgpa: number | null;
    branch: string | null;
    resume: { url: string } | null;
  };
}

interface Company {
  id: string;
  name: string;
  roleOffered: string;
}

export default function CompanyApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchApplicants();
  }, [router, companyId]);

  const fetchApplicants = async () => {
    const response = await apiGet<{
      company: Company;
      applications: Application[];
    }>(`/admin/company/${companyId}/applicants?limit=100`);

    if (response.success && response.data) {
      setCompany(response.data.company);
      setApplications(response.data.applications);
    }
    setLoading(false);
  };

  const updateStatus = async (applicationId: string, status: ApplicationStatus) => {
    setUpdating(applicationId);
    const response = await apiPut(`/admin/applications/${applicationId}/status`, { status });

    if (response.success) {
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status } : app))
      );
    }
    setUpdating(null);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
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
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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
              href="/admin/dashboard"
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/create-company"
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Create Drive
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : !company ? (
          <div className="card text-center py-8 text-gray-500">Company not found</div>
        ) : (
          <>
            <div className="mb-6">
              <Link href="/admin/dashboard" className="text-primary-600 hover:underline">
                ← Back to Dashboard
              </Link>
            </div>

            <div className="card mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
              <p className="text-gray-600">{company.roleOffered}</p>
              <p className="text-sm text-gray-500 mt-2">
                {applications.length} applicant{applications.length !== 1 ? 's' : ''}
              </p>
            </div>

            {applications.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                No applications yet.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CGPA</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Branch</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Resume</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-4 py-4 font-medium text-gray-900">{app.student.name}</td>
                        <td className="px-4 py-4 text-gray-600">{app.student.email}</td>
                        <td className="px-4 py-4 text-gray-600">{app.student.cgpa ?? 'N/A'}</td>
                        <td className="px-4 py-4 text-gray-600">{app.student.branch ?? 'N/A'}</td>
                        <td className="px-4 py-4">
                          {app.student.resume ? (
                            <a
                              href={app.student.resume.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                        <td className="px-4 py-4">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                            disabled={updating === app.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="SELECTED">Selected</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
