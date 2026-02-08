'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TABLE COMPONENTS - Professional, IIT-style tables
// =============================================================================

interface Column<T> {
  key: string;
  header: string | (() => ReactNode);
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  stickyHeader?: boolean;
  maxHeight?: string;
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = 'No data available',
  onRowClick,
  stickyHeader = true,
  maxHeight,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "bg-white border border-gray-200 rounded",
        maxHeight && "overflow-hidden"
      )}
    >
      <div 
        className={cn(
          "overflow-x-auto",
          maxHeight && `max-h-[${maxHeight}] overflow-y-auto`
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="w-full text-sm border-collapse">
          <thead className={cn(
            "bg-gray-50 border-b border-gray-200",
            stickyHeader && "sticky top-0 z-10"
          )}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50',
                    col.className
                  )}
                >
                  {typeof col.header === 'function' ? col.header() : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'bg-white transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td 
                    key={col.key} 
                    className={cn(
                      'px-4 py-3 text-sm text-gray-900',
                      col.className
                    )}
                  >
                    {col.render 
                      ? col.render(item, index) 
                      : (item as Record<string, unknown>)[col.key] as ReactNode
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// SIMPLE TABLE (for static content)
// =============================================================================

interface SimpleTableProps {
  headers: string[];
  children: ReactNode;
  stickyHeader?: boolean;
}

export function SimpleTable({ headers, children, stickyHeader = true }: SimpleTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className={cn(
            "bg-gray-50 border-b border-gray-200",
            stickyHeader && "sticky top-0 z-10"
          )}>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

interface TableRowProps {
  children: ReactNode;
  index?: number;
  onClick?: () => void;
}

export function TableRow({ children, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        'bg-white transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50'
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return <td className={cn('px-4 py-3 text-sm text-gray-900', className)}>{children}</td>;
}
