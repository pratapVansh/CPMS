'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Bell,
  Search,
  User,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onMenuClick?: () => void;
  onLogout?: () => void;
  showSearch?: boolean;
  notifications?: number;
  className?: string;
}

export function Navbar({
  user,
  onMenuClick,
  onLogout,
  showSearch = true,
  notifications = 0,
  className,
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const userMenuItems = [
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help', href: '/help', icon: HelpCircle },
  ];

  return (
    <nav
      className={cn(
        'sticky top-0 z-40 w-full',
        'bg-white/80 dark:bg-secondary-900/80',
        'backdrop-blur-lg',
        'border-b border-secondary-200 dark:border-secondary-800',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className={cn(
              'lg:hidden p-2 rounded-lg',
              'text-secondary-600 dark:text-secondary-400',
              'hover:bg-secondary-100 dark:hover:bg-secondary-800',
              'transition-colors duration-200'
            )}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CP</span>
            </div>
            <span className="hidden sm:block font-semibold text-lg text-secondary-900 dark:text-white">
              CPMS
            </span>
          </Link>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search..."
                className={cn(
                  'w-full h-9 pl-10 pr-4 rounded-lg text-sm',
                  'bg-secondary-100 dark:bg-secondary-800',
                  'text-secondary-900 dark:text-secondary-100',
                  'placeholder:text-secondary-400 dark:placeholder:text-secondary-500',
                  'border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  'transition-all duration-200'
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-secondary-700 rounded border border-secondary-200 dark:border-secondary-600 text-secondary-500">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <button
            className={cn(
              'relative p-2 rounded-lg',
              'text-secondary-600 dark:text-secondary-400',
              'hover:bg-secondary-100 dark:hover:bg-secondary-800',
              'transition-colors duration-200'
            )}
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={cn(
                  'flex items-center gap-2 p-1.5 rounded-lg',
                  'hover:bg-secondary-100 dark:hover:bg-secondary-800',
                  'transition-colors duration-200'
                )}
              >
                <Avatar name={user.name} src={user.avatar} size="sm" status="online" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                    {user.role.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className="hidden sm:block h-4 w-4 text-secondary-400" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'absolute right-0 mt-2 w-56 z-50',
                        'bg-white dark:bg-secondary-800',
                        'border border-secondary-200 dark:border-secondary-700',
                        'rounded-xl shadow-soft-lg',
                        'overflow-hidden'
                      )}
                    >
                      {/* User Info */}
                      <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="p-1">
                        {userMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsProfileOpen(false)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg',
                                'text-sm text-secondary-700 dark:text-secondary-300',
                                'hover:bg-secondary-100 dark:hover:bg-secondary-700',
                                'transition-colors duration-150'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Logout */}
                      <div className="p-1 border-t border-secondary-200 dark:border-secondary-700">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            onLogout?.();
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
                            'text-sm text-danger-600 dark:text-danger-400',
                            'hover:bg-danger-50 dark:hover:bg-danger-900/20',
                            'transition-colors duration-150'
                          )}
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
