'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Briefcase,
  Settings,
  HelpCircle,
  LogOut,
  UserCircle,
  Shield,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import { Navbar, Sidebar, type SidebarSection } from '@/components/ui';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
}

// Navigation configurations for different roles
const studentNavigation: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      { label: 'My Applications', href: '/student/applications', icon: ClipboardList },
      { label: 'Job Openings', href: '/student/jobs', icon: Briefcase },
      { label: 'Profile', href: '/student/profile', icon: UserCircle },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Companies', href: '/student/companies', icon: Building2 },
      { label: 'Settings', href: '/student/settings', icon: Settings },
      { label: 'Help', href: '/help', icon: HelpCircle },
    ],
  },
];

const adminNavigation: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Companies', href: '/admin/companies', icon: Building2 },
      { label: 'Students', href: '/admin/students', icon: GraduationCap },
      { label: 'Job Postings', href: '/admin/jobs', icon: Briefcase },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Applications', href: '/admin/applications', icon: ClipboardList },
      { label: 'Reports', href: '/admin/reports', icon: FileText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

const superAdminNavigation: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
      { label: 'Admins', href: '/superadmin/admins', icon: Shield },
      { label: 'Companies', href: '/superadmin/companies', icon: Building2 },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'All Students', href: '/superadmin/students', icon: GraduationCap },
      { label: 'Analytics', href: '/superadmin/analytics', icon: FileText },
      { label: 'System Settings', href: '/superadmin/settings', icon: Settings },
    ],
  },
];

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  };

  // Get navigation based on role
  const getNavigation = () => {
    switch (role) {
      case 'STUDENT':
        return studentNavigation;
      case 'ADMIN':
        return adminNavigation;
      case 'SUPER_ADMIN':
        return superAdminNavigation;
      default:
        return studentNavigation;
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Sidebar */}
      <Sidebar
        sections={getNavigation()}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        footer={
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
              'text-danger-600 dark:text-danger-400',
              'hover:bg-danger-50 dark:hover:bg-danger-900/20',
              'transition-colors duration-200'
            )}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Sign out</span>}
          </button>
        }
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'
        )}
      >
        {/* Navbar */}
        <Navbar
          user={user ? {
            name: user.name || 'User',
            email: user.email || '',
            role: role,
          } : undefined}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
          notifications={3}
        />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
