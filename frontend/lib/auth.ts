import { apiPost, getAccessToken, setAccessToken, removeAccessToken } from './api';
import Cookies from 'js-cookie';

// Re-export token functions for components that need direct access
export { setAccessToken, getAccessToken, removeAccessToken };

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  cgpa?: number;
  branch?: string;
}

export async function login(input: LoginInput): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await apiPost<AuthResponse>('/auth/login', input as unknown as Record<string, unknown>, { auth: false });

  if (response.success && response.data) {
    setAccessToken(response.data.accessToken);
    saveUser(response.data.user);
    // Set cookie for middleware
    Cookies.set('accessToken', response.data.accessToken, { expires: 7 });
    return { success: true, user: response.data.user };
  }

  return { success: false, error: response.error?.message || 'Login failed' };
}

export async function register(input: RegisterInput): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await apiPost<AuthResponse>('/auth/register', input as unknown as Record<string, unknown>, { auth: false });

  if (response.success && response.data) {
    setAccessToken(response.data.accessToken);
    saveUser(response.data.user);
    return { success: true, user: response.data.user };
  }

  return { success: false, error: response.error?.message || 'Registration failed' };
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout', {}, { auth: false });
  removeAccessToken();
  removeUser();
  // Remove cookie
  Cookies.remove('accessToken');
  
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function saveUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getUserRole(): Role | null {
  const user = getUser();
  return user?.role || null;
}

export function hasRole(requiredRole: Role): boolean {
  const role = getUserRole();
  return role === requiredRole;
}

// For server-side / middleware use
export function parseJwt(token: string): { userId: string; role: Role; exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}
