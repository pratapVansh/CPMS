'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { Clock, Activity } from 'lucide-react';
import {
  InstitutionalNavbar,
  AppFooter,
  PageContainer,
  PageTitle,
  Card,
  DataTable,
  EmptyState,
  PageLoading,
  SectionTitle,
} from '@/components/common';

interface AuditLog {
  id: string;
  action: string;
  target: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadAuditLogs();
  }, [router]);

  async function loadAuditLogs() {
    try {
      console.log('Loading audit logs...');
      const response = await apiGet<{ logs: AuditLog[] }>('/superadmin/audit-logs?limit=100');
      console.log('Audit logs response:', response);
      if (response.success && response.data) {
        console.log('Audit logs data:', response.data.logs);
        setAuditLogs(response.data.logs);
      } else {
        console.error('Failed response:', response);
      }
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <InstitutionalNavbar user={user!} role="superadmin" />
      <div className="pt-28 md:pt-16 flex-1 flex flex-col">
      <PageContainer>
        <div className="mb-6">
          <PageTitle description="Track all system activities and changes">
            Audit Logs
          </PageTitle>
        </div>

        <Card>
          <div className="mb-6">
            <SectionTitle>Recent Activity</SectionTitle>
          </div>

          {auditLogs.length === 0 ? (
            <EmptyState
              type="no-data"
              title="No audit logs yet"
              description="System activities will appear here"
            />
          ) : (
            <DataTable
              columns={[
                { 
                  key: 'user', 
                  header: 'User',
                  render: (log: AuditLog) => (
                    <div>
                      <div className="font-medium">{log.user.name}</div>
                      <div className="text-xs text-gray-500">{log.user.email}</div>
                    </div>
                  )
                },
                { 
                  key: 'action', 
                  header: 'Action',
                  render: (log: AuditLog) => (
                    <span className="font-medium text-blue-600">{log.action}</span>
                  )
                },
                { 
                  key: 'target', 
                  header: 'Target',
                  render: (log: AuditLog) => log.target || '-'
                },
                { 
                  key: 'createdAt', 
                  header: 'Date & Time',
                  render: (log: AuditLog) => (
                    <div>
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  )
                },
              ]}
              data={auditLogs}
              keyExtractor={(log) => log.id}
            />
          )}
        </Card>
      </PageContainer>
      <AppFooter />
      </div>
    </div>
  );
}
