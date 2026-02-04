'use client';

import { cn } from '@/lib/utils';

// =============================================================================
// STATUS BADGE - Small pill badges for tables
// =============================================================================

type BadgeStatus = 
  | 'applied' 
  | 'shortlisted' 
  | 'selected' 
  | 'rejected' 
  | 'pending' 
  | 'active' 
  | 'disabled' 
  | 'open' 
  | 'closed' 
  | 'verified' 
  | 'unverified'
  | 'uploaded'
  | 'not_uploaded'
  | 'urgent'
  | 'deadline'
  | 'placement'
  | 'general'
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'default';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

// Unified color system:
// Blue → Info, Applied, Placement
// Yellow → Warning, Shortlisted, Pending verification
// Green → Success, Selected, Active, Open, Verified, Uploaded
// Red → Error, Rejected, Disabled, Urgent, Not uploaded
// Gray → Neutral, Pending, Closed, Default
const statusClasses: Record<BadgeStatus, string> = {
  // Application statuses
  applied: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
  
  // Account statuses
  active: 'bg-green-100 text-green-700',
  disabled: 'bg-red-100 text-red-700',
  
  // Drive statuses
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  
  // Document statuses
  verified: 'bg-green-100 text-green-700',
  unverified: 'bg-yellow-100 text-yellow-700',
  uploaded: 'bg-green-100 text-green-700',
  not_uploaded: 'bg-red-100 text-red-700',
  
  // Notice types
  urgent: 'bg-red-100 text-red-700',
  deadline: 'bg-yellow-100 text-yellow-700',
  placement: 'bg-blue-100 text-blue-700',
  general: 'bg-gray-100 text-gray-600',
  
  // Generic semantic statuses
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  
  default: 'bg-gray-100 text-gray-600',
};

// Mapping for common status strings
const statusMapping: Record<string, BadgeStatus> = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  PENDING: 'pending',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  OPEN: 'open',
  CLOSED: 'closed',
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  UPLOADED: 'uploaded',
  NOT_UPLOADED: 'not_uploaded',
  URGENT: 'urgent',
  DEADLINE: 'deadline',
  PLACEMENT: 'placement',
  GENERAL: 'general',
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
};

export function StatusBadge({ status, children, className, size = 'sm' }: StatusBadgeProps) {
  const normalizedStatus = statusMapping[status.toUpperCase()] || (status as BadgeStatus);
  const classes = statusClasses[normalizedStatus] || statusClasses.default;
  
  const displayText = children || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        sizeClasses[size],
        classes,
        className
      )}
    >
      {displayText}
    </span>
  );
}

// =============================================================================
// DOT INDICATOR
// =============================================================================

interface DotIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label?: string;
  className?: string;
}

const dotClasses = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
};

export function DotIndicator({ status, label, className }: DotIndicatorProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('w-2 h-2 rounded-full', dotClasses[status])} />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </span>
  );
}
