'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, LogOut } from 'lucide-react';
import { logout, User as UserType } from '@/lib/auth';
import { institution, navigation as navConfig } from '@/lib/design-system';

// =============================================================================
// INSTITUTIONAL NAVBAR (Fixed, IIT-style)
// =============================================================================

interface InstitutionalNavbarProps {
  user: UserType | null;
  role: 'student' | 'admin' | 'superadmin';
}

export function InstitutionalNavbar({ user, role }: InstitutionalNavbarProps) {
  const pathname = usePathname();
  const navItems = navConfig[role] || [];

  const handleLogout = () => {
    logout();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return 'Student';
      case 'admin': return 'Admin';
      case 'superadmin': return 'Super Admin';
      default: return role;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Institute Logo & Name */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {institution.name}
                </p>
                <p className="text-xs text-gray-600">
                  {institution.systemFullName}
                </p>
              </div>
              <div className="sm:hidden">
                <p className="text-sm font-bold text-gray-900">{institution.shortName}</p>
                <p className="text-xs text-gray-600">{institution.systemName}</p>
              </div>
            </Link>
          </div>

          {/* Center: Role-based Navigation */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== `/${role}/dashboard` && item.href !== '/superadmin' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 text-sm rounded ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right: User Info & Logout */}
          {user && (
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-200 -mx-4 px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== `/${role}/dashboard` && item.href !== '/superadmin' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs rounded whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}

// =============================================================================
// LEGACY COMPONENTS (for backward compatibility)
// =============================================================================

interface AppHeaderProps {
  user: UserType | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{institution.systemName}</h1>
            <p className="text-xs text-gray-600">{institution.name}</p>
          </div>
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              Welcome, <strong>{user.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

interface AppNavProps {
  role: 'student' | 'admin' | 'superadmin';
}

export function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();
  const navItems = navConfig[role] || [];

  return (
    <nav className="bg-white border-b border-gray-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== `/${role}/dashboard` && item.href !== '/superadmin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function AppFooter() {
  return (
    <footer className="bg-white border-t border-gray-300 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <p className="text-xs text-gray-500 text-center">{institution.footerText}</p>
      </div>
    </footer>
  );
}

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {children}
    </main>
  );
}

interface PageTitleProps {
  children: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}

export function PageTitle({ children, description, action }: PageTitleProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{children}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
      {action}
    </div>
  );
}
