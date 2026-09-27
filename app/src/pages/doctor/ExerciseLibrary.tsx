import { useEffect, useState, FormEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import type { Exercise } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

const emptyForm = {
  title: "",
  description: "",
  video_url: "",
  default_sets: "",
  default_reps: "",
};

export default function DoctorExerciseLibrary() {
  const { profile } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    try {
      const [{ data: ex }, { data: pe }] = await Promise.all([
        supabase.from("exercises").select("*").order("created_at", { ascending: false }),
        supabase.from("patient_exercises").select("exercise_id"),
      ]);
      setExercises((ex as Exercise[]) ?? []);

      const counts: Record<string, number> = {};
      ((pe as { exercise_id: string }[]) ?? []).forEach((row) => {
        counts[row.exercise_id] = (counts[row.exercise_id] ?? 0) + 1;
      });
      setAssignedCounts(counts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        video_url: form.video_url.trim() || null,
        default_sets: form.default_sets ? Number(form.default_sets) : null,
        default_reps: form.default_reps ? Number(form.default_reps) : null,
      };

      if (editingId) {
        const { error: err } = await supabase.from("exercises").update(payload).eq("id", editingId);
        if (err) throw new Error(err.message);
        setToast("Exercise updated.");
      } else {
        const { error: err } = await supabase.from("exercises").insert({ ...payload, created_by: profile.id });
        if (err) throw new Error(err.message);
        setToast("Exercise added to the library.");
      }
      setTimeout(() => setToast(null), 3500);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save exercise");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(ex: Exercise) {
    setEditingId(ex.id);
    setForm({
      title: ex.title,
      description: ex.description ?? "",
      video_url: ex.video_url ?? "",
      default_sets: ex.default_sets != null ? String(ex.default_sets) : "",
      default_reps: ex.default_reps != null ? String(ex.default_reps) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(ex: Exercise) {
    const count = assignedCounts[ex.id] ?? 0;
    if (count > 0) return; // guarded by disabled button, defensive only
    if (!confirm(`Delete "${ex.title}" from the library? This cannot be undone.`)) return;
    const { error: err } = await supabase.from("exercises").delete().eq("id", ex.id);
    if (err) {
      setError(err.message);
      return;
    }
    setToast("Exercise removed.");
    setTimeout(() => setToast(null), 3500);
    await load();
  }

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
        <div style={{ marginBottom: 28 }}>
          <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
            <span className="badge-dot" /> Clinical Content
          </div>
          <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 4 }}>Exercise Library</h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
            Author and manage the master exercise library. Assign movements to patients from their profile page.
          </p>
        </div>
      </ScrollReveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 28 }}>
        {/* Add / edit form */}
        <ScrollReveal from="up">
          <div className="card" style={{ height: "fit-content" }}>
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>
              {editingId ? "Edit Exercise" : "Add New Exercise"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Seated knee extension"
                  required
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Form cues, contraindications, progressions…"
                />
              </div>
              <div>
                <label>Video URL</label>
                <input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label>Default Sets</label>
                  <input
                    type="number"
                    min={1}
                    value={form.default_sets}
                    onChange={(e) => setForm({ ...form, default_sets: e.target.value })}
                  />
                </div>
                <div>
                  <label>Default Reps</label>
                  <input
                    type="number"
                    min={1}
                    value={form.default_reps}
                    onChange={(e) => setForm({ ...form, default_reps: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: "8px 12px", background: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: 12, borderRadius: 6 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: "1 1 auto" }}>
                  {saving ? "Saving…" : editingId ? "Update Exercise" : "+ Add Exercise"}
                </button>
                {editingId && (
                  <button className="btn btn-outline" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </ScrollReveal>

        {/* Existing exercises */}
        <ScrollReveal from="up" delay={100}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 19, margin: 0 }}>Library</h2>
              <span className="badge">{exercises.length} exercises</span>
            </div>

            {loading ? (
              <p style={{ color: "var(--color-ink-muted)" }}>Loading library…</p>
            ) : exercises.length === 0 ? (
              <div className="card" style={{ padding: 28, textAlign: "center" }}>
                <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
                  No exercises yet. Add your first exercise using the form.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {exercises.map((ex) => {
                  const assigned = assignedCounts[ex.id] ?? 0;
                  return (
                    <div key={ex.id} className="card" style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>{ex.title}</div>
                          {ex.description && (
                            <div style={{ fontSize: 13, color: "var(--color-ink-muted)", marginTop: 4 }}>{ex.description}</div>
                          )}
                          <div style={{ fontSize: 12, color: "var(--color-ink-faint)", marginTop: 6 }}>
                            {ex.default_sets != null ? `${ex.default_sets} sets` : "—"} ×{" "}
                            {ex.default_reps != null ? `${ex.default_reps} reps` : "—"}
                            {assigned > 0 && ` · assigned to ${assigned} patient(s)`}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => startEdit(ex)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => handleDelete(ex)}
                            disabled={assigned > 0}
                            title={assigned > 0 ? "Cannot delete: this exercise is assigned to patients" : "Delete exercise"}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}