"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/lib/types";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  messages: Message[];
  isStreaming: boolean;
}

export default function ChatWindow({ messages, isStreaming }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="chat-window-empty">
        <div className="chat-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="56" height="56">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3 className="chat-empty-title">Start a Conversation</h3>
        <p className="chat-empty-text">
          Search for a patient using the sidebar, then ask questions about their
          medical record or request updates.
        </p>
        <div className="chat-empty-suggestions">
          <div className="chat-suggestion">&quot;What medications is this patient on?&quot;</div>
          <div className="chat-suggestion">&quot;Summarize the treatment history&quot;</div>
          <div className="chat-suggestion">&quot;Add hypertension to conditions&quot;</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window" ref={containerRef}>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLatest={index === messages.length - 1}
          />
        ))}

        {isStreaming && (
          <div className="message-row message-row-ai">
            <div className="message-avatar message-avatar-ai">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                <circle cx="12" cy="14" r="3" />
              </svg>
            </div>
            <div className="message-bubble message-bubble-ai">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
