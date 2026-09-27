import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import type { AppUser } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

const SITE_URL = "https://telerehab-app.pages.dev";

function toWhatsAppDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function buildLoginWhatsAppLink(name: string, email: string, password: string, phone: string): string {
  const message =
    `Hi ${name}, your Neuro TeleRehab account is ready. ` +
    `Log in at ${SITE_URL} with ${email} and this temporary password: ${password}. ` +
    `You'll be asked to set your own password on first login.`;
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`;
}

export default function DoctorPatientList() {
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; email: string; phone: string; password: string } | null>(null);

  async function loadPatients() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role", "patient")
      .order("created_at", { ascending: false });
    setPatients((data as AppUser[]) ?? []);
  }

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .eq("role", "patient")
      .then(({ data }) => {
        setPatients((data as AppUser[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );

  async function handleAddPatient(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      const res = (await api.doctor.createPatient({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      })) as { user: AppUser; temp_password: string };
      setCreated({
        name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: res.temp_password,
      });
      setForm({ full_name: "", email: "", phone: "" });
      await loadPatients();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create patient");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ maxWidth: 920 }}>
      {/* Header */}
      <ScrollReveal from="subtle-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div className="badge badge-scheduled" style={{ marginBottom: 8 }}>
              <span className="badge-dot" /> Clinical Roster
            </div>
            <h1 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 4 }}>
              Patient Directory
            </h1>
            <p style={{ color: "var(--color-ink-muted)", fontSize: 15, margin: 0 }}>
              Access full clinical profiles, session histories, assigned therapy exercises, and notes.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); setCreated(null); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add patient
          </button>
        </div>
      </ScrollReveal>

      {/* Add patient form */}
      {showAdd && (
        <ScrollReveal from="up">
          <div className="card" style={{ marginBottom: 24, border: "1px solid var(--color-border-glow)" }}>
            <h3 style={{ fontSize: 17, marginBottom: 6 }}>Create a Patient Account</h3>
            <p style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 16 }}>
              Generates a temporary password you can deliver via WhatsApp. The patient sets their own password on first login.
            </p>

            {created ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: "14px 16px", background: "var(--color-success-bg)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(21,128,61,0.2)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-success)", marginBottom: 6 }}>
                    Account created for {created.name}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-ink-secondary)" }}>
                    Email: <strong>{created.email}</strong><br />
                    Temporary password: <strong style={{ fontFamily: "monospace" }}>{created.password}</strong>
                  </div>
                </div>
                {created.phone ? (
                  <a
                    className="btn"
                    href={buildLoginWhatsAppLink(created.name, created.email, created.password, created.phone)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: "#E8F8EE", color: "#1E7E34", borderColor: "#C3E6CB", justifyContent: "center" }}
                  >
                    Send login details via WhatsApp
                  </a>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--color-warning)" }}>
                    No phone number provided — share the password manually.
                  </div>
                )}
                <button className="btn btn-outline" onClick={() => { setCreated(null); setShowAdd(false); }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddPatient} style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
                  <div>
                    <label>Full name</label>
                    <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div>
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div>
                    <label>Phone (for WhatsApp)</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
                  </div>
                </div>

                {formError && (
                  <div style={{ padding: "8px 12px", background: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: 12, borderRadius: 6 }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={creating}>
                    {creating ? "Creating…" : "Create account"}
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => setShowAdd(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20, maxWidth: 360 }}>
        <input
          type="text"
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ borderRadius: "var(--radius-pill)", padding: "8px 16px" }}
        />
      </div>

      {/* Patient Grid */}
      {loading ? (
        <p style={{ color: "var(--color-ink-muted)" }}>Loading patient records…</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--color-ink-muted)", margin: 0 }}>
            {search ? "No patients matching your search criteria." : "No registered patients found."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 16 }}>
          {filtered.map((p, i) => (
            <ScrollReveal key={p.id} from="up" delay={i * 50}>
              <Link
                to={`/doctor/patients/${p.id}`}
                className="card card-interactive"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "20px",
                  textDecoration: "none",
                  color: "inherit",
                  height: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "var(--color-brand-teal-glaze)",
                      color: "var(--color-brand-teal)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {p.full_name ? p.full_name.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>
                      {p.full_name}
                    </div>
                    <span className="badge badge-scheduled" style={{ fontSize: 11, padding: "1px 8px" }}>
                      Active Patient
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 4, fontSize: 13, color: "var(--color-ink-muted)", marginTop: "auto" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    ✉️ {p.email}
                  </div>
                  {p.phone && <div>📞 {p.phone}</div>}
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--color-brand-teal)", fontWeight: 500 }}>
                  <span>Open Clinical Profile</span>
                  <span>→</span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}