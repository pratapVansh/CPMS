'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  EmptyState,
  PageLoading,
  Button,
} from '@/components/common';

interface Notice {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function StudentNoticesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchNotices(1);
  }, [router]);

  const fetchNotices = async (page: number) => {
    setLoading(true);
    const response = await apiGet<{ notices: Notice[]; pagination: PaginationInfo }>(
      `/student/notices?page=${page}&limit=10`
    );
    if (response.success && response.data) {
      setNotices(response.data.notices);
      setPagination(response.data.pagination);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'URGENT' || priority === 'HIGH') {
      return <AlertCircle className="w-5 h-5" />;
    }
    return <Calendar className="w-5 h-5" />;
  };

  if (!user) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="student" />
      <div className="pt-16 md:pt-16">
        <PageContainer>
          <PageTitle description="Stay updated with placement notices and announcements">Notices & Announcements</PageTitle>

          {loading ? (
            <Card>
              <p className="text-center text-gray-500 py-4">Loading notices...</p>
            </Card>
          ) : notices.length === 0 ? (
            <EmptyState
              type="no-data"
              description="No notices available at the moment. Check back later for updates."
            />
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {notices.map((notice) => (
                  <Card
                    key={notice.id}
                    className={`border-l-4 ${
                      notice.priority === 'URGENT' || notice.priority === 'HIGH'
                        ? 'border-l-red-500'
                        : 'border-l-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getPriorityColor(
                          notice.priority
                        )}`}
                      >
                        {getPriorityIcon(notice.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                              notice.priority
                            )}`}
                          >
                            {notice.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">
                          {notice.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Posted on {formatDate(notice.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <Card padding="sm">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} notices
                    </p>
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fetchNotices(pagination.page - 1)}
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
                        onClick={() => fetchNotices(pagination.page + 1)}
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
        </PageContainer>

        <AppFooter />
      </div>
    </div>
  );
}
