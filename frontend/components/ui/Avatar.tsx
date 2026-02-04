'use client';

import { forwardRef, ImgHTMLAttributes } from 'react';
import { cn, getInitials } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  size?: AvatarSize;
  name?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  ring?: boolean;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
};

const statusStyles: Record<string, string> = {
  online: 'bg-success-500',
  offline: 'bg-secondary-400',
  busy: 'bg-danger-500',
  away: 'bg-warning-500',
};

const statusSizes: Record<AvatarSize, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
  '2xl': 'h-4 w-4',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'md', name, src, alt, status, ring = false, ...props }, ref) => {
    const initials = name ? getInitials(name) : '';
    const altText = alt || name || 'Avatar';

    return (
      <div ref={ref} className={cn('relative inline-flex', className)}>
        {src ? (
          <img
            src={src}
            alt={altText}
            className={cn(
              'rounded-full object-cover',
              'bg-secondary-200 dark:bg-secondary-700',
              ring && 'ring-2 ring-white dark:ring-secondary-900',
              sizeStyles[size]
            )}
            {...props}
          />
        ) : (
          <div
            className={cn(
              'rounded-full flex items-center justify-center font-medium',
              'bg-primary-100 text-primary-700',
              'dark:bg-primary-900/50 dark:text-primary-300',
              ring && 'ring-2 ring-white dark:ring-secondary-900',
              sizeStyles[size]
            )}
          >
            {initials}
          </div>
        )}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full',
              'ring-2 ring-white dark:ring-secondary-900',
              statusStyles[status],
              statusSizes[size]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarGroup = ({ children, max = 4, size = 'md', className }: AvatarGroupProps) => {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = childArray.slice(0, max);
  const remaining = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((child, index) => (
        <div key={index} className="relative" style={{ zIndex: max - index }}>
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium',
            'bg-secondary-200 text-secondary-700',
            'dark:bg-secondary-700 dark:text-secondary-300',
            'ring-2 ring-white dark:ring-secondary-900',
            sizeStyles[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default Avatar;
