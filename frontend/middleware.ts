import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

// Role-based route prefixes
const studentRoutes = '/student';
const adminRoutes = '/admin';
const superAdminRoutes = '/superadmin';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for access token in cookie (set by client) or Authorization header
  // Note: For client-side auth, we rely on client-side checks
  // This middleware handles basic route protection

  // Get token from cookie if available
  const token = request.cookies.get('accessToken')?.value;

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For page routes, we'll let client-side handle it
    // since tokens are stored in localStorage
    return NextResponse.next();
  }

  // Parse token to get role (basic check)
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    const role = payload.role;

    // Role-based access control
    if (pathname.startsWith(studentRoutes) && role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith(adminRoutes) && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith(superAdminRoutes) && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    // Invalid token, let client handle it
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
