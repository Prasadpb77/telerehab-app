import { SignJWT, jwtVerify } from "jose";
import { type Env, resolveSecret } from "./env";

/**
 * Password hashing + JWT helpers for the custom auth layer.
 *
 * Passwords are stored using PBKDF2-HMAC-SHA256 with a per-user random salt.
 * Storage format: `pbkdf2$<iterations>$<saltB64>$<hashB64>`.
 *
 * JWTs are signed with HS256 using the Supabase project's Legacy JWT Secret
 * (Project Settings → API → JWT Settings → "JWT Secret"), provided as
 * `SUPABASE_JWT_SECRET`. This is a shared secret: the same value both signs
 * and verifies, and it's also what Supabase's own PostgREST/RLS layer uses
 * to verify the token, so `auth.uid()` resolves to `sub` there too.
 */

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveHash(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: PBKDF2_HASH },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return new Uint8Array(bits);
}

/** Hash a plaintext password into a self-describing, salted storage string. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveHash(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** Constant-time-ish verification of a plaintext password against a stored hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const actual = await deriveHash(password, salt, iterations);

  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export interface JwtUserClaims {
  sub: string;
  email: string;
  /**
   * Application role (doctor/patient). NOTE: this is NOT the PostgREST Postgres
   * role — that is carried in the standard `role` claim (always "authenticated")
   * so PostgREST switches to the `authenticated` role and applies RLS.
   */
  user_role: "doctor" | "patient";
  [key: string]: unknown;
}

/** Resolved HS256 signing strategy — one shared secret signs and verifies. */
export interface SigningConfig {
  alg: "HS256";
  /** Same key used for both signing and verifying (symmetric). */
  signKey: Uint8Array;
  verifyKey: Uint8Array;
}

/**
 * Resolve the signing config from `SUPABASE_JWT_SECRET` — the Legacy JWT
 * Secret shown at Project Settings → API → JWT Settings. Returns null when
 * no secret is configured. Throws with a logged, specific reason when the
 * stored value cannot be used. The secret value itself is never logged.
 */
export async function getSigningConfig(env: Env): Promise<SigningConfig | null> {
  const secretRaw = await resolveSecret(env.SUPABASE_JWT_SECRET);
  if (!secretRaw) return null;

  let trimmed = secretRaw.trim();
  // Tolerate accidental surrounding quotes from copy-paste into a secrets store.
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    trimmed = trimmed.slice(1, -1);
  }

  if (trimmed.length < 32) {
    console.error("signing: SUPABASE_JWT_SECRET looks too short to be valid", JSON.stringify({ len: trimmed.length }));
    throw new Error("SUPABASE_JWT_SECRET is set but looks too short/invalid");
  }

  const keyBytes = new TextEncoder().encode(trimmed);
  console.log("signing: HS256 secret resolved", JSON.stringify({ len: trimmed.length }));
  return { alg: "HS256", signKey: keyBytes, verifyKey: keyBytes };
}

/**
 * Sign a JWT with the resolved config. Includes `role: "authenticated"` so
 * PostgREST/RLS accept the token, plus a custom `user_role` claim the Worker
 * middleware reads for authorization.
 */
export async function signJwt(
  claims: JwtUserClaims,
  config: SigningConfig,
  expiresIn: string = "7d"
): Promise<string> {
  const jwt = new SignJWT({
    email: claims.email,
    user_role: claims.user_role,
    role: "authenticated",
  })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setAudience("authenticated")
    .setExpirationTime(expiresIn);

  jwt.setProtectedHeader({ alg: config.alg });

  return await jwt.sign(config.signKey);
}

/** Verify a JWT issued by this Worker. */
export async function verifyJwt(
  token: string,
  config: SigningConfig
): Promise<JwtUserClaims> {
  const { payload } = await jwtVerify(token, config.verifyKey, {
    algorithms: [config.alg],
  });
  return payload as unknown as JwtUserClaims;
}