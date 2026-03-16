import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

// Role-based route prefixes
const studentRoutes = '/student';
const adminRoutes = '/admin';
const superAdminRoutes = '/superadmin';

// Auth routes that logged-in users should not be able to access
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('accessToken')?.value;

  // If logged-in user visits an auth route, redirect to their dashboard
  if (authRoutes.includes(pathname) && token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      const role = payload.role;

      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/superadmin', request.url));
      } else if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/student/dashboard', request.url));
      }
    } catch {
      // Invalid token — let them through to login/register
    }
  }

  // Allow all public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect protected page routes to login
    if (
      pathname.startsWith(studentRoutes) ||
      pathname.startsWith(adminRoutes) ||
      pathname.startsWith(superAdminRoutes)
    ) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

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
