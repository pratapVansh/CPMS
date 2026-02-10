'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { Calendar, AlertCircle, Briefcase, FileText, Star, Award, X, MapPin, DollarSign, Clock, Users, Building2, ExternalLink } from 'lucide-react';
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
  logoUrl?: string;
  industry?: string;
  website?: string;
  description?: string;
  roleOffered: string;
  jobDescription?: string;
  ctc?: string;
  location?: string;
  jobType?: string;
  minCgpa: number;
  maxBacklogs?: number;
  allowedBranches: string[];
  allowedYears?: number[];
  driveDate?: string;
  deadline: string;
  selectionRounds?: string;
  requiredDocuments?: string;
  specialInstructions?: string;
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
  const [appliedCompanyIds, setAppliedCompanyIds] = useState<Set<string>>(new Set());
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
      apiGet<{ applications: Array<{ status: string; company: { id: string } }> }>('/student/applications/my?limit=1000'),
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
      // Track which companies the student has applied to
      const appliedIds = new Set(apps.map((a) => a.company.id));
      setAppliedCompanyIds(appliedIds);
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
      render: (company: Company) => (
        <div>
          <span className="font-medium">{company.name}</span>
          {company.location && <span className="block text-xs text-gray-500">{company.location}</span>}
        </div>
      ),
    },
    { 
      key: 'roleOffered', 
      header: 'Role',
      render: (company: Company) => (
        <div>
          <span>{company.roleOffered}</span>
          {company.ctc && <span className="block text-xs text-gray-500">{company.ctc}</span>}
        </div>
      ),
    },
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
      key: 'details',
      header: '',
      className: 'text-right',
      render: (company: Company) => (
        <button
          onClick={() => setSelectedCompany(company)}
          className="text-sm text-blue-600 hover:underline"
        >
          View Details
        </button>
      ),
    },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      render: (company: Company) => (
        appliedCompanyIds.has(company.id) ? (
          <span className="text-sm text-gray-500 font-medium">Applied</span>
        ) : (
          <LinkButton href={`/student/applications?apply=${company.id}`} size="sm">
            Apply
          </LinkButton>
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="student" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
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

      {/* Drive Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCompany.name}</h2>
                <p className="text-lg text-gray-600 mt-1">{selectedCompany.roleOffered}</p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedCompany.ctc && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">CTC</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedCompany.ctc}</p>
                    </div>
                  </div>
                )}
                {selectedCompany.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedCompany.location}</p>
                    </div>
                  </div>
                )}
                {selectedCompany.jobType && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Job Type</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedCompany.jobType}</p>
                    </div>
                  </div>
                )}
                {selectedCompany.industry && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Industry</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedCompany.industry}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Description */}
              {selectedCompany.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">About Company</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedCompany.description}</p>
                  {selectedCompany.website && (
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      Visit Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Job Description */}
              {selectedCompany.jobDescription && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedCompany.jobDescription}</p>
                </div>
              )}

              {/* Eligibility Criteria */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Eligibility Criteria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Minimum CGPA</p>
                    <p className="text-base font-semibold text-gray-900">{selectedCompany.minCgpa || 'Not specified'}</p>
                  </div>
                  {selectedCompany.maxBacklogs !== null && selectedCompany.maxBacklogs !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Maximum Backlogs</p>
                      <p className="text-base font-semibold text-gray-900">{selectedCompany.maxBacklogs}</p>
                    </div>
                  )}
                  {selectedCompany.allowedBranches && selectedCompany.allowedBranches.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                      <p className="text-xs text-gray-500 mb-2">Eligible Branches</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompany.allowedBranches.map((branch) => (
                          <span key={branch} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {branch}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCompany.allowedYears && selectedCompany.allowedYears.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                      <p className="text-xs text-gray-500 mb-2">Eligible Years</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompany.allowedYears.map((year) => (
                          <span key={year} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Year {year}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Process */}
              {selectedCompany.selectionRounds && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Selection Process</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedCompany.selectionRounds}</p>
                </div>
              )}

              {/* Important Dates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Important Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Application Deadline</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(selectedCompany.deadline)}</p>
                    </div>
                  </div>
                  {selectedCompany.driveDate && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Drive Date</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(selectedCompany.driveDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Required Documents */}
              {selectedCompany.requiredDocuments && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Required Documents</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedCompany.requiredDocuments}</p>
                </div>
              )}

              {/* Special Instructions */}
              {selectedCompany.specialInstructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Special Instructions</h3>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedCompany.specialInstructions}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {!appliedCompanyIds.has(selectedCompany.id) && (
                <Link
                  href={`/student/applications?apply=${selectedCompany.id}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Apply Now
                </Link>
              )}
              {appliedCompanyIds.has(selectedCompany.id) && (
                <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg">
                  Already Applied
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
