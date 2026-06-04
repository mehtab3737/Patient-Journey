"use client";

import { Patient } from "@/lib/types";

interface PatientCardProps {
  patient: Patient | null;
  loading?: boolean;
  onClearPatient?: () => void;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="patient-info-row">
      <span className="patient-info-label">{label}</span>
      <span className="patient-info-value">{value || "N/A"}</span>
    </div>
  );
}

export default function PatientCard({
  patient,
  loading,
  onClearPatient,
}: PatientCardProps) {
  if (loading) {
    return (
      <div className="patient-card">
        <div className="patient-card-header">
          <h3>Loading Patient...</h3>
        </div>
        <div className="patient-card-body">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 16, marginBottom: 12, width: `${60 + i * 8}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-card patient-card-empty">
        <div className="patient-card-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <p className="patient-card-empty-text">
          Search and select a patient to view their record
        </p>
      </div>
    );
  }

  return (
    <div className="patient-card animate-fade-in">
      <div className="patient-card-header">
        <div className="patient-card-avatar">
          {patient.name.charAt(0).toUpperCase()}
        </div>
        <div className="patient-card-title">
          <h3>{patient.name}</h3>
          <span className="patient-card-id">{patient.id.slice(0, 8)}...</span>
        </div>
        {onClearPatient && (
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClearPatient}
            title="Clear patient"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="patient-card-body">
        {patient.current_status && (
          <div className="patient-status-badge">
            <span
              className={`badge ${
                patient.current_status.toLowerCase() === "active"
                  ? "badge-green"
                  : patient.current_status.toLowerCase() === "critical"
                  ? "badge-yellow"
                  : "badge-teal"
              }`}
            >
              {patient.current_status}
            </span>
          </div>
        )}

        <div className="patient-info-section">
          <h4 className="patient-section-title">Demographics</h4>
          <InfoRow label="Date of Birth" value={patient.date_of_birth} />
          <InfoRow label="Gender" value={patient.gender} />
        </div>

        <div className="divider" />

        <div className="patient-info-section">
          <h4 className="patient-section-title">Clinical</h4>
          <InfoRow label="Condition" value={patient.medical_condition} />
          <InfoRow label="Treatments" value={patient.treatments} />
          <InfoRow label="Notes" value={patient.doctors_notes} />
        </div>

        <div className="divider" />

        <div className="patient-info-section">
          <h4 className="patient-section-title">Admission</h4>
          <InfoRow label="Admitted" value={patient.admit_date} />
          <InfoRow label="Discharged" value={patient.discharge_date} />
          <InfoRow
            label="Bill"
            value={
              patient.bill_amount != null
                ? `$${patient.bill_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : null
            }
          />
        </div>

        {patient.additional_conditions && patient.additional_conditions.length > 0 && (
          <>
            <div className="divider" />
            <div className="patient-info-section">
              <h4 className="patient-section-title">Additional Conditions</h4>
              <div className="patient-conditions-list">
                {patient.additional_conditions.map((c, i) => (
                  <span key={i} className="badge badge-purple">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {patient.additional_notes && (
          <>
            <div className="divider" />
            <div className="patient-info-section">
              <h4 className="patient-section-title">Additional Notes</h4>
              <p className="patient-additional-notes">{patient.additional_notes}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
