import { Hono } from "hono";
import type { Env } from "../env";
import { requireAuth, requireRole } from "../auth";
import { getSupabaseAdmin } from "../supabaseAdmin";

export const finance = new Hono<{ Bindings: Env }>();

// Every route here is doctor-only. The financial tables are furthermore
// locked at the RLS level to is_doctor() with NO policy for any other role.
finance.use("*", requireAuth);
finance.use("*", requireRole("doctor"));

function periodBounds(month?: string, year?: string): { from: string; to: string } | null {
  if (!year) return null;
  const y = Number(year);
  if (!Number.isFinite(y)) return null;

  if (month) {
    const m = Number(month);
    if (!Number.isFinite(m) || m < 1 || m > 12) return null;
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));
    return { from: from.toISOString(), to: to.toISOString() };
  }
  return {
    from: new Date(Date.UTC(y, 0, 1)).toISOString(),
    to: new Date(Date.UTC(y + 1, 0, 1)).toISOString(),
  };
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Expense categories
// ---------------------------------------------------------------------------
finance.get("/categories", async (c) => {
  const supabase = await getSupabaseAdmin(c.env);
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ categories: data ?? [] });
});

finance.post("/categories", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  const name = body.name?.trim();
  if (!name) return c.json({ error: "name is required" }, 400);

  const supabase = await getSupabaseAdmin(c.env);

  // Friendly duplicate check on lower(name) so "Rent" vs "rent" never double
  // up as two categories instead of hitting the raw unique-index error.
  const { data: existing } = await supabase
    .from("expense_categories")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (existing) return c.json({ error: `Category "${existing ? name : ""}" already exists` }, 409);

  const { data, error } = await supabase
    .from("expense_categories")
    .insert({ name })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return c.json({ error: "This category already exists" }, 409);
    return c.json({ error: error.message }, 500);
  }
  return c.json({ category: data }, 201);
});

finance.delete("/categories/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = await getSupabaseAdmin(c.env);

  // Never let the raw FK violation reach the frontend.
  const { count } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0) {
    return c.json(
      { error: `This category can't be deleted because ${count} expense(s) use it. Move or delete those expenses first.` },
      409
    );
  }

  const { error } = await supabase.from("expense_categories").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
finance.get("/expenses", async (c) => {
  const month = c.req.query("month");
  const year = c.req.query("year");
  const supabase = await getSupabaseAdmin(c.env);

  let query = supabase
    .from("expenses")
    .select("*, expense_categories(id, name)")
    .order("expense_date", { ascending: false });
  const bounds = periodBounds(month, year);
  if (bounds) {
    query = query.gte("expense_date", bounds.from.slice(0, 10)).lt("expense_date", bounds.to.slice(0, 10));
  }

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ expenses: data ?? [] });
});

finance.post("/expenses", async (c) => {
  const body = await c.req.json<{
    amount?: number;
    category_id?: string | null;
    expense_date?: string;
    description?: string;
  }>();
  const amount = toNum(body.amount);
  if (amount <= 0) return c.json({ error: "amount must be greater than 0" }, 400);

  const supabase = await getSupabaseAdmin(c.env);
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      amount,
      category_id: body.category_id ?? null,
      expense_date: body.expense_date ?? undefined,
      description: body.description?.trim() || null,
    })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ expense: data }, 201);
});

finance.delete("/expenses/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = await getSupabaseAdmin(c.env);
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// Misc (non-session) income
// ---------------------------------------------------------------------------
finance.get("/income", async (c) => {
  const month = c.req.query("month");
  const year = c.req.query("year");
  const supabase = await getSupabaseAdmin(c.env);

  let query = supabase.from("income_entries").select("*").order("income_date", { ascending: false });
  const bounds = periodBounds(month, year);
  if (bounds) {
    query = query.gte("income_date", bounds.from.slice(0, 10)).lt("income_date", bounds.to.slice(0, 10));
  }

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ income: data ?? [] });
});

finance.post("/income", async (c) => {
  const body = await c.req.json<{
    amount?: number;
    source?: string;
    income_date?: string;
    description?: string;
  }>();
  const amount = toNum(body.amount);
  if (amount <= 0) return c.json({ error: "amount must be greater than 0" }, 400);

  const supabase = await getSupabaseAdmin(c.env);
  const { data, error } = await supabase
    .from("income_entries")
    .insert({
      amount,
      source: body.source?.trim() || null,
      income_date: body.income_date ?? undefined,
      description: body.description?.trim() || null,
    })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ income: data }, 201);
});

finance.delete("/income/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = await getSupabaseAdmin(c.env);
  const { error } = await supabase.from("income_entries").delete().eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// P&L summary for a month or a whole year.
// sales_from_sessions reads the EXISTING appointments.payment_amount /
// payment_status columns only - nothing structural is changed here.
// ---------------------------------------------------------------------------
finance.get("/pnl", async (c) => {
  const month = c.req.query("month");
  const year = c.req.query("year");
  const bounds = periodBounds(month, year);
  if (!bounds) return c.json({ error: "year is required (month optional)" }, 400);

  const supabase = await getSupabaseAdmin(c.env);
  const fromDate = bounds.from.slice(0, 10);
  const toDate = bounds.to.slice(0, 10);

  const [{ data: paidAppts, error: apptErr }, { data: miscRows, error: miscErr }, { data: expRows, error: expErr }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("payment_amount")
        .eq("payment_status", "paid")
        .gte("starts_at", bounds.from)
        .lt("starts_at", bounds.to),
      supabase
        .from("income_entries")
        .select("amount")
        .gte("income_date", fromDate)
        .lt("income_date", toDate),
      supabase
        .from("expenses")
        .select("amount, expense_categories(id, name)")
        .gte("expense_date", fromDate)
        .lt("expense_date", toDate),
    ]);
  if (apptErr || miscErr || expErr) {
    return c.json({ error: (apptErr ?? miscErr ?? expErr)?.message ?? "Query failed" }, 500);
  }

  const sales_from_sessions = (paidAppts ?? []).reduce((s, r) => s + toNum((r as { payment_amount?: unknown }).payment_amount), 0);
  const misc_income = (miscRows ?? []).reduce((s, r) => s + toNum((r as { amount?: unknown }).amount), 0);
  const total_income = sales_from_sessions + misc_income;

  const byCategory = new Map<string, number>();
  for (const row of (expRows ?? []) as Array<{ amount?: unknown; expense_categories?: { name?: string } | null }>) {
    const label = row.expense_categories?.name ?? "Uncategorised";
    byCategory.set(label, (byCategory.get(label) ?? 0) + toNum(row.amount));
  }
  const expenses_by_category = [...byCategory.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  const total_expenses = expenses_by_category.reduce((s, r) => s + r.total, 0);

  return c.json({
    sales_from_sessions,
    misc_income,
    total_income,
    expenses_by_category,
    total_expenses,
    net_profit: total_income - total_expenses,
  });
});