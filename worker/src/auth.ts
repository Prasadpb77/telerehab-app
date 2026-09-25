import type { Context, Next } from "hono";
import type { Env, AuthedUser } from "./env";
import { verifyJwt, getSigningConfig } from "./crypto";

/**
 * Verifies the custom-issued JWT sent by the frontend (Authorization: Bearer
 * <token>), extracting the user id and role claims directly from the token.
 * Attaches the result to c.set("user", ...).
 *
 * All privileged routes require this; the Worker never trusts a client-supplied
 * role from the request body — only from the signed JWT.
 */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return c.json({ error: "Missing Authorization header" }, 401);

  try {
    const config = await getSigningConfig(c.env);
    if (!config) return c.json({ error: "Auth not configured" }, 500);

    const claims = await verifyJwt(token, config);

    const userId = claims.sub;
    const role = claims.user_role;
    const email = claims.email;
    if (!userId || (role !== "doctor" && role !== "patient")) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const user: AuthedUser = { id: userId, role, email: email ?? "" };
    c.set("user" as never, user as never);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

export function requireRole(role: "doctor" | "patient") {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get("user" as never) as AuthedUser;
    if (!user || user.role !== role) {
      return c.json({ error: `Requires ${role} role` }, 403);
    }
    await next();
  };
}