'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { Plus, Users, Building2, Briefcase, TrendingUp, FileText, CheckCircle, Star, XCircle } from 'lucide-react';
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
  SectionTitle,
  StatCard,
} from '@/components/common';

interface Stats {
  total: number;
  byStatus: {
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
}

interface Company {
  id: string;
  name: string;
  roleOffered: string;
  deadline: string;
  eligibleBranches?: string[];
  status?: 'OPEN' | 'CLOSED';
  _count: {
    applications: number;
  };
}

interface DashboardStats {
  totalDrives: number;
  totalStudents: number;
  totalApplications: number;
  ongoingDrives: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalDrives: 0,
    totalStudents: 0,
    totalApplications: 0,
    ongoingDrives: 0,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const [statsRes, companiesRes] = await Promise.all([
      apiGet<{ stats: Stats }>('/admin/stats'),
      apiGet<{ companies: Company[] }>('/admin/companies?limit=10'),
    ]);

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data.stats);
      setDashboardStats((prev) => ({
        ...prev,
        totalApplications: statsRes.data!.stats.total,
      }));
    }
    if (companiesRes.success && companiesRes.data) {
      const allCompanies = companiesRes.data.companies;
      setCompanies(allCompanies);

      const now = new Date();
      const ongoing = allCompanies.filter((c) => new Date(c.deadline) >= now).length;
      setDashboardStats((prev) => ({
        ...prev,
        totalDrives: allCompanies.length,
        ongoingDrives: ongoing,
      }));
    }
    setLoading(false);
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
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
      header: 'Company Name',
      render: (company: Company) => <span className="font-medium">{company.name}</span>,
    },
    { key: 'roleOffered', header: 'Role' },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (company: Company) => formatDate(company.deadline),
    },
    {
      key: 'applications',
      header: 'Applications',
      className: 'text-center',
      render: (company: Company) => company._count.applications,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-center',
      render: (company: Company) => (
        <StatusBadge status={isDeadlinePassed(company.deadline) ? 'closed' : 'open'} />
      ),
    },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      render: (company: Company) => (
        <Link href={`/admin/company/${company.id}`} className="text-blue-600 hover:underline text-sm">
          View →
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-16 md:pt-16">
      <PageContainer>
        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading dashboard...</p>
          </Card>
        ) : (
          <>
            <PageTitle description="Overview of placement activities and statistics">Admin Dashboard</PageTitle>

            {/* Summary Cards - Using StatCard for consistency */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Drives"
                value={dashboardStats.totalDrives}
                icon={<Building2 className="w-5 h-5" />}
                color="blue"
                subtitle="Placement drives created"
              />
              <StatCard
                title="Ongoing Drives"
                value={dashboardStats.ongoingDrives}
                icon={<TrendingUp className="w-5 h-5" />}
                color="green"
                subtitle="Active with open deadlines"
              />
              <StatCard
                title="Total Students"
                value={dashboardStats.totalStudents || '—'}
                icon={<Users className="w-5 h-5" />}
                color="purple"
                subtitle="Registered on platform"
              />
              <StatCard
                title="Total Applications"
                value={dashboardStats.totalApplications}
                icon={<FileText className="w-5 h-5" />}
                color="gray"
                subtitle="Submissions received"
              />
            </div>

            {/* Application Status Breakdown */}
            {stats && (
              <div className="mb-8">
                <SectionTitle>Application Status Breakdown</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Applied"
                    value={stats.byStatus.applied}
                    icon={<FileText className="w-5 h-5" />}
                    color="blue"
                  />
                  <StatCard
                    title="Shortlisted"
                    value={stats.byStatus.shortlisted}
                    icon={<Star className="w-5 h-5" />}
                    color="yellow"
                  />
                  <StatCard
                    title="Selected"
                    value={stats.byStatus.selected}
                    icon={<CheckCircle className="w-5 h-5" />}
                    color="green"
                  />
                  <StatCard
                    title="Rejected"
                    value={stats.byStatus.rejected}
                    icon={<XCircle className="w-5 h-5" />}
                    color="red"
                  />
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mb-8">
              <SectionTitle>Quick Actions</SectionTitle>
              <Card>
                <div className="flex flex-wrap gap-3">
                  <LinkButton href="/admin/create-company" leftIcon={<Plus className="w-4 h-4" />}>
                    Create New Drive
                  </LinkButton>
                  <LinkButton href="/admin/students" variant="secondary" leftIcon={<Users className="w-4 h-4" />}>
                    View All Students
                  </LinkButton>
                  <LinkButton href="/admin/drives" variant="secondary" leftIcon={<Building2 className="w-4 h-4" />}>
                    View All Drives
                  </LinkButton>
                </div>
              </Card>
            </div>

            {/* Recent Placement Drives */}
            <SectionTitle>Recent Placement Drives</SectionTitle>
            {companies.length === 0 ? (
              <EmptyState
                type="no-companies"
                action={{ label: 'Create your first drive', href: '/admin/create-company' }}
              />
            ) : (
              <DataTable columns={columns} data={companies.slice(0, 5)} keyExtractor={(company) => company.id} />
            )}

            {companies.length > 5 && (
              <div className="mt-4 text-center">
                <Link href="/admin/drives" className="text-blue-600 hover:underline text-sm">
                  View all drives →
                </Link>
              </div>
            )}
          </>
        )}
      </PageContainer>

      <AppFooter />
      </div>
    </div>
  );
}
