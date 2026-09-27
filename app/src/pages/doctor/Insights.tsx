import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { api } from "../../lib/api";
import { formatINR } from "../../lib/format";
import MonthYearFilter, { CURRENT_YEAR } from "../../components/MonthYearFilter";
import ScrollReveal from "../../components/ScrollReveal";

interface MonthPoint {
  month: string;
  label: string;
  count: number;
}

interface RevenuePoint {
  month: string;
  label: string;
  revenue: number;
}

interface Summary {
  sessions_by_month: MonthPoint[];
  sessions_by_area: Array<{ area: string; count: number }>;
  sessions_by_therapy_type: Array<{ therapy_type: string; count: number }>;
  new_patients_by_month: MonthPoint[];
  cancellation_rate: number;
  no_show_rate: number;
  avg_sessions_per_patient: number;
  revenue_by_month: RevenuePoint[];
}

const CHART_BAR = "#246B5F";
const CHART_TEAL = "#2F8576";
const CHART_ACCENT = "#D4733A";
const CHART_GREEN = "#10B981";
const PIE_COLORS = ["#246B5F", "#2F8576", "#D4733A", "#10B981", "#0369A1", "#647478", "#B45309", "#BE123C"];

const tooltipStyle = {
  background: "rgba(255, 255, 255, 0.95)",
  borderRadius: 8,
  border: "1px solid #E3E8E7",
  boxShadow: "0 4px 12px rgba(17,26,28,0.08)",
  fontSize: 13,
};

function ChartShell({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
        <h3 style={{ fontSize: 16, margin: 0 }}>{title}</h3>
        {hint && <span style={{ fontSize: 11, color: "var(--color-ink-faint)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function DoctorInsights() {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.insights
      .summary(month, year)
      .then((res) => {
        setSummary(res as Summary);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load insights");
        setLoading(false);
      });
  }, [month, year]);

  return (
    <div style={{ maxWidth: 1080 }}>
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 8 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Practice Analytics
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 4 }}>Insights</h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Where patients come from, what is treated most, and how the practice is trending. Doctor eyes only.
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
        <p style={{ color: "var(--color-ink-muted)" }}>Loading insights…</p>
      ) : summary ? (
        <>
          {/* Stat cards for the selected period */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Cancellation rate</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-brand-accent)" }}>
                {summary.cancellation_rate}%
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>Cancelled ÷ all in period</div>
            </div>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>No-show rate</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-danger)" }}>
                {summary.no_show_rate}%
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>No-show ÷ all in period</div>
            </div>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Avg sessions / patient</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-brand-teal)" }}>
                {summary.avg_sessions_per_patient}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 2 }}>Completed sessions in period</div>
            </div>
          </div>

          {/* Trend charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 24, marginBottom: 24 }}>
            <ChartShell title="Sessions by month" hint="12-month trend">
              <div style={{ height: 260, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.sessions_by_month} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAEBE8" vertical={false} />
                    <XAxis dataKey="label" fontSize={11} stroke="#8C9B9E" tickLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} stroke="#8C9B9E" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Sessions" fill={CHART_BAR} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>

            <ChartShell title="Revenue by month" hint="Paid sessions, 12-month trend">
              <div style={{ height: 260, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.revenue_by_month} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAEBE8" vertical={false} />
                    <XAxis dataKey="label" fontSize={11} stroke="#8C9B9E" tickLine={false} />
                    <YAxis
                      fontSize={12}
                      stroke="#8C9B9E"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : v}`}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatINR(Number(v))} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_GREEN} strokeWidth={2.5} dot={{ r: 3, fill: CHART_GREEN }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 24, marginBottom: 24 }}>
            <ChartShell title="New patients by month" hint="Signups, 12-month trend">
              <div style={{ height: 240, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.new_patients_by_month} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAEBE8" vertical={false} />
                    <XAxis dataKey="label" fontSize={11} stroke="#8C9B9E" tickLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} stroke="#8C9B9E" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="count" name="New patients" stroke={CHART_ACCENT} strokeWidth={2.5} dot={{ r: 3, fill: CHART_ACCENT }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>

            <ChartShell title="Sessions by area" hint="Selected period">
              {summary.sessions_by_area.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0 }}>No sessions in this period.</p>
              ) : (
                <div style={{ height: 240, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.sessions_by_area} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAEBE8" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} fontSize={12} stroke="#8C9B9E" tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="area" width={110} fontSize={11} stroke="#8C9B9E" tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Sessions" fill={CHART_TEAL} radius={[0, 4, 4, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartShell>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 24 }}>
            <ChartShell title="Sessions by therapy type" hint="Selected period">
              {summary.sessions_by_therapy_type.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0 }}>No sessions in this period.</p>
              ) : (
                <div style={{ height: 260, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.sessions_by_therapy_type.map((t) => ({ name: t.therapy_type, value: t.count }))}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={95}
                        label={false}
                      >
                        {summary.sessions_by_therapy_type.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartShell>

            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: 16, marginBottom: 10 }}>About "Unspecified"</h3>
              <p style={{ fontSize: 13, color: "var(--color-ink-secondary)", lineHeight: 1.6, marginBottom: 10 }}>
                Patients whose Area or Therapy type hasn't been filled in are counted under <strong>"Unspecified"</strong>
                rather than being dropped from the totals — this keeps session counts honest.
              </p>
              <p style={{ fontSize: 13, color: "var(--color-ink-secondary)", lineHeight: 1.6, margin: 0 }}>
                To improve these charts, open a patient profile and set their Area and Therapy type using the
                "Patient Details" card.
              </p>
            </div>
          </div>
        </>
      ) : (
        !error && <p style={{ color: "var(--color-ink-muted)" }}>No data yet.</p>
      )}
    </div>
  );
}