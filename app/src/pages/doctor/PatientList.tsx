import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import type { AppUser } from "../../types/db";

export default function DoctorPatientList() {
  const [patients, setPatients] = useState<AppUser[]>([]);

  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .eq("role", "patient")
      .then(({ data }) => setPatients((data as AppUser[]) ?? []));
  }, []);

  return (
    <div>
      <h1>Patients</h1>
      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        {patients.map((p) => (
          <Link
            key={p.id}
            to={`/doctor/patients/${p.id}`}
            className="card"
            style={{ display: "block", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ fontWeight: 600 }}>{p.full_name}</div>
            <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>{p.email}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
