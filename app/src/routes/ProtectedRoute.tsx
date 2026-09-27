import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/db";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role: UserRole;
}) {
  const { profile, loading } = useAuth();

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!profile) return <Navigate to="/login" replace />;

  // Forced first-login password change for doctor-created accounts: block
  // access to everything else until the password has been set.
  if (profile.must_change_password) {
    return <Navigate to="/set-password" replace />;
  }

  if (profile.role !== role) {
    return <Navigate to={profile.role === "doctor" ? "/doctor" : "/patient"} replace />;
  }
  return <>{children}</>;
}