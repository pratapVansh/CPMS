'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { Calendar, AlertCircle, Briefcase, FileText, Star, Award } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  DataTable,
  LinkButton,
  EmptyState,
  PageLoading,
  SectionTitle,
  StatCard,
} from '@/components/common';

interface Company {
  id: string;
  name: string;
  roleOffered: string;
  minCgpa: number;
  allowedBranches: string[];
  deadline: string;
}

interface ApplicationStats {
  total: number;
  applied: number;
  shortlisted: number;
  selected: number;
  rejected: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    shortlisted: 0,
    selected: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const [eligibleRes, applicationsRes] = await Promise.all([
      apiGet<{ companies: Company[]; count: number }>('/student/companies/eligible'),
      apiGet<{ applications: Array<{ status: string }> }>('/student/applications'),
    ]);

    if (eligibleRes.success && eligibleRes.data) {
      setCompanies(eligibleRes.data.companies);
    }

    if (applicationsRes.success && applicationsRes.data) {
      const apps = applicationsRes.data.applications;
      setApplicationStats({
        total: apps.length,
        applied: apps.filter((a) => a.status === 'APPLIED').length,
        shortlisted: apps.filter((a) => a.status === 'SHORTLISTED').length,
        selected: apps.filter((a) => a.status === 'SELECTED').length,
        rejected: apps.filter((a) => a.status === 'REJECTED').length,
      });
    }

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    const upcoming = companies
      .filter((c) => new Date(c.deadline) >= now)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
    return upcoming;
  };

  if (!user) return <PageLoading />;

  const upcomingDeadlines = getUpcomingDeadlines();

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
      render: (company: Company) => company.minCgpa || '—',
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (company: Company) => formatDate(company.deadline),
    },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      render: (company: Company) => (
        <LinkButton href={`/student/applications?apply=${company.id}`} size="sm">
          Apply
        </LinkButton>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="student" />
      <div className="pt-16 md:pt-16">
      <PageContainer>
        <PageTitle description="View your placement activities and eligible opportunities">Student Dashboard</PageTitle>

        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading dashboard...</p>
          </Card>
        ) : (
          <>
            {/* Summary Cards - Using StatCard for consistency */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Eligible Drives"
                value={companies.length}
                icon={<Briefcase className="w-5 h-5" />}
                color="blue"
                subtitle="Open for applications"
              />
              <StatCard
                title="Applied"
                value={applicationStats.total}
                icon={<FileText className="w-5 h-5" />}
                color="gray"
                subtitle="Total applications"
              />
              <StatCard
                title="Shortlisted"
                value={applicationStats.shortlisted}
                icon={<Star className="w-5 h-5" />}
                color="yellow"
                subtitle="Selected for next round"
              />
              <StatCard
                title="Offers"
                value={applicationStats.selected}
                icon={<Award className="w-5 h-5" />}
                color="green"
                subtitle="Placement offers received"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Upcoming Deadlines */}
              <div className="lg:col-span-1">
                <SectionTitle>Upcoming Deadlines</SectionTitle>
                <Card>
                  {upcomingDeadlines.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingDeadlines.map((company) => (
                        <div key={company.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{company.name}</p>
                            <p className="text-xs text-gray-500">{company.roleOffered}</p>
                            <p className="text-xs text-blue-600 mt-1">{formatDate(company.deadline)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Application Status Summary */}
              <div className="lg:col-span-1">
                <SectionTitle>Application Status</SectionTitle>
                <Card>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Under Review</span>
                      <span className="text-sm font-medium text-gray-900">{applicationStats.applied}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Shortlisted</span>
                      <span className="text-sm font-medium text-yellow-600">{applicationStats.shortlisted}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Selected</span>
                      <span className="text-sm font-medium text-green-600">{applicationStats.selected}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Not Selected</span>
                      <span className="text-sm font-medium text-red-600">{applicationStats.rejected}</span>
                    </div>
                  </div>
                  <Link href="/student/applications" className="block text-center text-sm text-blue-600 hover:underline mt-4 pt-3 border-t border-gray-100">
                    View all applications →
                  </Link>
                </Card>
              </div>

              {/* Important Notices */}
              <div className="lg:col-span-1">
                <SectionTitle>Important Notices</SectionTitle>
                <Card>
                  <div className="flex items-start gap-3 text-sm">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700">Keep your profile updated with latest CPI and documents for better matching.</p>
                      <Link href="/student/profile" className="text-blue-600 hover:underline text-xs mt-2 inline-block">
                        Update Profile →
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Contact: placement@rgipt.ac.in
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Eligible Placement Drives */}
            <SectionTitle>Eligible Placement Drives</SectionTitle>
            {companies.length === 0 ? (
              <EmptyState
                type="no-companies"
                description="No eligible drives available at the moment. Please check back later."
              />
            ) : (
              <>
                <DataTable
                  columns={columns}
                  data={companies.slice(0, 5)}
                  keyExtractor={(company) => company.id}
                />
                {companies.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/student/applications" className="text-blue-600 hover:underline text-sm">
                      View all {companies.length} eligible drives →
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </PageContainer>

      <AppFooter />
      </div>
    </div>
  );
}
