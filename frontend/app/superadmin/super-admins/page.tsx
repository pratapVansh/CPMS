'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { Shield, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
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
  FormRow,
  Grid,
  SectionTitle,
} from '@/components/common';

interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Metadata {
  total: number;
  max: number;
  min: number;
  canCreateMore: boolean;
  canDelete: boolean;
  slotsAvailable: number;
}

export default function SuperAdminsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadSuperAdmins();
  }, [router]);

  async function loadSuperAdmins() {
    try {
      const response = await apiGet<{
        superAdmins: SuperAdmin[];
        metadata: Metadata;
      }>('/superadmin/super-admins');

      if (response.success && response.data) {
        setSuperAdmins(response.data.superAdmins);
        setMetadata(response.data.metadata);
      } else {
        console.error('Failed to load super admins:', response.error);
      }
    } catch (error: any) {
      console.error('Failed to load super admins:', error);
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateSuperAdmin(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = await apiPost('/superadmin/super-admins', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        alert('✅ Super Admin created successfully');
        setShowCreateForm(false);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setFormErrors({});
        loadSuperAdmins();
      } else {
        setFormError(response.error?.message || 'Failed to create Super Admin');
      }
    } catch (error: any) {
      console.error('Failed to create super admin:', error);
      setFormError(error.message || 'Failed to create Super Admin');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSuperAdmin(id: string, name: string) {
    // First confirmation
    if (
      !confirm(
        `⚠️ PERMANENT DELETION WARNING\n\nYou are about to permanently delete Super Admin:\n"${name}"\n\nThis will:\n• Delete all their data from the database\n• Remove all their refresh tokens\n• Cannot be undone\n\nAre you absolutely sure?`
      )
    ) {
      return;
    }

    // Second confirmation with text input
    const confirmation = prompt(
      'To confirm deletion, type DELETE in all caps:'
    );
    
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      const response = await apiDelete(`/superadmin/super-admins/${id}`);

      if (response.success) {
        alert('✅ Super Admin deleted permanently');
        loadSuperAdmins();
      } else {
        alert(`❌ ${response.error?.message || 'Failed to delete Super Admin'}`);
      }
    } catch (error: any) {
      console.error('Failed to delete super admin:', error);
      alert(`❌ ${error.message || 'Failed to delete Super Admin'}`);
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
            <PageTitle description="Manage system super administrators (Max: 3, Min: 1)">
              <div className="flex items-center gap-2">
                <Shield className="w-7 h-7 text-purple-600" />
                Super Admin Management
              </div>
            </PageTitle>
          </div>

          {/* Metadata Card */}
          {metadata && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">System Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Current</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {metadata.total}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Maximum</div>
                  <div className="text-3xl font-bold text-gray-900">{metadata.max}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Minimum</div>
                  <div className="text-3xl font-bold text-gray-900">{metadata.min}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Available Slots</div>
                  <div className="text-3xl font-bold text-green-600">
                    {metadata.slotsAvailable}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Can Create</div>
                  <div className="text-3xl font-bold">
                    {metadata.canCreateMore ? '✓' : '✗'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Can Delete</div>
                  <div className="text-3xl font-bold">
                    {metadata.canDelete ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Warning */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong className="font-semibold">Security Notice:</strong> Deleting a Super Admin <strong>permanently removes all their data</strong> from the database, including refresh tokens. This action <strong>cannot be undone</strong>. At least one Super Admin must always exist. You cannot delete yourself.
            </div>
          </div>

          <Card>
            <div className="flex justify-between items-center mb-6">
              <SectionTitle>All Super Admins</SectionTitle>
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(!showCreateForm)}
                leftIcon={<UserPlus className="w-4 h-4" />}
                disabled={!metadata?.canCreateMore}
              >
                {metadata?.canCreateMore
                  ? 'Create Super Admin'
                  : `Max ${metadata?.max} Reached`}
              </Button>
            </div>

            {showCreateForm && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Create New Super Admin
                </h3>
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleCreateSuperAdmin}>
                  <Grid cols={2}>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (formErrors.name) {
                            setFormErrors({ ...formErrors, name: '' });
                          }
                        }}
                        placeholder="Enter full name"
                        className={formErrors.name ? 'border-red-300' : ''}
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-xs">{formErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (formErrors.email) {
                            setFormErrors({ ...formErrors, email: '' });
                          }
                        }}
                        placeholder="admin@example.com"
                        className={formErrors.email ? 'border-red-300' : ''}
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-xs">{formErrors.email}</p>
                      )}
                    </div>
                  </Grid>
                  <Grid cols={2}>
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (formErrors.password) {
                            setFormErrors({ ...formErrors, password: '' });
                          }
                        }}
                        placeholder="Minimum 8 characters"
                        className={formErrors.password ? 'border-red-300' : ''}
                      />
                      {formErrors.password && (
                        <p className="text-red-500 text-xs">{formErrors.password}</p>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          if (formErrors.confirmPassword) {
                            setFormErrors({ ...formErrors, confirmPassword: '' });
                          }
                        }}
                        placeholder="Re-enter password"
                        className={formErrors.confirmPassword ? 'border-red-300' : ''}
                      />
                      {formErrors.confirmPassword && (
                        <p className="text-red-500 text-xs">
                          {formErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </Grid>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> The new Super Admin will have full system
                      access. {metadata && `(${metadata.slotsAvailable} slot${metadata.slotsAvailable !== 1 ? 's' : ''} available)`}
                    </p>
                  </div>
                  <FormRow>
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Super Admin'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCreateForm(false);
                        setFormError('');
                        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                        setFormErrors({});
                      }}
                    >
                      Cancel
                    </Button>
                  </FormRow>
                </form>
              </div>
            )}

            {superAdmins.length === 0 ? (
              <EmptyState
                type="no-data"
                title="No Super Admins found"
                description="This should not happen - at least one Super Admin must exist"
              />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Name',
                    render: (admin: SuperAdmin) => (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-900">
                          {admin.name}
                          {admin.id === user?.id && (
                            <span className="ml-2 text-xs text-purple-600 font-semibold">
                              (You)
                            </span>
                          )}
                        </span>
                      </div>
                    ),
                  },
                  { key: 'email', header: 'Email' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (admin: SuperAdmin) => <StatusBadge status={admin.status} />,
                  },
                  {
                    key: 'createdAt',
                    header: 'Created',
                    render: (admin: SuperAdmin) =>
                      new Date(admin.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (admin: SuperAdmin) => {
                      const isSelf = admin.id === user?.id;
                      const canDeleteThis = metadata?.canDelete && !isSelf;

                      return (
                        <div className="flex gap-2">
                          {isSelf ? (
                            <span className="text-xs text-gray-400 px-3 py-1.5 bg-gray-100 rounded">
                              Protected (Self)
                            </span>
                          ) : !metadata?.canDelete ? (
                            <span className="text-xs text-gray-400 px-3 py-1.5 bg-gray-100 rounded">
                              Protected (Last SA)
                            </span>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<Trash2 className="w-4 h-4" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSuperAdmin(admin.id, admin.name);
                              }}
                            >
                              Delete Permanently
                            </Button>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
                data={superAdmins}
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
