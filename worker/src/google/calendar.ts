import type { Env } from "../env";
import { getGoogleAccessToken } from "./oauth";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface CalendarEventResult {
  googleEventId: string;
  meetUrl: string | null;
}

/**
 * Creates a Calendar event with conferenceData set to auto-generate a Google
 * Meet link. requestId must be unique per logical appointment so retried
 * requests are idempotent at Google's end (Calendar dedupes on requestId).
 */
export async function createCalendarEventWithMeet(
  env: Env,
  params: {
    requestId: string; // use appointment.id (uuid) — guarantees idempotency
    summary: string;
    description?: string;
    startIso: string;
    endIso: string;
    attendeeEmails: string[];
  }
): Promise<CalendarEventResult> {
  const accessToken = await getGoogleAccessToken(env);

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(
      env.GOOGLE_CALENDAR_ID
    )}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description ?? "",
        start: { dateTime: params.startIso },
        end: { dateTime: params.endIso },
        attendees: params.attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: params.requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendar create failed: ${res.status} ${body}`);
  }

  const event = (await res.json()) as any;
  const meetUrl =
    event.conferenceData?.entryPoints?.find(
      (e: any) => e.entryPointType === "video"
    )?.uri ?? event.hangoutLink ?? null;

  return { googleEventId: event.id, meetUrl };
}

export async function updateCalendarEvent(
  env: Env,
  googleEventId: string,
  params: { summary?: string; startIso?: string; endIso?: string }
): Promise<void> {
  const accessToken = await getGoogleAccessToken(env);
  const patch: Record<string, unknown> = {};
  if (params.summary) patch.summary = params.summary;
  if (params.startIso) patch.start = { dateTime: params.startIso };
  if (params.endIso) patch.end = { dateTime: params.endIso };

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(
      env.GOOGLE_CALENDAR_ID
    )}/events/${googleEventId}?sendUpdates=all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendar update failed: ${res.status} ${body}`);
  }
}

export async function cancelCalendarEvent(
  env: Env,
  googleEventId: string
): Promise<void> {
  const accessToken = await getGoogleAccessToken(env);
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(
      env.GOOGLE_CALENDAR_ID
    )}/events/${googleEventId}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // 410 Gone means it's already deleted — treat as success (idempotent cancel).
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Calendar cancel failed: ${res.status} ${body}`);
  }
}
