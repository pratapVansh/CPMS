'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  total: number;
  byStatus: {
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
}

interface Company {
  id: string;
  name: string;
  roleOffered: string;
  deadline: string;
  _count: {
    applications: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const [statsRes, companiesRes] = await Promise.all([
      apiGet<{ stats: Stats }>('/admin/stats'),
      apiGet<{ companies: Company[] }>('/admin/companies?limit=5'),
    ]);

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data.stats);
    }
    if (companiesRes.success && companiesRes.data) {
      setCompanies(companiesRes.data.companies);
    }
    setLoading(false);
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
              className="py-3 border-b-2 border-primary-500 text-primary-600 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/create-company"
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Create Drive
            </Link>
            <Link
              href="/admin/students"
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Students
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Applications</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.byStatus.applied}</p>
                  <p className="text-sm text-gray-500">Applied</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.byStatus.shortlisted}</p>
                  <p className="text-sm text-gray-500">Shortlisted</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.byStatus.selected}</p>
                  <p className="text-sm text-gray-500">Selected</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-red-600">{stats.byStatus.rejected}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </div>
            )}

            {/* Recent Companies */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Placement Drives</h2>
              <Link href="/admin/create-company" className="btn btn-primary">
                + Create Drive
              </Link>
            </div>

            {companies.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                No placement drives yet.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Deadline</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Applications</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td className="px-4 py-4 font-medium text-gray-900">{company.name}</td>
                        <td className="px-4 py-4 text-gray-600">{company.roleOffered}</td>
                        <td className="px-4 py-4 text-gray-600">
                          {new Date(company.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-gray-600">{company._count.applications}</td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/company/${company.id}`}
                            className="text-primary-600 hover:underline"
                          >
                            View Applicants
                          </Link>
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
