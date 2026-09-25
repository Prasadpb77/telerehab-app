import { createClient } from "@supabase/supabase-js";
import { getToken } from "./authStorage";

// Only the anon key ever ships to the browser. RLS policies (see
// supabase/schema.sql) are what actually keep data scoped per user.
//
// Auth is handled by the Worker's custom JWT endpoints, NOT Supabase Auth. To
// keep direct PostgREST reads/writes working with RLS, the custom JWT is
// supplied to the Supabase client as the access token via `accessToken`.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  accessToken: async () => getToken() ?? "",
});