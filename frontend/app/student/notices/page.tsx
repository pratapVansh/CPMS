'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { FileText, Calendar, Download, Bell, AlertCircle } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  EmptyState,
  PageLoading,
  StatusBadge,
  SectionTitle,
  FilterTabs,
} from '@/components/common';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'GENERAL' | 'URGENT' | 'PLACEMENT' | 'DEADLINE';
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  expiresAt?: string;
}

// Mock data for demonstration - replace with API calls
const mockNotices: Notice[] = [
  {
    id: '1',
    title: 'Campus Placement Season 2026 Guidelines',
    content: 'All students are requested to update their profiles with latest CPI and documents before the placement season begins. Ensure your resume is up to date.',
    type: 'GENERAL',
    attachmentUrl: '#',
    attachmentName: 'Placement_Guidelines_2026.pdf',
    createdAt: '2026-01-28T10:00:00Z',
  },
  {
    id: '2',
    title: 'TCS NQT Registration Deadline Extended',
    content: 'The deadline for TCS NQT registration has been extended to February 5, 2026. All eligible students are encouraged to register.',
    type: 'DEADLINE',
    createdAt: '2026-01-25T14:30:00Z',
    expiresAt: '2026-02-05T23:59:59Z',
  },
  {
    id: '3',
    title: 'Pre-Placement Talk: Microsoft',
    content: 'Microsoft will conduct a Pre-Placement Talk on February 10, 2026 at 3:00 PM in the Seminar Hall. Attendance is mandatory for interested candidates.',
    type: 'PLACEMENT',
    createdAt: '2026-01-20T09:00:00Z',
  },
  {
    id: '4',
    title: 'Document Verification Camp',
    content: 'A document verification camp will be organized on February 3, 2026. Students with pending document verification must attend.',
    type: 'URGENT',
    createdAt: '2026-01-29T11:00:00Z',
  },
];

// Upcoming deadlines from companies (mock data)
const upcomingDeadlines = [
  { company: 'Google', role: 'Software Engineer', deadline: '2026-02-10' },
  { company: 'Microsoft', role: 'SDE Intern', deadline: '2026-02-15' },
  { company: 'Amazon', role: 'SDE-1', deadline: '2026-02-20' },
  { company: 'Infosys', role: 'Systems Engineer', deadline: '2026-02-25' },
];

export default function StudentNoticesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    // In production, fetch from API
    setNotices(mockNotices);
    setLoading(false);
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'PLACEMENT', label: 'Placement' },
    { value: 'DEADLINE', label: 'Deadline' },
    { value: 'GENERAL', label: 'General' },
  ];

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(n => n.type === filter);

  if (!user) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-100">
      <InstitutionalNavbar user={user} role="student" />
      <div className="pt-16 md:pt-16">
        <PageContainer>
          <PageTitle description="Important announcements and placement updates">
            Notice Board
          </PageTitle>

          {loading ? (
            <Card>
              <p className="text-center text-gray-500 py-4">Loading notices...</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Notices */}
              <div className="lg:col-span-2">
                {/* Filter Tabs */}
                <div className="mb-4">
                  <FilterTabs
                    options={filterOptions}
                    value={filter}
                    onChange={setFilter}
                  />
                </div>

                {/* Notices List */}
                {filteredNotices.length === 0 ? (
                  <EmptyState
                    type="no-data"
                    title="No notices found"
                    description="There are no notices matching your filter."
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredNotices.map((notice) => (
                      <Card key={notice.id}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <StatusBadge status={notice.type.toLowerCase()} />
                              <span className="text-xs text-gray-500">
                                {formatDate(notice.createdAt)}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">
                              {notice.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {notice.content}
                            </p>
                            {notice.expiresAt && (
                              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Deadline: {formatDate(notice.expiresAt)}
                              </p>
                            )}
                          </div>
                          {notice.attachmentUrl && (
                            <a
                              href={notice.attachmentUrl}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Placement Calendar */}
                <div>
                  <SectionTitle>Upcoming Deadlines</SectionTitle>
                  <Card>
                    {upcomingDeadlines.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingDeadlines.map((item, index) => (
                          <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{item.company}</p>
                              <p className="text-xs text-gray-500">{item.role}</p>
                              <p className="text-xs text-blue-600 mt-0.5">{formatDate(item.deadline)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Quick Links */}
                <div>
                  <SectionTitle>Quick Links</SectionTitle>
                  <Card>
                    <div className="space-y-2">
                      <a href="/student/profile" className="flex items-center gap-2 text-sm text-blue-600 hover:underline py-2">
                        <FileText className="w-4 h-4" />
                        Update Profile
                      </a>
                      <a href="/student/applications" className="flex items-center gap-2 text-sm text-blue-600 hover:underline py-2">
                        <Bell className="w-4 h-4" />
                        View Applications
                      </a>
                      <a href="/student/dashboard" className="flex items-center gap-2 text-sm text-blue-600 hover:underline py-2">
                        <Calendar className="w-4 h-4" />
                        Eligible Drives
                      </a>
                    </div>
                  </Card>
                </div>

                {/* Contact */}
                <Card>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Contact Placement Cell</h3>
                  <p className="text-xs text-gray-600 mb-1">Email: placement@rgipt.ac.in</p>
                  <p className="text-xs text-gray-600">Phone: +91-XXXXXXXXXX</p>
                </Card>
              </div>
            </div>
          )}
        </PageContainer>

        <AppFooter />
      </div>
    </div>
  );
}
