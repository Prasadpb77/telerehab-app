import type { Ai, SecretsStoreSecret } from "@cloudflare/workers-types";

export type SecretValue = SecretsStoreSecret | string;

export interface Env {
  // Cloudflare Workers AI binding (Llama 3.1 8B — free 10k neurons/day tier)
  AI: Ai;

  // Secrets Store bindings (or string env vars for local dev / fallback)
  SUPABASE_URL: SecretValue;
  SUPABASE_SERVICE_ROLE_KEY: SecretValue;
  // JWT signing: the Supabase project's Legacy JWT Secret (Project Settings →
  // API → JWT Settings). A shared HS256 secret — same value signs (this
  // Worker) and verifies (Supabase's own PostgREST/RLS), so `auth.uid()`
  // resolves to the token's `sub` claim on both sides.
  SUPABASE_JWT_SECRET: SecretValue;
  GOOGLE_CLIENT_ID: SecretValue;
  GOOGLE_CLIENT_SECRET: SecretValue;
  GOOGLE_REFRESH_TOKEN: SecretValue;

  // Non-secret vars
  GOOGLE_CALENDAR_ID: string;
  ALLOWED_ORIGIN: string;
}

/**
 * Resolves a secret from a Secrets Store binding (via async .get()) or a plain
 * string env var (used for local dev / backward compatibility).
 */
export async function resolveSecret(secret: SecretValue | undefined): Promise<string> {
  if (!secret) return "";
  if (typeof secret === "string") return secret;
  if (typeof secret === "object" && typeof (secret as SecretsStoreSecret).get === "function") {
    return await (secret as SecretsStoreSecret).get();
  }
  return "";
}

export interface AuthedUser {
  id: string;
  role: "doctor" | "patient";
  email: string;
}