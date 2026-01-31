'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-secondary-100 text-secondary-800
    dark:bg-secondary-800 dark:text-secondary-200
  `,
  primary: `
    bg-primary-100 text-primary-800
    dark:bg-primary-900/50 dark:text-primary-300
  `,
  secondary: `
    bg-secondary-200 text-secondary-800
    dark:bg-secondary-700 dark:text-secondary-200
  `,
  success: `
    bg-success-100 text-success-800
    dark:bg-success-900/50 dark:text-success-300
  `,
  warning: `
    bg-warning-100 text-warning-800
    dark:bg-warning-900/50 dark:text-warning-300
  `,
  danger: `
    bg-danger-100 text-danger-800
    dark:bg-danger-900/50 dark:text-danger-300
  `,
  outline: `
    bg-transparent border border-secondary-300 text-secondary-700
    dark:border-secondary-600 dark:text-secondary-300
  `,
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-secondary-500',
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  outline: 'bg-secondary-500',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, pulse = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full',
          'transition-colors duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2">
            {pulse && (
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  dotColors[variant]
                )}
              />
            )}
            <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[variant])} />
          </span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
