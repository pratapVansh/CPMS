'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('h-9 w-9 rounded-lg bg-secondary-100 dark:bg-secondary-800', className)} />
    );
  }

  // Icon toggle (simple sun/moon toggle)
  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'relative h-9 w-9 rounded-lg flex items-center justify-center',
          'bg-secondary-100 dark:bg-secondary-800',
          'hover:bg-secondary-200 dark:hover:bg-secondary-700',
          'text-secondary-600 dark:text-secondary-400',
          'transition-colors duration-200',
          className
        )}
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resolvedTheme}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  }

  // Dropdown toggle (light/dark/system options)
  if (variant === 'dropdown') {
    const options = [
      { value: 'light', label: 'Light', icon: Sun },
      { value: 'dark', label: 'Dark', icon: Moon },
      { value: 'system', label: 'System', icon: Monitor },
    ];

    return (
      <div className={cn('relative', className)}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-secondary-100 dark:bg-secondary-800',
            'hover:bg-secondary-200 dark:hover:bg-secondary-700',
            'text-secondary-700 dark:text-secondary-300',
            'text-sm font-medium',
            'transition-colors duration-200'
          )}
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="capitalize">{theme}</span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute right-0 mt-2 w-40 z-50',
                  'bg-white dark:bg-secondary-800',
                  'border border-secondary-200 dark:border-secondary-700',
                  'rounded-lg shadow-soft-lg',
                  'overflow-hidden'
                )}
              >
                {options.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2',
                        'text-sm text-left',
                        'hover:bg-secondary-100 dark:hover:bg-secondary-700',
                        'transition-colors duration-150',
                        theme === option.value
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-secondary-700 dark:text-secondary-300'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Switch toggle (pill-style toggle)
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-full',
        'bg-secondary-100 dark:bg-secondary-800',
        className
      )}
    >
      {[
        { value: 'light', icon: Sun },
        { value: 'dark', icon: Moon },
      ].map((option) => {
        const Icon = option.icon;
        const isActive = resolvedTheme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              'relative p-1.5 rounded-full transition-colors duration-200',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="theme-switch"
                className="absolute inset-0 bg-white dark:bg-secondary-700 rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className="relative h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
