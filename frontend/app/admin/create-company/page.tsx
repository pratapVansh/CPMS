'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, User } from '@/lib/auth';
import { apiPost } from '@/lib/api';
import Link from 'next/link';

export default function CreateCompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    roleOffered: '',
    minCgpa: '',
    allowedBranches: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const branches = formData.allowedBranches
      .split(',')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const response = await apiPost('/admin/company', {
      name: formData.name,
      roleOffered: formData.roleOffered,
      minCgpa: parseFloat(formData.minCgpa),
      allowedBranches: branches,
      deadline: new Date(formData.deadline).toISOString(),
    });

    if (response.success) {
      router.push('/admin/dashboard');
    } else {
      setError(response.error?.message || 'Failed to create company');
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
              className="py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/create-company"
              className="py-3 border-b-2 border-primary-500 text-primary-600 font-medium"
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Placement Drive</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Google"
                required
              />
            </div>

            <div>
              <label htmlFor="roleOffered" className="block text-sm font-medium text-gray-700 mb-1">
                Role Offered
              </label>
              <input
                id="roleOffered"
                name="roleOffered"
                type="text"
                value={formData.roleOffered}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Software Engineer"
                required
              />
            </div>

            <div>
              <label htmlFor="minCgpa" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum CGPA
              </label>
              <input
                id="minCgpa"
                name="minCgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.minCgpa}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 7.5"
                required
              />
            </div>

            <div>
              <label htmlFor="allowedBranches" className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Branches
              </label>
              <input
                id="allowedBranches"
                name="allowedBranches"
                type="text"
                value={formData.allowedBranches}
                onChange={handleChange}
                className="input"
                placeholder="e.g., CSE, ECE, IT (comma separated, leave empty for all)"
              />
              <p className="mt-1 text-sm text-gray-500">Leave empty to allow all branches</p>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Application Deadline
              </label>
              <input
                id="deadline"
                name="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Drive'}
              </button>
              <Link href="/admin/dashboard" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
