'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPatch } from '@/lib/api';
import { ArrowLeft, Calendar, Users, Briefcase, FileText, Star, CheckCircle, XCircle } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  DataTable,
  StatusBadge,
  EmptyState,
  PageLoading,
  LinkButton,
  Button,
  Select,
  Grid,
  StatCard,
} from '@/components/common';

interface Application {
  id: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    cgpa: number | null;
    branch: string | null;
  };
}

interface Company {
  id: string;
  name: string;
  roleOffered: string;
  description: string | null;
  minCgpa: number | null;
  package: string | null;
  deadline: string;
  allowedBranches: string[];
  applications: Application[];
  _count: {
    applications: number;
  };
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchCompany();
  }, [router, companyId]);

  const fetchCompany = async () => {
    const response = await apiGet<{ company: Company }>(`/admin/companies/${companyId}`);
    if (response.success && response.data) {
      setCompany(response.data.company);
    }
    setLoading(false);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdating(applicationId);
    const response = await apiPatch(`/admin/applications/${applicationId}/status`, {
      status: newStatus,
    });
    if (response.success) {
      fetchCompany();
    }
    setUpdating(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!user) return <PageLoading />;

  const columns = [
    {
      key: 'name',
      header: 'Student Name',
      render: (app: Application) => (
        <Link href={`/admin/students/${app.user.id}`} className="font-medium text-blue-600 hover:underline">
          {app.user.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Email', render: (app: Application) => app.user.email },
    {
      key: 'branch',
      header: 'Branch',
      render: (app: Application) => app.user.branch || '—',
    },
    {
      key: 'cgpa',
      header: 'CPI',
      render: (app: Application) => app.user.cgpa?.toFixed(2) || '—',
    },
    {
      key: 'appliedOn',
      header: 'Applied On',
      render: (app: Application) => formatDate(app.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: Application) => (
        <select
          value={app.status}
          onChange={(e) => handleStatusChange(app.id, e.target.value)}
          disabled={updating === app.id}
          className="px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="APPLIED">Applied</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="SELECTED">Selected</option>
          <option value="REJECTED">Rejected</option>
        </select>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-16 md:pt-16">
      <PageContainer>
        <div className="mb-6">
          <Link
            href="/admin/drives"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Drives
          </Link>
        </div>

        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading company details...</p>
          </Card>
        ) : !company ? (
          <EmptyState type="error" title="Company not found" />
        ) : (
          <>
            {/* Company Info */}
            <Card className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                  <p className="text-gray-600 mt-1">{company.roleOffered}</p>
                </div>
                <StatusBadge status={new Date(company.deadline) < new Date() ? 'closed' : 'open'} />
              </div>

              {company.description && (
                <p className="text-sm text-gray-600 mt-4">{company.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Minimum CPI</p>
                  <p className="font-medium">{company.minCgpa?.toFixed(1) || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Package</p>
                  <p className="font-medium">{company.package || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="font-medium">{formatDate(company.deadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Eligible Branches</p>
                  <p className="font-medium">
                    {company.allowedBranches.length > 0 ? company.allowedBranches.join(', ') : 'All'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Application Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Applications"
                value={company._count.applications}
                icon={<FileText className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                title="Shortlisted"
                value={company.applications.filter((a) => a.status === 'SHORTLISTED').length}
                icon={<Star className="w-5 h-5" />}
                color="yellow"
              />
              <StatCard
                title="Selected"
                value={company.applications.filter((a) => a.status === 'SELECTED').length}
                icon={<CheckCircle className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                title="Rejected"
                value={company.applications.filter((a) => a.status === 'REJECTED').length}
                icon={<XCircle className="w-5 h-5" />}
                color="red"
              />
            </div>

            {/* Applicants Table */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicants</h2>
            {company.applications.length === 0 ? (
              <EmptyState type="no-applications" description="No students have applied yet." />
            ) : (
              <DataTable
                columns={columns}
                data={company.applications}
                keyExtractor={(app) => app.id}
              />
            )}
          </>
        )}
      </PageContainer>

      <AppFooter />
      </div>
    </div>
  );
}
