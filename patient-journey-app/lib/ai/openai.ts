import OpenAI from "openai";
import { Patient } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build the system prompt with the patient's full record injected as context.
 */
export function buildSystemPrompt(patient: Patient | null): string {
  const base = `You are a clinical AI assistant helping doctors review and manage patient records.
You are concise, medically accurate, and always note when something requires professional judgment.

Your capabilities:
1. Answer questions about the patient's medical history, treatments, and conditions.
2. Suggest medication adjustments or treatment considerations (always note: final decision rests with the doctor).
3. When the doctor asks to update patient data, respond with the following JSON block on its own line so the system can process the update:

UPDATE_ACTION: {"field": "<field_name>", "value": "<new_value>", "description": "<what you are changing>"}

Updatable fields:
- "current_status" (string) — e.g. "Active", "Discharged", "Critical", "Stable"
- "additional_conditions" (comma-separated string) — new conditions to ADD to existing ones
- "additional_notes" (string) — supplementary clinical notes
- "treatments" (string) — updated treatment plan
- "doctors_notes" (string) — updated doctor notes

Important rules for updates:
- Only output UPDATE_ACTION when the doctor explicitly asks to change/add/update something.
- Always explain what you're about to update BEFORE the UPDATE_ACTION line.
- After the UPDATE_ACTION, tell the doctor to confirm the change.`;

  if (!patient) {
    return (
      base +
      "\n\nNo patient is currently selected. Ask the doctor to search for and select a patient first."
    );
  }

  const record = `
--- PATIENT RECORD ---
Name: ${patient.name}
Patient ID: ${patient.id}
Date of Birth: ${patient.date_of_birth || "N/A"}
Gender: ${patient.gender || "N/A"}
Medical Condition: ${patient.medical_condition || "N/A"}
Treatments: ${patient.treatments || "N/A"}
Doctor's Notes: ${patient.doctors_notes || "N/A"}
Admit Date: ${patient.admit_date || "N/A"}
Discharge Date: ${patient.discharge_date || "N/A"}
Bill Amount: ${patient.bill_amount != null ? `$${patient.bill_amount.toFixed(2)}` : "N/A"}
Current Status: ${patient.current_status || "Not set"}
Additional Conditions: ${patient.additional_conditions?.length > 0 ? patient.additional_conditions.join(", ") : "None"}
Additional Notes: ${patient.additional_notes || "None"}
--- END RECORD ---`;

  return base + "\n\nYou have access to the following patient's medical record:\n" + record;
}

/**
 * Parse UPDATE_ACTION from AI response text.
 */
export function parseUpdateAction(
  text: string
): { field: string; value: string; description: string } | null {
  const match = text.match(/UPDATE_ACTION:\s*(\{[^}]+\})/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.field && parsed.value !== undefined && parsed.description) {
      return {
        field: parsed.field,
        value: parsed.value,
        description: parsed.description,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Stream a chat completion from OpenAI GPT-4o.
 */
export async function streamChat(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[]
) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    temperature: 0.4,
    max_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  return stream;
}
