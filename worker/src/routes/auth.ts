import { Hono } from "hono";
import type { Env, AuthedUser } from "../env";
import { hashPassword, verifyPassword, signJwt, getSigningConfig } from "../crypto";
import { getSupabaseAdmin } from "../supabaseAdmin";
import { requireAuth } from "../auth";

export const auth = new Hono<{ Bindings: Env }>();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /api/auth/signup
 * Creates a patient account with a salted PBKDF2 password hash and returns a JWT.
 * Doctor accounts are provisioned out-of-band (Phase 1 has exactly one doctor).
 */
auth.post("/signup", async (c) => {
  const body = await c.req.json<{
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
  }>();

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.full_name?.trim();

  if (!email || !isValidEmail(email)) return c.json({ error: "A valid email is required" }, 400);
  if (!password || password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }
  if (!fullName) return c.json({ error: "full_name is required" }, 400);

  // Step-distinct error codes (no secret values) so the failing stage is
  // identifiable from the browser response alone.
  let supabase;
  try {
    supabase = await getSupabaseAdmin(c.env);
  } catch (err) {
    console.error("signup: supabase init failed", err instanceof Error ? err.message : err);
    return c.json({ error: "Service unavailable (auth-db)" }, 500);
  }

  try {
    const { data: existing, error: lookupErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (lookupErr) {
      console.error("signup: users lookup failed", lookupErr.message);
      return c.json({ error: "Service unavailable (auth-query)" }, 500);
    }
    if (existing) return c.json({ error: "An account with this email already exists" }, 409);

    const passwordHash = await hashPassword(password);
    const id = crypto.randomUUID();

    const { data: user, error: userErr } = await supabase
      .from("users")
      .insert({
        id,
        role: "patient",
        full_name: fullName,
        email,
        phone: body.phone ?? null,
        password_hash: passwordHash,
      })
      .select("id, role, email, full_name, phone, avatar_url")
      .single();
    if (userErr) {
      console.error("signup: users insert failed", userErr.message);
      return c.json({ error: userErr.message }, 500);
    }

    const { error: patientsErr } = await supabase.from("patients").insert({ user_id: id });
    if (patientsErr) {
      console.error("signup: patients insert failed", patientsErr.message);
    }

    let signing;
    try {
      signing = await getSigningConfig(c.env);
    } catch (err) {
      console.error("signup: signing config failed", err instanceof Error ? err.message : err);
      return c.json({ error: "Auth not configured (signing-invalid)" }, 500);
    }
    if (!signing) {
      console.error("signup: JWT_PRIVATE_JWK missing or empty");
      return c.json({ error: "Auth not configured (signing-missing)" }, 500);
    }
    let token: string;
    try {
      token = await signJwt({ sub: id, email, user_role: "patient" }, signing);
    } catch (err) {
      console.error("signup: signJwt failed", err instanceof Error ? err.message : err);
      return c.json({ error: "Token issuance failed" }, 500);
    }

    return c.json({ token, user }, 201);
  } catch (err) {
    console.error("signup: unexpected error", err instanceof Error ? err.message : err);
    return c.json({ error: "Signup temporarily unavailable" }, 500);
  }
});

/**
 * POST /api/auth/login
 * Verifies credentials against the stored PBKDF2 hash and returns a JWT.
 */
auth.post("/login", async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) return c.json({ error: "email and password are required" }, 400);

  // Step-distinct error codes (no secret values) so the failing stage is
  // identifiable from the browser response alone.
  let supabase;
  try {
    supabase = await getSupabaseAdmin(c.env);
  } catch (err) {
    console.error("login: supabase init failed", err instanceof Error ? err.message : err);
    return c.json({ error: "Service unavailable (auth-db)" }, 500);
  }

  try {
    const { data: user, error: lookupErr } = await supabase
      .from("users")
      .select("id, role, email, full_name, phone, avatar_url, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (lookupErr) {
      console.error("login: users lookup failed", lookupErr.message);
      return c.json({ error: "Service unavailable (auth-query)" }, 500);
    }

    // Generic error to avoid leaking which emails exist.
    if (!user || !user.password_hash) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    let ok = false;
    try {
      ok = await verifyPassword(password, user.password_hash);
    } catch (err) {
      console.error("login: password verification failed", err instanceof Error ? err.message : err);
      return c.json({ error: "Login temporarily unavailable" }, 500);
    }
    if (!ok) return c.json({ error: "Invalid email or password" }, 401);

    let signing;
    try {
      signing = await getSigningConfig(c.env);
    } catch (err) {
      console.error("login: signing config failed", err instanceof Error ? err.message : err);
      return c.json({ error: "Auth not configured (signing-invalid)" }, 500);
    }
    if (!signing) {
      console.error("login: JWT_PRIVATE_JWK missing or empty");
      return c.json({ error: "Auth not configured (signing-missing)" }, 500);
    }
    let token: string;
    try {
      token = await signJwt(
        { sub: user.id, email: user.email, user_role: user.role },
        signing
      );
    } catch (err) {
      console.error("login: signJwt failed", err instanceof Error ? err.message : err);
      return c.json({ error: "Token issuance failed" }, 500);
    }

    const { password_hash: _omit, ...safeUser } = user;
    return c.json({ token, user: safeUser });
  } catch (err) {
    console.error("login: unexpected error", err instanceof Error ? err.message : err);
    return c.json({ error: "Login temporarily unavailable" }, 500);
  }
});

/** GET /api/auth/me — returns the authenticated user's profile. */
auth.get("/me", requireAuth, async (c) => {
  const authed = c.get("user" as never) as AuthedUser;
  const supabase = await getSupabaseAdmin(c.env);

  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, email, full_name, phone, avatar_url")
    .eq("id", authed.id)
    .single();
  if (error || !user) return c.json({ error: "User not found" }, 404);

  return c.json({ user });
});