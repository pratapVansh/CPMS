'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { Plus, Shield, Trash2 } from 'lucide-react';
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

export default function AdminsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadAdmins();
  }, [router]);

  async function loadAdmins() {
    try {
      const response = await apiGet<{ admins: Admin[] }>('/superadmin/admins');
      if (response.success && response.data) {
        setAdmins(response.data.admins);
      }
    } catch (error: any) {
      console.error('Failed to load admins:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const response = await apiPost('/superadmin/admins', formData);
      if (response.success) {
        setFormData({ name: '', email: '', password: '' });
        setShowForm(false);
        loadAdmins();
      } else {
        setFormError(response.error?.message || 'Failed to create admin');
      }
    } catch (error: any) {
      setFormError(error.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusToggle(adminId: string, currentStatus: string) {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const response = await apiPatch(`/superadmin/admins/${adminId}/status`, { status: newStatus });
      if (response.success) {
        loadAdmins();
      }
    } catch (error) {
      console.error('Failed to update admin status:', error);
    }
  }

  async function handleDeleteAdmin(adminId: string) {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      const response = await apiDelete(`/superadmin/admins/${adminId}`);
      if (response.success) {
        loadAdmins();
      }
    } catch (error) {
      console.error('Failed to delete admin:', error);
    }
  }

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <InstitutionalNavbar user={user!} role="superadmin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
      <PageContainer>
        <div className="mb-6">
          <PageTitle description="Create and manage placement officers">
            Admin Management
          </PageTitle>
        </div>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>All Admins</SectionTitle>
            <Button
              variant="primary"
              onClick={() => setShowForm(!showForm)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Admin
            </Button>
          </div>

          {showForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New Admin
              </h3>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {formError}
                </div>
              )}
              <form onSubmit={handleCreateAdmin}>
                <Grid cols={2}>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </Grid>
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <FormRow>
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Admin'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setFormError('');
                      setFormData({ name: '', email: '', password: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </FormRow>
              </form>
            </div>
          )}

          {admins.length === 0 ? (
            <EmptyState
              type="no-data"
              title="No admins yet"
              description="Create your first admin to manage the placement system"
            />
          ) : (
            <DataTable
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'email', header: 'Email' },
                { key: 'role', header: 'Role' },
                { 
                  key: 'status', 
                  header: 'Status',
                  render: (admin: Admin) => <StatusBadge status={admin.status} />
                },
                { 
                  key: 'createdAt', 
                  header: 'Created',
                  render: (admin: Admin) => new Date(admin.createdAt).toLocaleDateString()
                },
                { 
                  key: 'actions', 
                  header: 'Actions',
                  render: (admin: Admin) => (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(admin.id, admin.status);
                        }}
                      >
                        {admin.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAdmin(admin.id);
                        }}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  )
                },
              ]}
              data={admins}
              keyExtractor={(admin) => admin.id}
            />
          )}
        </Card>
      </PageContainer>
      <AppFooter />
      </div>
    </div>
  );
}
