'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  roleOffered: string;
  minCgpa: number;
  allowedBranches: string[];
  deadline: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchEligibleCompanies();
  }, [router]);

  const fetchEligibleCompanies = async () => {
    const response = await apiGet<{ companies: Company[]; count: number }>('/student/companies/eligible');
    if (response.success && response.data) {
      setCompanies(response.data.companies);
    }
    setLoading(false);
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
              className="py-3 border-b-2 border-primary-500 text-primary-600 font-medium"
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
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Eligible Companies</h2>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : companies.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">
            No eligible companies found at the moment.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <div key={company.id} className="card">
                <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                <p className="text-gray-600 mt-1">{company.roleOffered}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Min CGPA:</span>{' '}
                    <span className="font-medium">{company.minCgpa}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Branches:</span>{' '}
                    <span className="font-medium">
                      {company.allowedBranches.length > 0
                        ? company.allowedBranches.join(', ')
                        : 'All branches'}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Deadline:</span>{' '}
                    <span className="font-medium">
                      {new Date(company.deadline).toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/student/applications?apply=${company.id}`}
                  className="btn btn-primary w-full mt-4"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
