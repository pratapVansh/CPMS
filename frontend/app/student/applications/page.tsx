'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  Button,
} from '@/components/common';

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
      router.replace('/student/applications');
    } else {
      setMessage({ type: 'error', text: response.error?.message || 'Failed to apply' });
    }

    setApplying(false);
  };

  if (!user) return <PageLoading />;

  const columns = [
    {
      key: 'sno',
      header: 'S.No.',
      render: (_: Application, index: number) =>
        pagination ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1,
    },
    {
      key: 'company',
      header: 'Company',
      render: (app: Application) => <span className="font-medium">{app.company.name}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (app: Application) => app.company.roleOffered,
    },
    {
      key: 'appliedOn',
      header: 'Applied On',
      render: (app: Application) =>
        new Date(app.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: Application) => <StatusBadge status={app.status.toLowerCase()} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="student" />
      <div className="pt-16 md:pt-16">
      <PageContainer>
        <PageTitle description="Track the status of all your placement applications">My Applications</PageTitle>

        {message && (
          <div
            className={`mb-4 p-3 rounded border text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-red-50 text-red-700 border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {applying && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-300 rounded text-sm">
            Submitting application...
          </div>
        )}

        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading applications...</p>
          </Card>
        ) : applications.length === 0 ? (
          <EmptyState
            type="no-applications"
            action={{ label: 'Browse Eligible Companies', href: '/student/dashboard' }}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={applications}
              keyExtractor={(app) => app.id}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Card padding="sm" className="mt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} applications
                  </p>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchApplications(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Previous
                    </Button>
                    <span className="px-3 text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchApplications(pagination.page + 1)}
                      disabled={!pagination.hasMore}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Status Legend */}
        <Card className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Application Status Guide</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status="applied" />
              <span className="text-gray-600">Application submitted, awaiting review</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="shortlisted" />
              <span className="text-gray-600">Selected for next round</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="selected" />
              <span className="text-gray-600">Offer received</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="rejected" />
              <span className="text-gray-600">Not selected</span>
            </div>
          </div>
        </Card>
      </PageContainer>

      <AppFooter />
      </div>
    </div>
  );
}
