import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import type { AppUser } from "../../types/db";
import ScrollReveal from "../../components/ScrollReveal";

export default function DoctorPatientList() {
  const [patients, setPatients] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

          <div style={{ width: 280 }}>
            <input
              type="text"
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: "var(--radius-pill)", padding: "8px 16px" }}
            />
          </div>
        </div>
      </ScrollReveal>

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
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
