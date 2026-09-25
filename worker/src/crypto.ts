import { SignJWT, jwtVerify, importJWK, type JWK } from "jose";
import { type Env, resolveSecret } from "./env";

/**
 * Password hashing + JWT helpers for the custom auth layer.
 *
 * Passwords are stored using PBKDF2-HMAC-SHA256 with a per-user random salt.
 * Storage format: `pbkdf2$<iterations>$<saltB64>$<hashB64>`.
 *
 * JWTs are signed with the Supabase project's asymmetric signing key (ECC
 * P-256 → ES256, or RSA → RS256), provided as a private JWK in
 * `JWT_PRIVATE_JWK` with its `kid` in `JWT_KEY_ID`. Supabase's PostgREST
 * verifies with the matching public key, so `auth.uid()` resolves to `sub`.
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

/** Resolved asymmetric signing strategy. */
export interface SigningConfig {
  keyId?: string;
  privateJwk: JWK;
  alg: string;
  /** Key used to sign. */
  signKey: CryptoKey | Uint8Array;
  /** Key used to verify (the derived public key). */
  verifyKey: CryptoKey | Uint8Array;
}

function inferAlg(jwk: JWK): string {
  const kty = (jwk.kty || "").toUpperCase();
  if (kty === "EC") {
    switch ((jwk.crv || "").toUpperCase()) {
      case "P-384":
        return "ES384";
      case "P-521":
        return "ES512";
      default:
        return "ES256";
    }
  }
  if (kty === "RSA") return "RS256";
  if (kty === "OKP") return "EdDSA";
  return "ES256";
}

/**
 * Resolve the signing config from `JWT_PRIVATE_JWK` (asymmetric ECC/RSA private
 * key). `JWT_KEY_ID` is attached as the token `kid` when present.
 * Returns null when no key is configured.
 */
export async function getSigningConfig(env: Env): Promise<SigningConfig | null> {
  const jwkRaw = await resolveSecret(env.JWT_PRIVATE_JWK);
  if (!jwkRaw) return null;

  // Strip fields (`key_ops`, `use`) that WebCrypto validates strictly — jose
  // picks the correct key usages from `alg`, and exported JWKs can include
  // these in a way that conflicts.
  const priv = Object.fromEntries(
    Object.entries(JSON.parse(jwkRaw) as JWK).filter(
      ([k]) => k !== "key_ops" && k !== "use"
    )
  ) as JWK;
  const alg = (priv.alg as string) || inferAlg(priv);
  // Public JWK = private JWK minus the private scalar `d`.
  const publicJwk = Object.fromEntries(
    Object.entries(priv).filter(([k]) => k !== "d")
  ) as JWK;
  const signKey = (await importJWK(priv, alg)) as CryptoKey | Uint8Array;
  const verifyKey = (await importJWK(publicJwk, alg)) as CryptoKey | Uint8Array;

  return { keyId: env.JWT_KEY_ID, privateJwk: priv, alg, signKey, verifyKey };
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

  jwt.setProtectedHeader(
    config.keyId ? { alg: config.alg, kid: config.keyId } : { alg: config.alg }
  );

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