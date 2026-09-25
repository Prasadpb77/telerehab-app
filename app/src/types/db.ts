export type UserRole = "doctor" | "patient";

export interface AppUser {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  google_event_id: string | null;
  google_meet_url: string | null;
  notes: string | null;
}

export type NoteStatus = "draft" | "approved" | "rejected";

export interface SessionNote {
  id: string;
  session_id: string;
  patient_id: string;
  doctor_id: string;
  status: NoteStatus;
  concerns: string | null;
  therapy_discussed: string | null;
  exercises_discussed: string | null;
  patient_feedback: string | null;
  progress_notes: string | null;
  follow_up: string | null;
  ai_generated: boolean;
  created_at: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  default_sets: number | null;
  default_reps: number | null;
}

export interface PatientExercise {
  id: string;
  patient_id: string;
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  frequency_per_week: number | null;
  status: "active" | "paused" | "completed";
  exercises?: Exercise;
}

export interface ProgressEntry {
  id: string;
  patient_id: string;
  log_date: string;
  completed: boolean;
  pain_score: number | null;
  difficulty_score: number | null;
  comment: string | null;
}
