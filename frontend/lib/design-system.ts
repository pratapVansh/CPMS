/**
 * CPMS Global Design System
 * Institutional Design for Rajiv Gandhi Institute of Petroleum Technology
 * 
 * This file defines all design tokens and constants used across the application.
 * Import these constants to ensure visual consistency across all pages.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Primary - Institute Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',  // Main primary color
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Secondary - Neutral Gray
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',  // Page background
    200: '#e5e7eb',
    300: '#d1d5db',  // Borders
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',  // Text
  },
  
  // Accent - Status Colors
  status: {
    success: {
      bg: '#dcfce7',
      text: '#166534',
      border: '#86efac',
    },
    warning: {
      bg: '#fef9c3',
      text: '#854d0e',
      border: '#fde047',
    },
    error: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#fca5a5',
    },
    info: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#93c5fd',
    },
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font Family
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  
  // Font Sizes with corresponding Tailwind classes
  sizes: {
    pageTitle: 'text-xl font-bold',      // Main page titles
    sectionTitle: 'text-lg font-semibold', // Section headers
    cardTitle: 'text-base font-semibold',  // Card titles
    tableHeader: 'text-xs font-semibold uppercase tracking-wide', // Table headers
    body: 'text-sm',                       // Body text
    small: 'text-xs',                      // Small text, labels
    caption: 'text-xs text-gray-500',      // Captions, helper text
  },
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  // Container
  maxWidth: 'max-w-7xl',
  containerPadding: 'px-4 sm:px-6 lg:px-8',
  
  // Page
  pageBackground: 'bg-gray-100',
  pagePadding: 'py-6',
  
  // Spacing
  sectionGap: 'space-y-6',
  cardGap: 'gap-6',
} as const;

// =============================================================================
// COMPONENT STYLES
// =============================================================================

export const components = {
  // Card
  card: {
    base: 'bg-white border border-gray-300 rounded',
    padding: 'p-6',
    hover: 'hover:border-gray-400 transition-colors',
  },
  
  // Table
  table: {
    wrapper: 'overflow-x-auto',
    table: 'w-full text-sm',
    header: 'bg-gray-50 border-b border-gray-300',
    headerCell: 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide',
    row: 'border-b border-gray-200',
    rowEven: 'bg-white',
    rowOdd: 'bg-gray-50',
    cell: 'px-4 py-3 text-gray-900',
  },
  
  // Button
  button: {
    base: 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    sizes: {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    },
  },
  
  // Status Badge
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border',
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    shortlisted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    selected: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-gray-50 text-gray-700 border-gray-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    disabled: 'bg-red-50 text-red-700 border-red-200',
    open: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-50 text-gray-700 border-gray-200',
    verified: 'bg-green-50 text-green-700 border-green-200',
    unverified: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  
  // Input
  input: {
    base: 'w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    label: 'block text-sm font-medium text-gray-700 mb-1',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
  },
  
  // Header
  header: {
    wrapper: 'bg-white border-b border-gray-300',
    container: 'max-w-7xl mx-auto px-4 py-3 flex justify-between items-center',
    logo: 'flex items-center gap-3',
    logoIcon: 'w-10 h-10 bg-blue-600 rounded flex items-center justify-center',
    title: 'text-lg font-bold text-gray-900',
    subtitle: 'text-xs text-gray-600',
  },
  
  // Navigation
  nav: {
    wrapper: 'bg-white border-b border-gray-300',
    container: 'max-w-7xl mx-auto px-4',
    list: 'flex gap-6',
    item: 'flex items-center gap-2 py-3 border-b-2 text-sm',
    active: 'border-blue-600 text-blue-600 font-medium',
    inactive: 'border-transparent text-gray-600 hover:text-gray-900',
  },
  
  // Footer
  footer: {
    wrapper: 'bg-white border-t border-gray-300 mt-8',
    container: 'max-w-7xl mx-auto px-4 py-4',
    text: 'text-xs text-gray-500 text-center',
  },
  
  // Empty State
  emptyState: {
    wrapper: 'text-center py-12',
    icon: 'w-12 h-12 text-gray-400 mx-auto mb-4',
    title: 'text-lg font-medium text-gray-900 mb-2',
    description: 'text-sm text-gray-500 mb-4',
  },
} as const;

// =============================================================================
// INSTITUTION INFO
// =============================================================================

export const institution = {
  name: 'Rajiv Gandhi Institute of Petroleum Technology',
  shortName: 'RGIPT',
  department: 'Training & Placement Cell',
  systemName: 'CPMS',
  systemFullName: 'Campus Placement Management System',
  year: new Date().getFullYear(),
  footerText: `© ${new Date().getFullYear()} Training & Placement Cell, RGIPT. All rights reserved.`,
} as const;

// =============================================================================
// NAVIGATION CONFIGS
// =============================================================================

export const navigation = {
  student: [
    { href: '/student/dashboard', label: 'Dashboard' },
    { href: '/student/applications', label: 'Applications' },
    { href: '/student/profile', label: 'Profile' },
    { href: '/student/notices', label: 'Notices' },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/drives', label: 'Drives' },
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/notices', label: 'Notices' },
    { href: '/admin/reports', label: 'Reports' },
  ],
  superadmin: [
    { href: '/superadmin', label: 'Dashboard' },
    { href: '/superadmin/admins', label: 'Admins' },
    { href: '/superadmin/settings', label: 'Settings' },
    { href: '/superadmin/audit-logs', label: 'Audit Logs' },
  ],
} as const;
