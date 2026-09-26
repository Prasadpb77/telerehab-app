import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { ProgressEntry } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

export default function PatientProgress() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("progress")
      .select("*")
      .eq("patient_id", profile.id)
      .order("log_date", { ascending: true })
      .then(({ data }) => {
        setEntries((data as ProgressEntry[]) ?? []);
        setLoading(false);
      });
  }, [profile]);

  const chartData = entries.map((e) => ({
    date: new Date(e.log_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    pain: e.pain_score,
    difficulty: e.difficulty_score,
  }));

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  return (
    <div style={{ maxWidth: 880 }}>
      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Quantitative Biometrics
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.4vw, 32px)", marginBottom: 6 }}>
            Recovery Trajectory & Metrics
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Visualise your self-reported pain scores and exercise difficulty metrics over time to measure clinical progress.
          </p>
        </div>
      </ScrollReveal>

      {/* Snapshot Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <ScrollReveal from="up" delay={50}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Total Sessions Logged</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, color: "var(--color-brand-teal)" }}>
              {entries.length}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 4 }}>Completed activity records</div>
          </div>
        </ScrollReveal>

        <ScrollReveal from="up" delay={100}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Recent Pain Level (0-10)</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, color: "var(--color-danger)" }}>
              {latestEntry?.pain_score !== undefined && latestEntry?.pain_score !== null ? latestEntry.pain_score : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 4 }}>Latest reported intensity</div>
          </div>
        </ScrollReveal>

        <ScrollReveal from="up" delay={150}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 4 }}>Recent Difficulty (0-10)</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, color: "var(--color-brand-accent)" }}>
              {latestEntry?.difficulty_score !== undefined && latestEntry?.difficulty_score !== null ? latestEntry.difficulty_score : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 4 }}>Movement exertion load</div>
          </div>
        </ScrollReveal>
      </div>

      {/* Chart Canvas */}
      <ScrollReveal from="up" delay={200}>
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, margin: 0 }}>Symptom & Exertion Trend</h3>
            <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>VAS Scale: 0 (None) to 10 (Severe)</span>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>Loading biometric trend…</p>
          ) : chartData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📈</div>
              <p style={{ color: "var(--color-ink)", fontWeight: 500, marginBottom: 4 }}>No activity data logged yet</p>
              <p style={{ color: "var(--color-ink-muted)", fontSize: 13 }}>
                Mark your daily exercises as completed to populate your recovery curve.
              </p>
            </div>
          ) : (
            <div style={{ height: 320, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAEBE8" vertical={false} />
                  <XAxis dataKey="date" fontSize={12} stroke="#8C9B9E" tickLine={false} />
                  <YAxis domain={[0, 10]} fontSize={12} stroke="#8C9B9E" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.95)",
                      borderRadius: 8,
                      border: "1px solid #E3E8E7",
                      boxShadow: "0 4px 12px rgba(17,26,28,0.08)",
                      fontSize: 13,
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 14, fontSize: 13 }} />
                  <Line
                    type="monotone"
                    dataKey="pain"
                    stroke="#BE123C"
                    name="Pain Score"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#BE123C" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="difficulty"
                    stroke="#D4733A"
                    name="Difficulty Score"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#D4733A" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
