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
    changePassword: (newPassword: string) =>
      authedFetch("/api/auth/change-password", { method: "POST", body: JSON.stringify({ new_password: newPassword }) }),
  },
  doctor: {
    createPatient: (payload: { full_name: string; email: string; phone?: string }) =>
      authedFetch("/api/doctor/patients", { method: "POST", body: JSON.stringify(payload) }),
    regeneratePassword: (patientId: string) =>
      authedFetch(`/api/doctor/patients/${patientId}/regenerate-password`, { method: "POST" }),
    reminders: () => authedFetch("/api/doctor/reminders"),
    markReminderSent: (id: string) =>
      authedFetch(`/api/doctor/reminders/${id}/mark-sent`, { method: "POST" }),
    buildReminderLink: (id: string) =>
      authedFetch(`/api/doctor/reminders/${id}/whatsapp-link`, { method: "POST" }),
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
    noShow: (id: string) => authedFetch(`/api/appointments/${id}/no-show`, { method: "POST" }),
    adhoc: (patientId: string, durationMin = 30) =>
      authedFetch("/api/appointments/adhoc", {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, duration_min: durationMin }),
      }),
    bulkCreate: (payload: {
      patient_id: string;
      count: number;
      start_iso: string;
      pattern: "weekly" | "twice_weekly" | "custom";
      gap_days?: number;
      duration_min?: number;
      label?: string;
    }) => authedFetch("/api/appointments/bulk", { method: "POST", body: JSON.stringify(payload) }),
    setPayment: (id: string, payload: { payment_status: string; payment_amount?: number | null }) =>
      authedFetch(`/api/appointments/${id}/payment`, { method: "PATCH", body: JSON.stringify(payload) }),
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
  finance: {
    query: (month: string, year: string) => {
      const q = new URLSearchParams();
      if (month) q.set("month", month);
      q.set("year", year);
      return q.toString();
    },
    categories: () => authedFetch("/api/doctor/finance/categories"),
    createCategory: (name: string) =>
      authedFetch("/api/doctor/finance/categories", { method: "POST", body: JSON.stringify({ name }) }),
    deleteCategory: (id: string) =>
      authedFetch(`/api/doctor/finance/categories/${id}`, { method: "DELETE" }),
    expenses: (month: string, year: string) =>
      authedFetch(`/api/doctor/finance/expenses?${api.finance.query(month, year)}`),
    createExpense: (payload: { amount: number; category_id?: string | null; expense_date?: string; description?: string }) =>
      authedFetch("/api/doctor/finance/expenses", { method: "POST", body: JSON.stringify(payload) }),
    deleteExpense: (id: string) =>
      authedFetch(`/api/doctor/finance/expenses/${id}`, { method: "DELETE" }),
    income: (month: string, year: string) =>
      authedFetch(`/api/doctor/finance/income?${api.finance.query(month, year)}`),
    createIncome: (payload: { amount: number; source?: string; income_date?: string; description?: string }) =>
      authedFetch("/api/doctor/finance/income", { method: "POST", body: JSON.stringify(payload) }),
    deleteIncome: (id: string) =>
      authedFetch(`/api/doctor/finance/income/${id}`, { method: "DELETE" }),
    pnl: (month: string, year: string) =>
      authedFetch(`/api/doctor/finance/pnl?${api.finance.query(month, year)}`),
  },
  insights: {
    summary: (month: string, year: string) => {
      const q = new URLSearchParams();
      if (month) q.set("month", month);
      q.set("year", year);
      return authedFetch(`/api/doctor/insights/summary?${q.toString()}`);
    },
  },
};
