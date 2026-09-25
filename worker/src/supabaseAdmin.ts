import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { type Env, resolveSecret } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS by design — every call site using this
 * MUST perform its own authorization check (see auth.ts / route guards)
 * before reading or writing. Never expose this key to the frontend.
 */
export async function getSupabaseAdmin(env: Env): Promise<SupabaseClient> {
  if (cached) return cached;
  const url = await resolveSecret(env.SUPABASE_URL);
  const serviceRoleKey = await resolveSecret(env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !serviceRoleKey) {
    // Visible in `wrangler tail`; never leak secret values.
    console.error("getSupabaseAdmin: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing/empty");
    throw new Error("Supabase is not configured");
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
