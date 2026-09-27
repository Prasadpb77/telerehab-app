import { Hono } from "hono";
import type { Env } from "../env";
import { requireAuth, requireRole } from "../auth";
import { getSupabaseAdmin } from "../supabaseAdmin";

export const insights = new Hono<{ Bindings: Env }>();

// Doctor-only analytics for the single practice. There is no
// patient-facing view for any of this data.
insights.use("*", requireAuth);
insights.use("*", requireRole("doctor"));

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Month window: always 12 full calendar months ending at the selected
// month (or the current month when none is selected). The trend series
// intentionally ignores the Features-2-style period filter — the filter
// applies only to the period-scoped metrics below.
function trendMonths(month?: string, year?: string): Array<{ key: string; label: string; from: string; to: string }> {
  const now = new Date();
  const endYear = year ? Number(year) : now.getUTCFullYear();
  // month query param is 1-12; Date.UTC month index is endMonth (exclusive end).
  const endMonth = month ? Number(month) + 1 : year ? 12 : now.getUTCMonth() + 1;

  const safeYear = Number.isFinite(endYear) ? endYear : now.getUTCFullYear();
  // Clamp the "month" arithmetic to a valid exclusive-end index.
  const rawEnd = Number.isFinite(endMonth) ? endMonth : 12;
  const endIdx = Math.min(12, Math.max(1, rawEnd));

  const out: Array<{ key: string; label: string; from: string; to: string }> = [];
  for (let i = 11; i >= 0; i--) {
    const total = safeYear * 12 + (endIdx - 1) - i;
    const y = Math.floor(total / 12);
    const m = total % 12;
    const from = new Date(Date.UTC(y, m, 1));
    const to = new Date(Date.UTC(y, m + 1, 1));
    out.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: from.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
      from: from.toISOString(),
      to: to.toISOString(),
    });
  }
  return out;
}

function periodBounds(month?: string, year?: string): { from: string; to: string } | null {
  if (!year) return null;
  const y = Number(year);
  if (!Number.isFinite(y)) return null;
  if (month) {
    const m = Number(month);
    if (!Number.isFinite(m) || m < 1 || m > 12) return null;
    return {
      from: new Date(Date.UTC(y, m - 1, 1)).toISOString(),
      to: new Date(Date.UTC(y, m, 1)).toISOString(),
    };
  }
  return {
    from: new Date(Date.UTC(y, 0, 1)).toISOString(),
    to: new Date(Date.UTC(y + 1, 0, 1)).toISOString(),
  };
}

insights.get("/summary", async (c) => {
  const month = c.req.query("month");
  const year = c.req.query("year");
  const bounds = periodBounds(month, year);
  if (!bounds) return c.json({ error: "year is required (month optional)" }, 400);

  const months = trendMonths(month, year);
  const windowStart = months[0].from;
  const supabase = await getSupabaseAdmin(c.env);

  const [{ data: apptRows, error: apptErr }, { data: userRows, error: userErr }] = await Promise.all([
    supabase
      .from("appointments")
      .select("starts_at, status, patient_id, payment_amount, payment_status, users!appointments_patient_id_fkey(patients(area, therapy_type))")
      .gte("starts_at", windowStart)
      .order("starts_at", { ascending: true }),
    supabase
      .from("users")
      .select("created_at")
      .eq("role", "patient")
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true }),
  ]);
  if (apptErr || userErr) {
    return c.json({ error: (apptErr ?? userErr)?.message ?? "Query failed" }, 500);
  }

  const appts = (apptRows ?? []) as Array<{
    starts_at: string;
    status: string;
    patient_id: string;
    payment_amount?: unknown;
    payment_status?: string;
    users?: { patients?: { area?: string | null; therapy_type?: string | null } | null } | null;
  }>;

  // --- 12-month trend series (bounding choice: 12 full calendar months
  // ending at the selected month, or at the current month when no month
  // is selected) ---
  const sessions_by_month = months.map((m) =>
    appts.filter(
      (a) =>
        (a.status === "scheduled" || a.status === "completed") &&
        a.starts_at >= m.from &&
        a.starts_at < m.to
    ).length
  ).map((count, i) => ({ month: months[i].key, label: months[i].label, count }));

  const revenue_by_month = months.map((m) =>
    appts
      .filter((a) => a.payment_status === "paid" && a.starts_at >= m.from && a.starts_at < m.to)
      .reduce((s, a) => s + toNum(a.payment_amount), 0)
  ).map((revenue, i) => ({ month: months[i].key, label: months[i].label, revenue }));

  const new_patients_by_month = months.map((m) =>
    ((userRows ?? []) as Array<{ created_at: string }>).filter(
      (u) => u.created_at >= m.from && u.created_at < m.to
    ).length
  ).map((count, i) => ({ month: months[i].key, label: months[i].label, count }));

  // --- Period-scoped metrics (respect the shared month/year filter) ---
  const inPeriod = appts.filter((a) => a.starts_at >= bounds.from && a.starts_at < bounds.to);

  const areaCounts = new Map<string, number>();
  const therapyCounts = new Map<string, number>();
  for (const a of inPeriod) {
    const area = a.users?.patients?.area?.trim() || "Unspecified";
    const therapy = a.users?.patients?.therapy_type?.trim() || "Unspecified";
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
    therapyCounts.set(therapy, (therapyCounts.get(therapy) ?? 0) + 1);
  }
  const sessions_by_area = [...areaCounts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);
  const sessions_by_therapy_type = [...therapyCounts.entries()]
    .map(([therapy_type, count]) => ({ therapy_type, count }))
    .sort((a, b) => b.count - a.count);

  const total = inPeriod.length;
  const cancelled = inPeriod.filter((a) => a.status === "cancelled").length;
  const noShows = inPeriod.filter((a) => a.status === "no_show").length;
  const cancellation_rate = total === 0 ? 0 : Math.round((cancelled / total) * 1000) / 10;
  const no_show_rate = total === 0 ? 0 : Math.round((noShows / total) * 1000) / 10;

  const completedInPeriod = inPeriod.filter((a) => a.status === "completed");
  const distinctPatients = new Set(completedInPeriod.map((a) => a.patient_id));
  const avg_sessions_per_patient =
    distinctPatients.size === 0
      ? 0
      : Math.round((completedInPeriod.length / distinctPatients.size) * 10) / 10;

  return c.json({
    sessions_by_month,
    sessions_by_area,
    sessions_by_therapy_type,
    new_patients_by_month,
    cancellation_rate,
    no_show_rate,
    avg_sessions_per_patient,
    revenue_by_month,
  });
});