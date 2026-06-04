"use client";

import { useState, useRef, useCallback } from "react";
import { Patient, Message, UpdateAction } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import PatientSearchBar from "@/components/PatientSearchBar";
import PatientCard from "@/components/PatientCard";
import ChatWindow from "@/components/ChatWindow";
import UpdateConfirmModal from "@/components/UpdateConfirmModal";
import styles from "./chat.module.css";

function generateId() {
  return crypto.randomUUID();
}

export default function ChatPage() {
  const supabase = createClient();

  // Patient state
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Update modal state
  const [pendingUpdate, setPendingUpdate] = useState<UpdateAction | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Sidebar toggle (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Show toast
  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Load patient by ID
  const loadPatient = useCallback(async (patientId: string) => {
    setPatientLoading(true);
    try {
      const res = await fetch(`/api/patient/${patientId}`);
      if (!res.ok) throw new Error("Patient not found");
      const data: Patient = await res.json();
      setPatient(data);

      // Add system message about patient selection
      const systemMsg: Message = {
        id: generateId(),
        role: "system",
        content: `Patient loaded: ${data.name} (${data.medical_condition || "No condition listed"})`,
      };
      setMessages((prev) => [...prev, systemMsg]);
      setSidebarOpen(false);
    } catch {
      showToast("Failed to load patient", "error");
    } finally {
      setPatientLoading(false);
    }
  }, []);

  // Clear patient
  function clearPatient() {
    setPatient(null);
    setMessages([]);
    setConversationId(null);
  }

  // Send message
  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsStreaming(true);

    // Create conversation if first message
    let convId = conversationId;
    if (!convId && patient) {
      try {
        const { data } = await supabase
          .from("conversations")
          .insert({
            patient_id: patient.id,
            patient_name: patient.name,
            title: text.slice(0, 100),
          })
          .select("id")
          .single();
        if (data) {
          convId = data.id;
          setConversationId(data.id);
        }
      } catch {
        // Continue without saving conversation
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.filter((m) => m.role !== "system"),
          patientRecord: patient,
          patientId: patient?.id || null,
          conversationId: convId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";
      const aiMsgId = generateId();

      // Add placeholder AI message
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: fullText } : m
          )
        );
      }

      // Check for UPDATE_ACTION in the response
      const updateMatch = fullText.match(
        /UPDATE_ACTION:\s*(\{[^}]+\})/
      );
      if (updateMatch) {
        try {
          const parsed = JSON.parse(updateMatch[1]);
          if (parsed.field && parsed.value !== undefined) {
            setPendingUpdate({
              field: parsed.field,
              value: parsed.value,
              description: parsed.description || "Update patient record",
            });
          }
        } catch {
          // Not a valid update action, ignore
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Something went wrong";
      showToast(errorMsg, "error");
      // Remove the empty AI message if there was an error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  // Confirm update
  async function handleConfirmUpdate() {
    if (!pendingUpdate || !patient) return;

    setUpdateLoading(true);
    try {
      let updateBody: Record<string, unknown> = {};

      if (pendingUpdate.field === "additional_conditions") {
        // Append new conditions to existing
        const newConditions =
          typeof pendingUpdate.value === "string"
            ? pendingUpdate.value.split(",").map((c) => c.trim())
            : pendingUpdate.value;
        updateBody = {
          additional_conditions: [
            ...(patient.additional_conditions || []),
            ...newConditions,
          ],
        };
      } else {
        updateBody = { [pendingUpdate.field]: pendingUpdate.value };
      }

      const res = await fetch(`/api/patient/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updatedPatient: Patient = await res.json();
      setPatient(updatedPatient);
      showToast("Patient record updated successfully!");

      // Add confirmation message
      const confirmMsg: Message = {
        id: generateId(),
        role: "system",
        content: `✅ Record updated: ${pendingUpdate.description}`,
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } catch {
      showToast("Failed to update patient record", "error");
    } finally {
      setUpdateLoading(false);
      setPendingUpdate(null);
    }
  }

  // Handle textarea key press
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-resize textarea
  function handleInputResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  return (
    <div className={styles.container}>
      {/* Mobile sidebar toggle */}
      <button
        className={`${styles.sidebarToggle} btn btn-ghost btn-icon`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          {sidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarInner}>
          <div className={styles.searchSection}>
            <h2 className={styles.sidebarTitle}>Patient Search</h2>
            <PatientSearchBar
              onSelect={loadPatient}
              disabled={isStreaming}
            />
          </div>

          <div className={styles.patientSection}>
            <PatientCard
              patient={patient}
              loading={patientLoading}
              onClearPatient={patient ? clearPatient : undefined}
            />
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <section className={styles.chatArea}>
        <ChatWindow messages={messages} isStreaming={isStreaming} />

        {/* Input area */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              id="chat-input"
              className={styles.chatInput}
              placeholder={
                patient
                  ? `Ask about ${patient.name}...`
                  : "Select a patient first, then ask a question..."
              }
              value={inputValue}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isStreaming}
            />
            <button
              id="send-btn"
              className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ""}`}
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
            >
              {isStreaming ? (
                <div className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p className={styles.inputDisclaimer}>
            AI responses are for clinical decision support only. Always verify before acting.
          </p>
        </div>
      </section>

      {/* Update confirmation modal */}
      {pendingUpdate && (
        <UpdateConfirmModal
          action={pendingUpdate}
          onConfirm={handleConfirmUpdate}
          onCancel={() => setPendingUpdate(null)}
          loading={updateLoading}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`toast ${toast.type === "error" ? "toast-error" : ""}`}
          style={{
            borderLeftColor:
              toast.type === "error"
                ? "var(--accent-danger)"
                : "var(--accent-success)",
            borderLeftWidth: 3,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
            style={{
              color:
                toast.type === "error"
                  ? "var(--accent-danger)"
                  : "var(--accent-success)",
            }}
          >
            {toast.type === "error" ? (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            ) : (
              <polyline points="20 6 9 17 4 12" />
            )}
          </svg>
          {toast.message}
        </div>
      )}
    </div>
  );
}
