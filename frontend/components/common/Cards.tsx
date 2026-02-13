'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// CARD COMPONENTS
// =============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded', paddingClasses[padding], className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// =============================================================================
// STAT CARD - Consistent styling with icon
// =============================================================================

type StatColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: StatColor;
  subtitle?: string;
  trend?: { value: number; label: string };
}

const colorClasses: Record<StatColor, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
};

export function StatCard({ title, value, icon, color = 'blue', subtitle }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <span className={colors.text}>{icon}</span>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={cn('text-2xl font-bold', icon ? colors.text : 'text-gray-900')}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// FILTER TABS - Consistent tab/filter buttons
// =============================================================================

interface FilterTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterTabs<T extends string>({ options, value, onChange, className }: FilterTabsProps<T>) {
  return (
    <div className={cn('flex gap-2', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-4 py-2 text-sm rounded border transition-colors',
            value === option.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// INFO ROW
// =============================================================================

interface InfoRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex justify-between py-2 border-b border-gray-100 last:border-0', className)}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

// =============================================================================
// GRID LAYOUTS
// =============================================================================

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

const gridColsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export function Grid({ children, cols = 3, className }: GridProps) {
  return (
    <div className={cn('grid gap-6', gridColsClasses[cols], className)}>
      {children}
    </div>
  );
}
