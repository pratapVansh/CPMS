'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { Download, FileText, Users, Building2, TrendingUp, BarChart3 } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  StatCard,
  Button,
  SectionTitle,
  DataTable,
  StatusBadge,
  PageLoading,
} from '@/components/common';

interface PlacementStats {
  totalStudents: number;
  totalCompanies: number;
  totalApplications: number;
  totalPlacedStudents: number;
  totalUnplacedStudents: number;
  placementRate: number;
  byStatus: {
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
  byBranch: Array<{
    branch: string;
    total: number;
    placed: number;
    rate: number;
  }>;
  topCompanies: Array<{
    name: string;
    applications: number;
    selected: number;
  }>;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from the new reports API endpoint
      const response = await apiGet<PlacementStats>('/admin/reports');
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError('Failed to load report data');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBranchReport = () => {
    if (!stats) return;
    exportToCSV(stats.byBranch, 'branch_wise_placement', [
      { key: 'branch', header: 'Branch' },
      { key: 'total', header: 'Total Students' },
      { key: 'placed', header: 'Students Placed' },
      { key: 'rate', header: 'Placement Rate (%)' },
    ]);
  };

  const handleExportCompanyReport = () => {
    if (!stats) return;
    exportToCSV(stats.topCompanies, 'company_wise_report', [
      { key: 'name', header: 'Company' },
      { key: 'applications', header: 'Applications' },
      { key: 'selected', header: 'Selected' },
    ]);
  };

  if (!user) return <PageLoading />;

  const branchColumns = [
    { key: 'branch', header: 'Branch', render: (row: PlacementStats['byBranch'][0]) => <span className="font-medium">{row.branch}</span> },
    { key: 'total', header: 'Total Students', className: 'text-center' },
    { key: 'placed', header: 'Placed', className: 'text-center' },
    { key: 'rate', header: 'Rate', className: 'text-center', render: (row: PlacementStats['byBranch'][0]) => `${row.rate.toFixed(1)}%` },
  ];

  const companyColumns = [
    { key: 'name', header: 'Company', render: (row: PlacementStats['topCompanies'][0]) => <span className="font-medium">{row.name}</span> },
    { key: 'applications', header: 'Applications', className: 'text-center' },
    { key: 'selected', header: 'Selected', className: 'text-center' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
        <PageContainer>
          <PageTitle 
            description="Placement statistics and reports"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportBranchReport}
                leftIcon={<Download className="w-4 h-4" />}
                disabled={!stats}
              >
                Export Report
              </Button>
            }
          >
            Reports
          </PageTitle>

          {loading ? (
            <Card>
              <p className="text-center text-gray-500 py-4">Loading reports...</p>
            </Card>
          ) : error ? (
            <Card>
              <div className="text-center py-4">
                <p className="text-red-600 mb-2">{error}</p>
                <Button onClick={fetchStats} size="sm">
                  Retry
                </Button>
              </div>
            </Card>
          ) : stats ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Students"
                  value={stats.totalStudents}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="Students Placed"
                  value={stats.totalPlacedStudents}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Companies"
                  value={stats.totalCompanies}
                  icon={<Building2 className="w-5 h-5" />}
                  color="purple"
                />
                <StatCard
                  title="Applications"
                  value={stats.totalApplications}
                  icon={<FileText className="w-5 h-5" />}
                  color="gray"
                />
              </div>

              {/* Secondary Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                  title="Unplaced Students"
                  value={stats.totalUnplacedStudents}
                  icon={<Users className="w-5 h-5" />}
                  color="orange"
                />
                <StatCard
                  title="Total Selected"
                  value={stats.byStatus.selected}
                  icon={<BarChart3 className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Placement Rate"
                  value={`${stats.placementRate.toFixed(1)}%`}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="green"
                />
              </div>

              {/* Application Status Breakdown */}
              <div className="mb-6">
                <SectionTitle>Application Status Breakdown</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Applied</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.byStatus.applied}</p>
                      </div>
                      <StatusBadge status="applied" />
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Shortlisted</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.shortlisted}</p>
                      </div>
                      <StatusBadge status="shortlisted" />
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Selected</p>
                        <p className="text-2xl font-bold text-green-600">{stats.byStatus.selected}</p>
                      </div>
                      <StatusBadge status="selected" />
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">{stats.byStatus.rejected}</p>
                      </div>
                      <StatusBadge status="rejected" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Branch-wise Report */}
              {stats.byBranch.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <SectionTitle>Branch-wise Placement</SectionTitle>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportBranchReport}
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Export CSV
                    </Button>
                  </div>
                  <DataTable
                    columns={branchColumns}
                    data={stats.byBranch}
                    keyExtractor={(row) => row.branch}
                  />
                </div>
              )}

              {/* Top Companies */}
              {stats.topCompanies.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <SectionTitle>Top Companies by Applications</SectionTitle>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportCompanyReport}
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Export CSV
                    </Button>
                  </div>
                  <DataTable
                    columns={companyColumns}
                    data={stats.topCompanies}
                    keyExtractor={(row) => row.name}
                  />
                </div>
              )}
            </>
          ) : (
            <Card>
              <p className="text-center text-gray-500 py-4">No data available</p>
            </Card>
          )}
        </PageContainer>

        <AppFooter />
      </div>
    </div>
  );
}
