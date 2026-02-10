'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { Plus, Search, Download, TrendingUp, Users, Building2, Clock } from 'lucide-react';
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
  Input,
  Button,
  StatCard,
  FilterTabs,
} from '@/components/common';

interface Company {
  id: string;
  name: string;
  roleOffered: string;
  deadline: string;
  minCgpa: number | null;
  allowedBranches: string[];
  _count: {
    applications: number;
  };
}

export default function DrivesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchCompanies();
  }, [router]);

  useEffect(() => {
    filterCompanies();
  }, [companies, search, statusFilter]);

  const fetchCompanies = async () => {
    const response = await apiGet<{ companies: Company[] }>('/admin/companies');
    if (response.success && response.data) {
      setCompanies(response.data.companies);
    }
    setLoading(false);
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.roleOffered.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((c) => {
        const isClosed = new Date(c.deadline) < now;
        return statusFilter === 'closed' ? isClosed : !isClosed;
      });
    }

    setFilteredCompanies(filtered);
  };

  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleExportCSV = () => {
    exportToCSV(filteredCompanies, 'placement_drives', [
      { key: 'name', header: 'Company' },
      { key: 'roleOffered', header: 'Role Offered' },
      { key: 'minCgpa', header: 'Min CPI' },
      { key: 'allowedBranches', header: 'Allowed Branches' },
      { key: 'deadline', header: 'Deadline' },
      { key: '_count.applications', header: 'Applications' },
    ]);
  };

  // Calculate statistics
  const stats = {
    total: companies.length,
    open: companies.filter((c) => !isDeadlinePassed(c.deadline)).length,
    closed: companies.filter((c) => isDeadlinePassed(c.deadline)).length,
    totalApplications: companies.reduce((sum, c) => sum + c._count.applications, 0),
  };

  if (!user) return <PageLoading />;

  const columns = [
    {
      key: 'name',
      header: 'Company',
      render: (company: Company) => <span className="font-medium">{company.name}</span>,
    },
    { key: 'roleOffered', header: 'Role' },
    {
      key: 'minCgpa',
      header: 'Min CPI',
      render: (company: Company) => company.minCgpa?.toFixed(1) || '—',
    },
    {
      key: 'branches',
      header: 'Branches',
      render: (company: Company) =>
        company.allowedBranches.length > 0 ? company.allowedBranches.join(', ') : 'All',
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (company: Company) => formatDate(company.deadline),
    },
    {
      key: 'applications',
      header: 'Apps',
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
      <PageContainer>
        <PageTitle
          description="Manage all placement drives and company registrations"
          action={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<Download className="w-4 h-4" />}
                disabled={filteredCompanies.length === 0}
              >
                Export CSV
              </Button>
              <LinkButton href="/admin/create-company" leftIcon={<Plus className="w-4 h-4" />}>
                Create Drive
              </LinkButton>
            </div>
          }
        >
          Placement Drives
        </PageTitle>

        {/* Statistics Cards */}
        {!loading && companies.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Drives"
              value={stats.total}
              icon={<Building2 className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Active"
              value={stats.open}
              icon={<TrendingUp className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Closed"
              value={stats.closed}
              icon={<Clock className="w-5 h-5" />}
              color="gray"
            />
            <StatCard
              title="Applications"
              value={stats.totalApplications}
              icon={<Users className="w-5 h-5" />}
              color="purple"
            />
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by company name or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <FilterTabs
              options={[
                { value: 'all', label: 'All' },
                { value: 'open', label: 'Open' },
                { value: 'closed', label: 'Closed' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </Card>

        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading drives...</p>
          </Card>
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            type={companies.length === 0 ? 'no-companies' : 'no-results'}
            title={companies.length === 0 ? 'No placement drives yet' : 'No drives match your filters'}
            description={companies.length === 0 ? 'Create your first placement drive to get started' : 'Try adjusting your search or filter criteria'}
            action={
              companies.length === 0
                ? { label: 'Create your first drive', href: '/admin/create-company' }
                : undefined
            }
          />
        ) : (
          <DataTable columns={columns} data={filteredCompanies} keyExtractor={(c) => c.id} />
        )}
      </PageContainer>
      <AppFooter />
      </div>
    </div>
  );
}
