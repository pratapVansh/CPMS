/**
 * CSV Export Utility
 * Exports data to CSV format for download
 */

interface ColumnDef<T> {
  key: string;
  header: string;
  format?: (value: unknown, item: T) => string | number;
}

export function exportToCSV<T>(
  data: T[],
  filename: string,
  columns: ColumnDef<T>[]
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Helper to get nested property value
  const getNestedValue = (obj: T, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  // Create header row
  const headers = columns.map((col) => col.header).join(',');

  // Create data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = getNestedValue(item, col.key);
        
        // Use custom format function if provided
        if (col.format) {
          const formatted = col.format(value, item);
          return typeof formatted === 'string' && (formatted.includes(',') || formatted.includes('\n'))
            ? `"${formatted.replace(/"/g, '""')}"`
            : String(formatted);
        }
        
        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
        }
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for CSV export
 */
export function formatDateForExport(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
