import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { ProgressEntry } from "../../types/db";

export default function PatientProgress() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("progress")
      .select("*")
      .eq("patient_id", profile.id)
      .order("log_date", { ascending: true })
      .then(({ data }) => setEntries((data as ProgressEntry[]) ?? []));
  }, [profile]);

  const chartData = entries.map((e) => ({
    date: new Date(e.log_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    pain: e.pain_score,
    difficulty: e.difficulty_score,
  }));

  return (
    <div>
      <h1>Your progress</h1>
      <div className="card" style={{ marginTop: 20, height: 320 }}>
        {chartData.length === 0 ? (
          <p style={{ color: "var(--color-ink-muted)" }}>Log a few exercises to see your trend here.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DED3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis domain={[0, 10]} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="pain" stroke="#B4483A" name="Pain" strokeWidth={2} />
              <Line type="monotone" dataKey="difficulty" stroke="#C97B4A" name="Difficulty" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
