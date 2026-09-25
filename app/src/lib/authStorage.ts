import type { AppUser } from "../types/db";

/**
 * Persists the custom-issued JWT + cached profile in localStorage.
 * The token is also injected into the Supabase client (see supabaseClient.ts)
 * as the access token so direct PostgREST queries run under PostgreSQL RLS.
 */

const TOKEN_KEY = "tr_token";
const USER_KEY = "tr_user";

export interface AuthUser extends AppUser {
  role: "doctor" | "patient";
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}