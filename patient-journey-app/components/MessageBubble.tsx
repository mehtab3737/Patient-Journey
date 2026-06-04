"use client";

import ReactMarkdown from "react-markdown";
import { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export default function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="message-system animate-fade-in">
        <div className="message-system-content">{message.content}</div>
      </div>
    );
  }

  return (
    <div
      className={`message-row ${isUser ? "message-row-user" : "message-row-ai"} ${
        isLatest ? "animate-fade-in" : ""
      }`}
    >
      {!isUser && (
        <div className="message-avatar message-avatar-ai">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
            <circle cx="12" cy="14" r="3" />
          </svg>
        </div>
      )}

      <div className={`message-bubble ${isUser ? "message-bubble-user" : "message-bubble-ai"}`}>
        {isUser ? (
          <p className="message-text">{message.content}</p>
        ) : (
          <div className="message-markdown">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="message-avatar message-avatar-user">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
    </div>
  );
}
