import type { Ai, SecretsStoreSecret } from "@cloudflare/workers-types";

export type SecretValue = SecretsStoreSecret | string;

export interface Env {
  // Cloudflare Workers AI binding (Llama 3.1 8B — free 10k neurons/day tier)
  AI: Ai;

  // Secrets Store bindings (or string env vars for local dev / fallback)
  SUPABASE_URL: SecretValue;
  SUPABASE_SERVICE_ROLE_KEY: SecretValue;
  // JWT signing: the private key JWK (JSON string) of the Supabase asymmetric
  // signing key (ECC P-256 → ES256, or RSA → RS256). Supabase's PostgREST
  // verifies with the matching public key, so `auth.uid()` resolves to `sub`.
  JWT_PRIVATE_JWK: SecretValue;
  GOOGLE_CLIENT_ID: SecretValue;
  GOOGLE_CLIENT_SECRET: SecretValue;
  GOOGLE_REFRESH_TOKEN: SecretValue;

  // Non-secret vars
  GOOGLE_CALENDAR_ID: string;
  ALLOWED_ORIGIN: string;
  // The `kid` of the Supabase signing key; attached to issued tokens so
  // PostgREST selects the matching public key.
  JWT_KEY_ID?: string;
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