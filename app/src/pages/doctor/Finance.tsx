import { useEffect, useState, FormEvent } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "../../lib/api";
import { formatINR } from "../../lib/format";
import MonthYearFilter, { CURRENT_YEAR } from "../../components/MonthYearFilter";
import ScrollReveal from "../../components/ScrollReveal";

interface Category {
  id: string;
  name: string;
}

interface Pnl {
  sales_from_sessions: number;
  misc_income: number;
  total_income: number;
  expenses_by_category: Array<{ category: string; total: number }>;
  total_expenses: number;
  net_profit: number;
}

const PIE_COLORS = ["#246B5F", "#2F8576", "#D4733A", "#10B981", "#0369A1", "#647478", "#B45309", "#BE123C"];

export default function DoctorFinance() {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [pnl, setPnl] = useState<Pnl | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expCategory, setExpCategory] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [savingExp, setSavingExp] = useState(false);

  const [incAmount, setIncAmount] = useState("");
  const [incDate, setIncDate] = useState(new Date().toISOString().slice(0, 10));
  const [incSource, setIncSource] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [savingInc, setSavingInc] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pnlRes, catRes] = await Promise.all([
        api.finance.pnl(month, year),
        api.finance.categories(),
      ]);
      setPnl(pnlRes as Pnl);
      setCategories((catRes as { categories: Category[] }).categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load finance data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAddExpense(e: FormEvent) {
    e.preventDefault();
    setSavingExp(true);
    try {
      await api.finance.createExpense({
        amount: Number(expAmount),
        category_id: expCategory || null,
        expense_date: expDate || undefined,
        description: expDesc || undefined,
      });
      setExpAmount("");
      setExpDesc("");
      flash("Expense recorded.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense");
    } finally {
      setSavingExp(false);
    }
  }

  async function handleAddIncome(e: FormEvent) {
    e.preventDefault();
    setSavingInc(true);
    try {
      await api.finance.createIncome({
        amount: Number(incAmount),
        source: incSource || undefined,
        income_date: incDate || undefined,
        description: incDesc || undefined,
      });
      setIncAmount("");
      setIncSource("");
      setIncDesc("");
      flash("Income recorded.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save income");
    } finally {
      setSavingInc(false);
    }
  }

  async function handleNewCategory(e: FormEvent) {
    e.preventDefault();
    try {
      const res = (await api.finance.createCategory(newCatName.trim())) as { category: Category };
      setCategories((prev) => [...prev, res.category].sort((a, b) => a.name.localeCompare(b.name)));
      setExpCategory(res.category.id);
      setNewCatName("");
      setShowNewCat(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category");
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await api.finance.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      flash("Category removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete category");
    }
  }

  const netColor = (pnl?.net_profit ?? 0) >= 0 ? "var(--color-success)" : "var(--color-danger)";
  const pieData = (pnl?.expenses_by_category ?? []).map((e) => ({ name: e.category, value: e.total }));

  return (
    <div style={{ maxWidth: 960 }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "var(--color-ink)",
            color: "#FFF",
            padding: "12px 20px",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-lg)",
            fontSize: 14,
          }}
        >
          ✓ {toast}
        </div>
      )}

      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 8 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Practice Finance
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 4 }}>Profit & Loss</h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Session fees (from paid appointments), manual income, and expenses — Indian Rupees. Doctor eyes only.
          </p>
        </div>
      </ScrollReveal>

      <MonthYearFilter month={month} year={year} onMonth={setMonth} onYear={setYear} />

      {error && (
        <div style={{ padding: "12px 16px", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "var(--radius-xs)", marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Loading P&L…</p>
      ) : (
        <>
          {/* P&L summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Total Income</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-brand-teal)" }}>
                {formatINR(pnl?.total_income)}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>
                Sessions {formatINR(pnl?.sales_from_sessions)} · Misc {formatINR(pnl?.misc_income)}
              </div>
            </div>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Total Expenses</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-ink)" }}>
                {formatINR(pnl?.total_expenses)}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>By category, below</div>
            </div>
            <div className="card" style={{ padding: "18px 20px", borderColor: netColor }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Net Profit / Loss</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: netColor }}>
                {formatINR(pnl?.net_profit)}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>
                {(pnl?.net_profit ?? 0) >= 0 ? "Above break-even" : "Below break-even"}
              </div>
            </div>
          </div>

          {/* Expense breakdown: table + pie chart */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 24, marginBottom: 32 }}>
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Expenses by category</h3>
              {(pnl?.expenses_by_category.length ?? 0) === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0 }}>No expenses in this period.</p>
              ) : (
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--color-ink-faint)", fontSize: 12 }}>
                      <th style={{ padding: "6px 0" }}>Category</th>
                      <th style={{ padding: "6px 0", textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pnl?.expenses_by_category.map((e) => (
                      <tr key={e.category} style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "8px 0" }}>{e.category}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>{formatINR(e.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Expense mix</h3>
              {pieData.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0 }}>Nothing to chart yet.</p>
              ) : (
                <div style={{ height: 240, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label={false}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => formatINR(Number(v))}
                        contentStyle={{
                          background: "rgba(255, 255, 255, 0.95)",
                          borderRadius: 8,
                          border: "1px solid #E3E8E7",
                          boxShadow: "0 4px 12px rgba(17,26,28,0.08)",
                          fontSize: 13,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add expense / income forms */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Add expense</h3>
          <form onSubmit={handleAddExpense} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Amount (₹)</label>
                <input type="number" min={1} step="any" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required />
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <label>Category</label>
              <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {!showNewCat ? (
              <button className="btn btn-ghost" type="button" onClick={() => setShowNewCat(true)} style={{ fontSize: 13, justifyContent: "flex-start", padding: "4px 0" }}>
                + New category…
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNewCategory(e as unknown as FormEvent);
                    }
                  }}
                  placeholder="Category name"
                />
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={(e) => handleNewCategory(e as unknown as FormEvent)}
                  style={{ fontSize: 12, whiteSpace: "nowrap" }}
                >
                  Save
                </button>
              </div>
            )}
            <div>
              <label>Description</label>
              <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Optional note" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={savingExp} style={{ justifyContent: "center" }}>
              {savingExp ? "Saving…" : "Record expense"}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Add misc income</h3>
          <p style={{ fontSize: 12, color: "var(--color-ink-muted)", marginBottom: 14 }}>
            For income not tied to a booking (walk-ins, products sold). Session fees are captured by marking
            appointments as paid — that total is shown above, not entered here.
          </p>
          <form onSubmit={handleAddIncome} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Amount (₹)</label>
                <input type="number" min={1} step="any" value={incAmount} onChange={(e) => setIncAmount(e.target.value)} required />
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={incDate} onChange={(e) => setIncDate(e.target.value)} required />
              </div>
            </div>
            <div>
              <label>Source</label>
              <input value={incSource} onChange={(e) => setIncSource(e.target.value)} placeholder="e.g. Walk-in, product" />
            </div>
            <div>
              <label>Description</label>
              <input value={incDesc} onChange={(e) => setIncDesc(e.target.value)} placeholder="Optional note" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={savingInc} style={{ justifyContent: "center" }}>
              {savingInc ? "Saving…" : "Record income"}
            </button>
          </form>
        </div>
      </div>

      {/* Manage categories */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Manage categories</h3>
        {categories.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0 }}>No categories yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
              <span key={c.id} className="badge" style={{ fontSize: 13, padding: "6px 10px 6px 14px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                {c.name}
                <button
                  aria-label={`Delete category ${c.name}`}
                  onClick={() => handleDeleteCategory(c.id)}
                  style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}
                  title="Delete category"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}