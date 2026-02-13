'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Plus, Edit2, Trash2, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  DataTable,
  Button,
  EmptyState,
  PageLoading,
} from '@/components/common';

interface Notice {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function NoticesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchNotices(1);
  }, [router]);

  const fetchNotices = async (page: number) => {
    setLoading(true);
    const response = await apiGet<{ notices: Notice[]; pagination: PaginationInfo }>(
      `/admin/notices?page=${page}&limit=10`
    );
    if (response.success && response.data) {
      setNotices(response.data.notices);
      setPagination(response.data.pagination);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (editingNotice) {
      const response = await apiPut(`/admin/notices/${editingNotice.id}`, formData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Notice updated successfully!' });
        fetchNotices(pagination?.page || 1);
        resetForm();
      } else {
        setMessage({ type: 'error', text: response.error?.message || 'Failed to update notice' });
      }
    } else {
      const response = await apiPost('/admin/notices', formData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Notice created successfully!' });
        fetchNotices(1);
        resetForm();
      } else {
        setMessage({ type: 'error', text: response.error?.message || 'Failed to create notice' });
      }
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      description: notice.description,
      priority: notice.priority,
    });
    setShowModal(true);
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    const response = await apiDelete(`/admin/notices/${noticeId}`);
    if (response.success) {
      setMessage({ type: 'success', text: 'Notice deleted successfully!' });
      fetchNotices(pagination?.page || 1);
    } else {
      setMessage({ type: 'error', text: response.error?.message || 'Failed to delete notice' });
    }
  };

  const handleToggleActive = async (notice: Notice) => {
    const response = await apiPut(`/admin/notices/${notice.id}`, {
      isActive: !notice.isActive,
    });
    if (response.success) {
      setMessage({ type: 'success', text: `Notice ${!notice.isActive ? 'activated' : 'deactivated'} successfully!` });
      fetchNotices(pagination?.page || 1);
    } else {
      setMessage({ type: 'error', text: response.error?.message || 'Failed to update notice' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'NORMAL',
    });
    setEditingNotice(null);
    setShowModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return <PageLoading />;

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (notice: Notice) => (
        <div>
          <span className="font-medium">{notice.title}</span>
          {!notice.isActive && <span className="ml-2 text-xs text-gray-500">(Inactive)</span>}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (notice: Notice) => (
        <span className="text-sm text-gray-600 line-clamp-2">{notice.description}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (notice: Notice) => (
        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(notice.priority)}`}>
          {notice.priority}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (notice: Notice) => formatDate(notice.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (notice: Notice) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleToggleActive(notice)}
            className={`text-xs px-2 py-1 rounded ${
              notice.isActive
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {notice.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => handleEdit(notice)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(notice.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
        <PageContainer>
          <div className="flex justify-between items-center mb-6">
            <PageTitle description="Manage placement notices and announcements">Notices Management</PageTitle>
            <Button onClick={() => setShowModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Notice
            </Button>
          </div>

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

          {loading ? (
            <Card>
              <p className="text-center text-gray-500 py-4">Loading notices...</p>
            </Card>
          ) : notices.length === 0 ? (
            <EmptyState
              type="no-data"
              description="No notices found. Create your first notice to get started."
            />
          ) : (
            <>
              <DataTable columns={columns} data={notices} keyExtractor={(notice) => notice.id} />

              {pagination && pagination.totalPages > 1 && (
                <Card padding="sm" className="mt-4">
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

      {/* Create/Edit Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingNotice ? 'Edit Notice' : 'Create New Notice'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  This notice will be visible to all students immediately after creation. You can deactivate it later if needed.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNotice ? 'Update Notice' : 'Create Notice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
