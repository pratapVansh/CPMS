'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPut } from '@/lib/api';
import { 
  ArrowLeft, 
  Building2, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  GraduationCap,
  FileText,
  Clock,
  Globe,
  CheckCircle,
  Star,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
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
  Button,
  Select,
  Grid,
  StatCard,
} from '@/components/common';

interface Application {
  id: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    cgpa: number | null;
    branch: string | null;
  };
}

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  roleOffered: string;
  jobDescription: string | null;
  ctc: string | null;
  location: string | null;
  jobType: string | null;
  minCgpa: number | null;
  maxBacklogs: number | null;
  allowedBranches: string[];
  allowedYears: number[];
  driveDate: string | null;
  deadline: string;
  selectionRounds: string | null;
  requiredDocuments: string | null;
  specialInstructions: string | null;
  status: string;
  applications: Application[];
  _count: {
    applications: number;
  };
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchCompany();
  }, [router, companyId]);

  const fetchCompany = async () => {
    const response = await apiGet<{ company: Company }>(`/admin/companies/${companyId}`);
    if (response.success && response.data) {
      setCompany(response.data.company);
    }
    setLoading(false);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdating(applicationId);
    const response = await apiPut(`/admin/applications/${applicationId}/status`, {
      status: newStatus,
    });
    if (response.success) {
      fetchCompany();
    }
    setUpdating(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter applications based on search and status
  const filteredApplications = company?.applications?.filter((app) => {
    if (!app.user) return false;
    
    const matchesSearch = 
      app.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user.branch?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (!user) return <PageLoading />;

  const columns = [
    {
      key: 'name',
      header: 'Student Name',
      render: (app: Application) => (
        <Link href={`/admin/students/${app.user.id}`} className="font-medium text-blue-600 hover:underline">
          {app.user.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Email', render: (app: Application) => app.user.email },
    {
      key: 'branch',
      header: 'Branch',
      render: (app: Application) => app.user.branch || '—',
    },
    {
      key: 'cgpa',
      header: 'CPI',
      render: (app: Application) => app.user.cgpa?.toFixed(2) || '—',
    },
    {
      key: 'appliedOn',
      header: 'Applied On',
      render: (app: Application) => formatDate(app.createdAt),
    },
    {
      key: 'currentStatus',
      header: 'Current Status',
      render: (app: Application) => {
        const statusColors = {
          APPLIED: 'bg-gray-100 text-gray-800',
          SHORTLISTED: 'bg-yellow-100 text-yellow-800',
          SELECTED: 'bg-green-100 text-green-800',
          REJECTED: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[app.status]}`}>
            {app.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Update Status',
      render: (app: Application) => (
        <select
          value={app.status}
          onChange={(e) => handleStatusChange(app.id, e.target.value)}
          disabled={updating === app.id}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="APPLIED">Applied</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="SELECTED">Selected</option>
          <option value="REJECTED">Rejected</option>
        </select>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-16 md:pt-16">
      <PageContainer>
        <div className="mb-6">
          <Link
            href="/admin/drives"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Drives
          </Link>
        </div>

        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading drive details...</p>
          </Card>
        ) : !company ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Company not found</h3>
              <p className="text-gray-600 mb-4">An error occurred while loading the data. Please try again.</p>
              <Link href="/admin/drives">
                <Button variant="primary">Back to Drives</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Company Header */}
            <Card className="mb-6">
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="w-16 h-16 object-contain rounded" />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                      {company.industry && (
                        <p className="text-sm text-gray-500 mt-1">{company.industry}</p>
                      )}
                    </div>
                    <StatusBadge 
                      status={new Date(company.deadline) < new Date() ? 'closed' : company.status || 'open'} 
                    />
                  </div>
                  {company.website && (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
              
              {company.description && (
                <p className="text-gray-700 mt-4 pt-4 border-t">{company.description}</p>
              )}
            </Card>

            {/* Job Details */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-600" />
                Job Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Role/Position</p>
                  <p className="text-base text-gray-900 mt-1">{company.roleOffered}</p>
                </div>

                {company.jobDescription && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{company.jobDescription}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  {company.ctc && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        CTC Package
                      </p>
                      <p className="font-medium text-gray-900 mt-1">{company.ctc}</p>
                    </div>
                  )}
                  {company.location && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location
                      </p>
                      <p className="font-medium text-gray-900 mt-1">{company.location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Job Type
                    </p>
                    <p className="font-medium text-gray-900 mt-1">{company.jobType || 'Full-time'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Eligibility Criteria */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                Eligibility Criteria
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Minimum CPI</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {company.minCgpa?.toFixed(1) || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Backlogs</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {company.maxBacklogs !== null && company.maxBacklogs !== undefined ? company.maxBacklogs : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Eligible Branches</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {company.allowedBranches.length > 0 
                      ? `${company.allowedBranches.length} branches` 
                      : 'All branches'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Eligible Years</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {company.allowedYears.length > 0 
                      ? company.allowedYears.join(', ') 
                      : 'All years'}
                  </p>
                </div>
              </div>

              {company.allowedBranches.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Allowed Branches:</p>
                  <div className="flex flex-wrap gap-2">
                    {company.allowedBranches.map((branch) => (
                      <span 
                        key={branch} 
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Drive Schedule */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Drive Schedule
              </h2>
              
              <div className="grid grid-cols-2 gap-6 mb-4">
                {company.driveDate && (
                  <div>
                    <p className="text-sm text-gray-500">Drive Date</p>
                    <p className="text-base font-medium text-gray-900 mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(company.driveDate)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Application Deadline</p>
                  <p className="text-base font-medium text-gray-900 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDate(company.deadline)}
                  </p>
                </div>
              </div>

              {company.selectionRounds && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selection Process</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{company.selectionRounds}</p>
                </div>
              )}
            </Card>

            {/* Additional Information */}
            {(company.requiredDocuments || company.specialInstructions) && (
              <Card className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Additional Information
                </h2>
                
                {company.requiredDocuments && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Required Documents</p>
                    <p className="text-sm text-gray-600 mt-1">{company.requiredDocuments}</p>
                  </div>
                )}

                {company.specialInstructions && (
                  <div className={company.requiredDocuments ? 'pt-4 border-t' : ''}>
                    <p className="text-sm font-medium text-gray-700">Special Instructions</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{company.specialInstructions}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Applications */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Applicant Management
                </h2>
              </div>

              {/* Application Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-600 font-medium">Total</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{company._count.applications}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs text-yellow-600 font-medium">Shortlisted</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {company.applications.filter((a) => a.status === 'SHORTLISTED').length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">Selected</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {company.applications.filter((a) => a.status === 'SELECTED').length}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <p className="text-xs text-red-600 font-medium">Rejected</p>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {company.applications.filter((a) => a.status === 'REJECTED').length}
                  </p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 pb-4 border-b">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or branch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="APPLIED">Applied</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Results Info */}
              <p className="text-sm text-gray-600 mb-4">
                Showing {filteredApplications.length} of {company.applications.length} applicants
                {statusFilter !== 'all' && ` (filtered by ${statusFilter})`}
              </p>

              {company.applications.length === 0 ? (
                <EmptyState 
                  type="info" 
                  title="No applications yet" 
                  description="Students will appear here once they apply for this drive"
                />
              ) : filteredApplications.length === 0 ? (
                <EmptyState 
                  type="info" 
                  title="No results found" 
                  description="Try adjusting your search or filter criteria"
                />
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredApplications}
                  keyExtractor={(app) => app.id}
                />
              )}
            </Card>
          </>
        )}
      </PageContainer>

      <AppFooter />
      </div>
    </div>
  );
}
