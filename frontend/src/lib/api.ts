import axios, { AxiosError } from 'axios';
import type { ApiError } from '@fiviko/shared';

/**
 * Shared axios instance. The dev server proxies `/api` to the backend
 * (see vite.config.ts), and cookies are sent for session auth.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const TOKEN_KEY = 'fiviko_token';

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

export function loadStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  return token;
}

/** Pull a human-readable message out of an axios error for display in the UI. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiError | undefined;
    return data?.error?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
