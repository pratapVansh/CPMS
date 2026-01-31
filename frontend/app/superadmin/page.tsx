'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import Link from 'next/link';

interface Admin {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  target: string;
  createdAt: string;
  user: { name: string; email: string };
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setLoading(true);
    const [adminsRes, logsRes] = await Promise.all([
      apiGet<{ admins: Admin[] }>('/superadmin/admins'),
      apiGet<{ logs: AuditLog[] }>('/superadmin/audit-logs?limit=20'),
    ]);

    if (adminsRes.success && adminsRes.data) {
      setAdmins(adminsRes.data.admins);
    }
    if (logsRes.success && logsRes.data) {
      setLogs(logsRes.data.logs);
    }
    setLoading(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const res = await apiPost('/superadmin/admin', formData);

    if (res.success) {
      setSuccess('Admin created successfully!');
      setFormData({ name: '', email: '', password: '' });
      setShowCreateForm(false);
      fetchData();
    } else {
      setError(res.error?.message || 'Failed to create admin');
    }
  };

  const handleToggleStatus = async (id: string) => {
    const res = await apiPatch(`/superadmin/admin/${id}/disable`, {});
    if (res.success) {
      fetchData();
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    const res = await apiDelete(`/superadmin/admin/${id}`);
    if (res.success) {
      fetchData();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Super Admin Panel</h1>
            <p className="text-indigo-200 text-sm">Manage administrators</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-indigo-200 hover:text-white">
              Admin Dashboard →
            </Link>
            <span className="text-indigo-200">|</span>
            <span>{user.name}</span>
            <button onClick={() => logout()} className="bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Administrators</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  {showCreateForm ? 'Cancel' : '+ Create Admin'}
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={handleCreateAdmin} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-4">Create New Admin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password (min 8 chars)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <button type="submit" className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Create Admin
                  </button>
                </form>
              )}

              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : admins.length === 0 ? (
                <p className="text-gray-500">No admins created yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Created</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="px-4 py-3 font-medium">{admin.name}</td>
                          <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                admin.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {admin.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleStatus(admin.id)}
                                className={`px-2 py-1 rounded text-xs ${
                                  admin.status === 'ACTIVE'
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {admin.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="border-l-2 border-indigo-200 pl-3 py-1">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-gray-500">
                        by {log.user.name} • {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Admins</h3>
            <p className="text-3xl font-bold text-indigo-600">{admins.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Active Admins</h3>
            <p className="text-3xl font-bold text-green-600">
              {admins.filter((a) => a.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Disabled Admins</h3>
            <p className="text-3xl font-bold text-red-600">
              {admins.filter((a) => a.status === 'DISABLED').length}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
