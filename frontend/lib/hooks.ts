import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getAccessToken } from './auth';
import type { Role } from './auth';

/**
 * Handles bfcache (back/forward cache) restores for protected pages.
 * The existing useEffect in each page covers the initial mount auth check.
 * This hook covers the case where the browser restores the page from bfcache
 * without making a new network request, bypassing the server middleware.
 */
export function usePageShowGuard(requiredRoles: Role | Role[]): void {
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      const token = getAccessToken();
      const user = getUser();
      if (!token || !user) {
        router.replace('/login');
        return;
      }
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!roles.includes(user.role)) {
        router.replace('/login');
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) check();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router, requiredRoles]);
}
