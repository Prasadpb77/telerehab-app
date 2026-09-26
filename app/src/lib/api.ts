import { getToken } from "./authStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed: ${res.status}`);
  return body;
}

async function publicFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed: ${res.status}`);
  return body;
}

export const api = {
  auth: {
    signup: (payload: { full_name: string; email: string; password: string; phone?: string }) =>
      publicFetch("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
    login: (email: string, password: string) =>
      publicFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    me: () => authedFetch("/api/auth/me"),
  },
  dataRequest: {
    submit: (payload: { patient_id?: string; contact_email: string; request_type: string; details?: string }) =>
      publicFetch("/api/public/data-request", { method: "POST", body: JSON.stringify(payload) }),
  },
  appointments: {
    list: () => authedFetch("/api/appointments"),
    create: (payload: { patient_id: string; starts_at: string; ends_at: string; notes?: string }) =>
      authedFetch("/api/appointments", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: { starts_at?: string; ends_at?: string }) =>
      authedFetch(`/api/appointments/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    accept: (id: string) => authedFetch(`/api/appointments/${id}/accept`, { method: "POST" }),
    reschedule: (id: string, newSlotId: string) =>
      authedFetch(`/api/appointments/${id}/reschedule`, { method: "POST", body: JSON.stringify({ new_slot_id: newSlotId }) }),
    cancel: (id: string) => authedFetch(`/api/appointments/${id}/cancel`, { method: "POST" }),
  },
  meetTranscript: {
    submit: (payload: { session_id: string; raw_text: string; source?: string }) =>
      authedFetch("/api/meet-transcript", { method: "POST", body: JSON.stringify(payload) }),
    updateNote: (noteId: string, payload: Record<string, string>) =>
      authedFetch(`/api/meet-transcript/notes/${noteId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    approveNote: (noteId: string) =>
      authedFetch(`/api/meet-transcript/notes/${noteId}/approve`, { method: "POST" }),
  },
  chatbot: {
    send: (payload: { message: string; patient_id?: string }) =>
      authedFetch("/api/chatbot", { method: "POST", body: JSON.stringify(payload) }),
  },
};