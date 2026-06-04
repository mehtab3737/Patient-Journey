// =============================================
// Patient Journey AI Chatbot — TypeScript Types
// =============================================

export interface Patient {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  medical_condition: string | null;
  treatments: string | null;
  doctors_notes: string | null;
  admit_date: string | null;
  discharge_date: string | null;
  bill_amount: number | null;
  // Extended mutable fields
  current_status: string | null;
  additional_conditions: string[];
  additional_notes: string | null;
  updated_at: string | null;
  updated_by: string | null;
  created_at: string | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  patient_name: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  full_name: string | null;
  specialty: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UpdateAction {
  field: keyof Pick<Patient, "current_status" | "additional_conditions" | "additional_notes" | "treatments" | "doctors_notes">;
  value: string | string[];
  description: string;
}

export interface ChatApiRequest {
  messages: Message[];
  patientRecord: Patient | null;
  patientId: string | null;
  conversationId?: string | null;
}

export interface PatientSearchResult {
  id: string;
  name: string;
  medical_condition: string | null;
  gender: string | null;
  date_of_birth: string | null;
}
