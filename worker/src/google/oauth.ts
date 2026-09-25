import { type Env, resolveSecret } from "../env";

/**
 * Exchanges the doctor's long-lived Google OAuth refresh token (obtained once
 * via a one-time consent flow when onboarding the practice's Google account)
 * for a short-lived access token. Refresh token + client secret are Worker
 * secrets only — never sent to or stored by the frontend.
 */
export async function getGoogleAccessToken(env: Env): Promise<string> {
  const clientId = await resolveSecret(env.GOOGLE_CLIENT_ID);
  const clientSecret = await resolveSecret(env.GOOGLE_CLIENT_SECRET);
  const refreshToken = await resolveSecret(env.GOOGLE_REFRESH_TOKEN);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}