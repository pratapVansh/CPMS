'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { Plus, Shield, Clock, Trash2 } from 'lucide-react';
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
  Input,
  FormGroup,
  FormRow,
  Grid,
  SectionTitle,
} from '@/components/common';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  target: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const [adminsRes, logsRes] = await Promise.all([
      apiGet<{ admins: Admin[] }>('/superadmin/admins'),
      apiGet<{ logs: AuditLog[] }>('/superadmin/audit-logs?limit=10'),
    ]);

    if (adminsRes.success && adminsRes.data) {
      setAdmins(adminsRes.data.admins);
    }
    if (logsRes.success && logsRes.data) {
      setAuditLogs(logsRes.data.logs);
    }
    setLoading(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    const response = await apiPost('/superadmin/admins', formData);

    if (response.success) {
      setSuccess('Admin created successfully!');
      setFormData({ name: '', email: '', password: '' });
      setShowCreateForm(false);
      fetchData();
    } else {
      setError(response.error?.message || 'Failed to create admin');
    }
    setCreating(false);
  };

  const handleToggleStatus = async (adminId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const response = await apiPatch(`/superadmin/admins/${adminId}/status`, { status: newStatus });

    if (response.success) {
      fetchData();
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    const response = await apiDelete(`/superadmin/admins/${adminId}`);
    if (response.success) {
      fetchData();
    }
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

  if (!user) return <PageLoading />;

  const adminColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (admin: Admin) => <span className="font-medium">{admin.name}</span>,
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (admin: Admin) => (
        <span className={admin.role === 'SUPER_ADMIN' ? 'text-purple-600 font-medium' : ''}>
          {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (admin: Admin) => <StatusBadge status={admin.status.toLowerCase()} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (admin: Admin) => formatDate(admin.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (admin: Admin) =>
        admin.role !== 'SUPER_ADMIN' ? (
          <div className="flex gap-2">
            <Button
              variant={admin.status === 'ACTIVE' ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleStatus(admin.id, admin.status)}
            >
              {admin.status === 'ACTIVE' ? 'Disable' : 'Enable'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Protected</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="superadmin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
      <PageContainer>
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
            <p className="text-center text-gray-500 py-4">Loading...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Admin Management */}
              <PageTitle
                description="Create, manage and monitor admin accounts"
                action={
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Admin
                  </Button>
                }
              >
                Super Admin Dashboard
              </PageTitle>

              {showCreateForm && (
                <Card className="mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Create New Admin</h3>
                  <form onSubmit={handleCreateAdmin}>
                    <FormGroup>
                      <FormRow>
                        <Input
                          label="Name"
                          value={formData.name}
                          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                          required
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                          required
                        />
                      </FormRow>
                      <Input
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                        required
                      />
                      <div className="flex gap-3">
                        <Button type="submit" loading={creating}>
                          Create Admin
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setShowCreateForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </FormGroup>
                  </form>
                </Card>
              )}

              {admins.length === 0 ? (
                <EmptyState type="no-data" description="No admins have been created yet." />
              ) : (
                <DataTable columns={adminColumns} data={admins} keyExtractor={(a) => a.id} />
              )}
            </div>

            {/* Sidebar - Audit Logs */}
            <div>
              <SectionTitle>Recent Activity</SectionTitle>
              <Card padding="none">
                {auditLogs.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No recent activity</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{log.action}</p>
                            {log.target && (
                              <p className="text-xs text-gray-500 truncate">{log.target}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {log.user.name} • {formatDate(log.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </PageContainer>

      <AppFooter />
      </div>
    </div>
  );
}
