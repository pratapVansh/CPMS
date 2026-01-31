'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { Search, ChevronLeft, ChevronRight, Download, FileCheck, FileX, Filter, Users, CheckCircle, Clock, UserCheck } from 'lucide-react';
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
  Input,
  Button,
  Select,
  StatCard,
} from '@/components/common';

const BRANCHES = [
  { value: '', label: 'All Branches' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Petroleum Engineering', label: 'Petroleum Engineering' },
  { value: 'Chemical Engineering', label: 'Chemical Engineering' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering' },
  { value: 'Civil Engineering', label: 'Civil Engineering' },
];

const CPI_FILTERS = [
  { value: '', label: 'Any CPI' },
  { value: '9', label: '≥ 9.0' },
  { value: '8', label: '≥ 8.0' },
  { value: '7', label: '≥ 7.0' },
  { value: '6', label: '≥ 6.0' },
];

const DOC_STATUS = [
  { value: '', label: 'All Documents' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'missing', label: 'Missing' },
];

interface Student {
  id: string;
  name: string;
  email: string;
  cgpa: number | null;
  branch: string | null;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  hasResume?: boolean;
  hasMarksheet?: boolean;
  documentsVerified?: boolean;
  _count?: {
    applications: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function StudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [cpiFilter, setCpiFilter] = useState('');
  const [docFilter, setDocFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchStudents(1);
  }, [router]);

  const fetchStudents = async (page: number, searchQuery = search) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });
    if (searchQuery) params.append('search', searchQuery);
    if (branchFilter) params.append('branch', branchFilter);
    if (cpiFilter) params.append('minCgpa', cpiFilter);

    const response = await apiGet<{ students: Student[]; pagination: PaginationInfo }>(
      `/admin/students?${params}`
    );

    if (response.success && response.data) {
      let filteredStudents = response.data.students;
      
      // Client-side document filter (backend should ideally handle this)
      if (docFilter === 'verified') {
        filteredStudents = filteredStudents.filter(s => s.documentsVerified);
      } else if (docFilter === 'pending') {
        filteredStudents = filteredStudents.filter(s => (s.hasResume || s.hasMarksheet) && !s.documentsVerified);
      } else if (docFilter === 'missing') {
        filteredStudents = filteredStudents.filter(s => !s.hasResume && !s.hasMarksheet);
      }
      
      setStudents(filteredStudents);
      setPagination(response.data.pagination);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(1, search);
  };

  const handleExportCSV = () => {
    exportToCSV(students, 'students_list', [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'branch', header: 'Branch' },
      { key: 'cgpa', header: 'CPI' },
      { key: 'status', header: 'Status' },
      { key: 'hasResume', header: 'Resume Uploaded' },
      { key: 'hasMarksheet', header: 'Marksheet Uploaded' },
    ]);
  };

  const getDocStatus = (student: Student) => {
    if (student.documentsVerified) return 'verified';
    if (student.hasResume || student.hasMarksheet) return 'pending';
    return 'missing';
  };

  if (!user) return <PageLoading />;

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (student: Student) => <span className="font-medium">{student.name}</span>,
    },
    { key: 'email', header: 'Email' },
    { key: 'branch', header: 'Branch', render: (s: Student) => s.branch || '—' },
    {
      key: 'cgpa',
      header: 'CPI',
      render: (s: Student) => s.cgpa?.toFixed(2) || '—',
    },
    {
      key: 'documents',
      header: 'Documents',
      render: (s: Student) => {
        const status = getDocStatus(s);
        return (
          <div className="flex items-center gap-1">
            {status === 'verified' && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <FileCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {status === 'pending' && (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <FileCheck className="w-3 h-3" /> Pending
              </span>
            )}
            {status === 'missing' && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <FileX className="w-3 h-3" /> Missing
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'applications',
      header: 'Apps',
      className: 'text-center',
      render: (s: Student) => s._count?.applications ?? 0,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Student) => <StatusBadge status={s.status?.toLowerCase() || 'active'} />,
    },
    {
      key: 'action',
      header: '',
      className: 'text-right',
      render: (student: Student) => (
        <Link href={`/admin/students/${student.id}`} className="text-blue-600 hover:underline text-sm">
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
        <PageTitle 
          description="View and manage all registered students"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              disabled={students.length === 0}
            >
              Export CSV
            </Button>
          }
        >
          All Students
        </PageTitle>

        {/* Search & Filters */}
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <Button type="submit">Search</Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
              >
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <Select
                  label="Branch"
                  value={branchFilter}
                  onChange={(e) => { setBranchFilter(e.target.value); fetchStudents(1); }}
                  options={BRANCHES}
                />
                <Select
                  label="Minimum CPI"
                  value={cpiFilter}
                  onChange={(e) => { setCpiFilter(e.target.value); fetchStudents(1); }}
                  options={CPI_FILTERS}
                />
                <Select
                  label="Document Status"
                  value={docFilter}
                  onChange={(e) => { setDocFilter(e.target.value); fetchStudents(1); }}
                  options={DOC_STATUS}
                />
              </div>
            )}
          </form>
        </Card>

        {/* Stats Summary */}
        {!loading && students.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total"
              value={pagination?.total || students.length}
              icon={<Users className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Docs Verified"
              value={students.filter(s => s.documentsVerified).length}
              icon={<CheckCircle className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Docs Pending"
              value={students.filter(s => (s.hasResume || s.hasMarksheet) && !s.documentsVerified).length}
              icon={<Clock className="w-5 h-5" />}
              color="yellow"
            />
            <StatCard
              title="Active"
              value={students.filter(s => s.status === 'ACTIVE').length}
              icon={<UserCheck className="w-5 h-5" />}
              color="green"
            />
          </div>
        )}

        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading students...</p>
          </Card>
        ) : students.length === 0 ? (
          <EmptyState 
            type="no-data" 
            title="No students found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <>
            <DataTable columns={columns} data={students} keyExtractor={(s) => s.id} />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Card padding="sm" className="mt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} students
                  </p>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchStudents(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Previous
                    </Button>
                    <span className="px-3 text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchStudents(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </PageContainer>

      <AppFooter />
      </div>
    </div>
  );
}
