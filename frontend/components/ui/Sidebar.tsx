'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export interface SidebarItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  children?: SidebarItem[];
  disabled?: boolean;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  isOpen: boolean;
  onToggle: () => void;
  collapsible?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

export function Sidebar({
  sections,
  isOpen,
  onToggle,
  collapsible = true,
  className,
  footer,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderItem = (item: SidebarItem, depth: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const active = isActive(item.href);

    const content = (
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5',
          'cursor-pointer select-none',
          'transition-colors duration-200',
          depth > 0 && 'ml-4',
          active
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800',
          item.disabled && 'opacity-50 pointer-events-none'
        )}
        onClick={() => hasChildren && toggleExpanded(item.label)}
      >
        {Icon && (
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              active
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-secondary-400 group-hover:text-secondary-600 dark:group-hover:text-secondary-300'
            )}
          />
        )}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 text-sm font-medium truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {isOpen && item.badge && (
          <Badge
            variant={item.badgeVariant || 'default'}
            size="sm"
          >
            {item.badge}
          </Badge>
        )}
        {isOpen && hasChildren && (
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        )}
      </motion.div>
    );

    return (
      <div key={item.label}>
        {item.href && !hasChildren ? (
          <Link href={item.href}>{content}</Link>
        ) : (
          content
        )}
        <AnimatePresence>
          {hasChildren && isExpanded && isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children?.map((child) => renderItem(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 256 : 72,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-30',
          'h-screen flex flex-col',
          'bg-white dark:bg-secondary-900',
          'border-r border-secondary-200 dark:border-secondary-800',
          'shadow-soft lg:shadow-none',
          // Mobile: slide in/out
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Header with Toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-secondary-200 dark:border-secondary-800">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CP</span>
                </div>
                <span className="font-semibold text-lg text-secondary-900 dark:text-white">
                  CPMS
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {collapsible && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggle}
              className={cn(
                'hidden lg:flex items-center justify-center',
                'h-8 w-8 rounded-lg',
                'text-secondary-500 hover:text-secondary-700',
                'hover:bg-secondary-100 dark:hover:bg-secondary-800',
                'transition-colors duration-200',
                !isOpen && 'mx-auto'
              )}
            >
              <ChevronLeft
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  !isOpen && 'rotate-180'
                )}
              />
            </motion.button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {sections.map((section, index) => (
            <div key={index}>
              <AnimatePresence mode="wait">
                {section.title && isOpen && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-400 dark:text-secondary-500"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div className="p-3 border-t border-secondary-200 dark:border-secondary-800">
            {footer}
          </div>
        )}
      </motion.aside>
    </>
  );
}

export default Sidebar;
