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

  const supabase = await getSupabaseAdmin(c.env);

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
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
  if (userErr) return c.json({ error: userErr.message }, 500);

  await supabase.from("patients").insert({ user_id: id });

  const signing = await getSigningConfig(c.env);
  if (!signing) return c.json({ error: "Auth not configured" }, 500);
  const token = await signJwt({ sub: id, email, user_role: "patient" }, signing);

  return c.json({ token, user }, 201);
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

  const supabase = await getSupabaseAdmin(c.env);

  const { data: user } = await supabase
    .from("users")
    .select("id, role, email, full_name, phone, avatar_url, password_hash")
    .eq("email", email)
    .maybeSingle();

  // Generic error to avoid leaking which emails exist.
  if (!user || !user.password_hash) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return c.json({ error: "Invalid email or password" }, 401);

  const signing = await getSigningConfig(c.env);
  if (!signing) return c.json({ error: "Auth not configured" }, 500);
  const token = await signJwt(
    { sub: user.id, email: user.email, user_role: user.role },
    signing
  );

  const { password_hash: _omit, ...safeUser } = user;
  return c.json({ token, user: safeUser });
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