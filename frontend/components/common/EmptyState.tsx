'use client';

import { ReactNode } from 'react';
import { FileText, Users, Briefcase, Search, AlertCircle, Bell, Calendar, Upload } from 'lucide-react';
import { Button, LinkButton } from './Button';

// =============================================================================
// EMPTY STATE
// =============================================================================

type EmptyStateType = 
  | 'no-data' 
  | 'no-results' 
  | 'no-companies' 
  | 'no-applications' 
  | 'no-students' 
  | 'no-notices'
  | 'no-documents'
  | 'no-deadlines'
  | 'error';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: ReactNode;
}

const defaultContent: Record<EmptyStateType, { icon: ReactNode; title: string; description: string }> = {
  'no-data': {
    icon: <FileText className="w-12 h-12 text-gray-400" />,
    title: 'No data available',
    description: 'There is no data to display at this time.',
  },
  'no-results': {
    icon: <Search className="w-12 h-12 text-gray-400" />,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
  'no-companies': {
    icon: <Briefcase className="w-12 h-12 text-gray-400" />,
    title: 'No placement drives available',
    description: 'There are no active placement drives at this time.',
  },
  'no-applications': {
    icon: <FileText className="w-12 h-12 text-gray-400" />,
    title: 'No applications yet',
    description: 'You haven\'t applied to any placement drives yet.',
  },
  'no-students': {
    icon: <Users className="w-12 h-12 text-gray-400" />,
    title: 'No students found',
    description: 'There are no students matching your criteria.',
  },
  'no-notices': {
    icon: <Bell className="w-12 h-12 text-gray-400" />,
    title: 'No notices available',
    description: 'There are no notices or announcements at this time.',
  },
  'no-documents': {
    icon: <Upload className="w-12 h-12 text-gray-400" />,
    title: 'No documents uploaded',
    description: 'Upload your resume and other documents to apply for placements.',
  },
  'no-deadlines': {
    icon: <Calendar className="w-12 h-12 text-gray-400" />,
    title: 'No upcoming deadlines',
    description: 'You have no pending application deadlines.',
  },
  'error': {
    icon: <AlertCircle className="w-12 h-12 text-red-400" />,
    title: 'Something went wrong',
    description: 'An error occurred while loading the data. Please try again.',
  },
};

export function EmptyState({ type = 'no-data', title, description, action, icon }: EmptyStateProps) {
  const content = defaultContent[type];

  return (
    <div className="bg-white border border-gray-300 rounded">
      <div className="text-center py-12 px-4">
        <div className="flex justify-center mb-4">
          {icon || content.icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title || content.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
          {description || content.description}
        </p>
        {action && (
          action.href ? (
            <LinkButton href={action.href} variant="primary" size="md">
              {action.label}
            </LinkButton>
          ) : (
            <Button onClick={action.onClick} variant="primary" size="md">
              {action.label}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LOADING STATE
// =============================================================================

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE LOADING
// =============================================================================

export function PageLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-300 h-16" />
        {/* Nav skeleton */}
        <div className="bg-white border-b border-gray-300 h-12" />
        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
