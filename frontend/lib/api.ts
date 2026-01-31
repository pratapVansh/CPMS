import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Array<{ field: string; message: string }>;
  };
  message?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  auth?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

export function removeAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      removeAccessToken();
      return null;
    }

    const data: ApiResponse<{ accessToken: string }> = await response.json();
    
    if (data.success && data.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      return data.data.accessToken;
    }

    return null;
  } catch {
    removeAccessToken();
    return null;
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, auth = true } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    let response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies for refresh token
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && auth) {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        // Retry the request with new token
        requestHeaders['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_URL}${endpoint}`, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
        });
      } else {
        // Redirect to login if refresh failed
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return {
          success: false,
          error: { message: 'Session expired', code: 'SESSION_EXPIRED' },
        };
      }
    }

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

// Convenience methods
export const apiGet = <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  api<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  api<T>(endpoint, { ...options, method: 'POST', body });

export const apiPut = <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  api<T>(endpoint, { ...options, method: 'PUT', body });

export const apiPatch = <T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  api<T>(endpoint, { ...options, method: 'PATCH', body });

export const apiDelete = <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  api<T>(endpoint, { ...options, method: 'DELETE' });

/**
 * Upload a file to the API
 */
export async function apiUploadFile<T = unknown>(
  endpoint: string,
  file: File,
  fieldName: string = 'file'
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append(fieldName, file);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    // Handle 401 - try to refresh token
    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include',
        });
        return retryResponse.json();
      } else {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return {
          success: false,
          error: { message: 'Session expired', code: 'SESSION_EXPIRED' },
        };
      }
    }

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Upload failed',
        code: 'UPLOAD_ERROR',
      },
    };
  }
}
