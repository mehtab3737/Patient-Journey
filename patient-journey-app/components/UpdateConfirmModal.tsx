"use client";

import { UpdateAction } from "@/lib/types";

interface UpdateConfirmModalProps {
  action: UpdateAction;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function UpdateConfirmModal({
  action,
  onConfirm,
  onCancel,
  loading,
}: UpdateConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <h3 className="modal-title">Confirm Record Update</h3>
        </div>

        <p className="modal-description">{action.description}</p>

        <div className="modal-diff">
          <div className="modal-diff-row">
            <span className="modal-diff-label">Field</span>
            <span className="modal-diff-value">
              <code>{action.field.replace(/_/g, " ")}</code>
            </span>
          </div>
          <div className="modal-diff-row">
            <span className="modal-diff-label">New Value</span>
            <span className="modal-diff-value modal-diff-new">
              {Array.isArray(action.value)
                ? action.value.join(", ")
                : action.value}
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 14, height: 14 }} />
                Updating...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Confirm Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
