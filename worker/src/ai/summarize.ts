import type { Env } from "../env";

export interface StructuredSummary {
  concerns: string;
  therapy_discussed: string;
  exercises_discussed: string;
  patient_feedback: string;
  progress_notes: string;
  follow_up: string;
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

const SYSTEM_PROMPT = `You are a clinical-note drafting assistant for a physiotherapy telerehab practice.
You will be given a raw session transcript. Extract a structured draft note.
Rules:
- You are drafting for a licensed physiotherapist to review and edit — you are NOT diagnosing, prescribing, or giving medical advice.
- Only summarize what is explicitly present in the transcript. Do not infer clinical conclusions.
- Respond with ONLY a JSON object, no preamble, no markdown fences, matching exactly this shape:
{"concerns": "...", "therapy_discussed": "...", "exercises_discussed": "...", "patient_feedback": "...", "progress_notes": "...", "follow_up": "..."}
- Use empty strings for fields with no relevant content. Keep each field concise (2-4 sentences).`;

export async function summarizeTranscript(
  env: Env,
  transcriptText: string
): Promise<StructuredSummary> {
  const result = (await env.AI.run(MODEL as never, {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcriptText },
    ],
    max_tokens: 1000,
  })) as { response?: string };

  const text = (result.response ?? "").trim();
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned) as StructuredSummary;
  } catch {
    // Fail safe: return everything in progress_notes rather than crash the
    // pipeline; doctor still reviews/edits before anything is approved.
    return {
      concerns: "",
      therapy_discussed: "",
      exercises_discussed: "",
      patient_feedback: "",
      progress_notes: text,
      follow_up: "",
    };
  }
}