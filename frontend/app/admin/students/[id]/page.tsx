'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/auth';
import { apiGet, apiPatch } from '@/lib/api';
import { ArrowLeft, Eye, FileText } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  Card,
  DataTable,
  StatusBadge,
  EmptyState,
  PageLoading,
  Button,
  Grid,
} from '@/components/common';

interface Application {
  id: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED';
  createdAt: string;
  company: {
    id: string;
    name: string;
    roleOffered: string;
  };
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  rollNo: string | null;
  cgpa: number | null;
  branch: string | null;
  currentYear: number | null;
  currentSemester: number | null;
  status: 'ACTIVE' | 'DISABLED';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  hasResume: boolean;
  hasMarksheet: boolean;
  resumeUrl: string | null;
  marksheetUrl: string | null;
  applications: Application[];
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchStudent();
  }, [router, studentId]);

  const fetchStudent = async () => {
    const response = await apiGet<{ student: StudentProfile }>(`/admin/students/${studentId}`);
    if (response.success && response.data) {
      setStudent(response.data.student);
    }
    setLoading(false);
  };

  const handleToggleStatus = async () => {
    if (!student) return;

    const newStatus = student.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const response = await apiPatch(`/admin/students/${studentId}/status`, { status: newStatus });

    if (response.success) {
      fetchStudent();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const viewDocument = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleVerify = async () => {
    if (!student) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    const response = await apiPatch(`/admin/students/${studentId}/verify`, {});
    
    if (response.success) {
      setSuccess('Student verified successfully!');
      fetchStudent();
    } else {
      setError(response.error?.message || 'Failed to verify student');
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!student) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    const response = await apiPatch(`/admin/students/${studentId}/reject`, {
      reason: rejectionReason || 'Documents rejected',
    });
    
    if (response.success) {
      setSuccess('Student verification rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchStudent();
    } else {
      setError(response.error?.message || 'Failed to reject verification');
    }
    setProcessing(false);
  };

  if (!user) return <PageLoading />;

  const applicationColumns = [
    {
      key: 'company',
      header: 'Company',
      render: (app: Application) => (
        <Link href={`/admin/company/${app.company.id}`} className="font-medium text-blue-600 hover:underline">
          {app.company.name}
        </Link>
      ),
    },
    { key: 'role', header: 'Role', render: (app: Application) => app.company.roleOffered },
    {
      key: 'appliedOn',
      header: 'Applied On',
      render: (app: Application) => formatDate(app.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: Application) => <StatusBadge status={app.status.toLowerCase()} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InstitutionalNavbar user={user} role="admin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
      <PageContainer>
        <div className="mb-6">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </Link>
        </div>

        {loading ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Loading student details...</p>
          </Card>
        ) : !student ? (
          <EmptyState type="error" title="Student not found" />
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded text-sm">
                {success}
              </div>
            )}

            {/* Student Info */}
            <Card className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
                  {student.rollNo && (
                    <p className="text-sm font-semibold text-blue-600">{student.rollNo}</p>
                  )}
                  <p className="text-gray-600">{student.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={student.status?.toLowerCase() || 'active'} />
                  <Button
                    variant={student.status === 'ACTIVE' ? 'danger' : 'success'}
                    size="sm"
                    onClick={handleToggleStatus}
                  >
                    {student.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="font-medium">{student.branch || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CPI / CGPA</p>
                  <p className="font-medium">{student.cgpa?.toFixed(2) || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registered On</p>
                  <p className="font-medium">{formatDate(student.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Applications</p>
                  <p className="font-medium">{student.applications.length}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Verification Status</p>
                    <div className="flex items-center gap-2">
                      {student.verificationStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          ✓ Verified
                        </span>
                      )}
                      {student.verificationStatus === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          ⏳ Pending
                        </span>
                      )}
                      {student.verificationStatus === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          ✗ Rejected
                        </span>
                      )}
                      {student.verifiedAt && (
                        <span className="text-xs text-gray-500">
                          on {formatDate(student.verifiedAt)}
                        </span>
                      )}
                    </div>
                    {student.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Reason: {student.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {student.verificationStatus !== 'VERIFIED' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleVerify}
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : '✓ Verify'}
                      </Button>
                    )}
                    {student.verificationStatus !== 'REJECTED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowRejectModal(true)}
                        disabled={processing}
                      >
                        ✗ Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Reject Modal */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="max-w-md w-full mx-4">
                  <h3 className="text-lg font-bold mb-4">Reject Verification</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please provide a reason for rejecting this student's verification:
                  </p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    rows={3}
                    placeholder="e.g., Invalid documents, CPI mismatch, etc."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectionReason('');
                      }}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleReject}
                      disabled={processing}
                    >
                      {processing ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Documents */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
            <Grid cols={2} className="mb-6">
              <Card>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Resume</p>
                      <p className="text-sm text-gray-500">
                        {student.hasResume ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                  {student.hasResume && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => viewDocument(student.resumeUrl)}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Marksheet</p>
                      <p className="text-sm text-gray-500">
                        {student.hasMarksheet ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                  {student.hasMarksheet && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => viewDocument(student.marksheetUrl)}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Grid>

            {/* Applications */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications</h2>
            {student.applications.length === 0 ? (
              <EmptyState
                type="no-applications"
                description="This student hasn't applied to any drives yet."
              />
            ) : (
              <DataTable
                columns={applicationColumns}
                data={student.applications}
                keyExtractor={(app) => app.id}
              />
            )}
          </>
        )}
      </PageContainer>
      <AppFooter />
      </div>
    </div>
  );
}
