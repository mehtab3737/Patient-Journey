"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/chat");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.replace("/chat");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Account created! Check your email to confirm, then log in."
        );
        setMode("login");
      }
    }

    setLoading(false);
  }

  return (
    <div className={styles.container}>
      {/* Background ambient glow */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.card}>
        {/* Logo / Brand */}
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className={styles.brandName}>Patient Journey AI</h1>
            <p className={styles.brandTagline}>Clinical Decision Support</p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Tab switcher */}
        <div className={styles.tabs}>
          <button
            id="tab-login"
            className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
            onClick={() => { setMode("login"); setError(null); }}
          >
            Sign In
          </button>
          <button
            id="tab-signup"
            className={`${styles.tab} ${mode === "signup" ? styles.tabActive : ""}`}
            onClick={() => { setMode("signup"); setError(null); }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form id="auth-form" onSubmit={handleSubmit} className={styles.form}>
          {mode === "signup" && (
            <div className={styles.field}>
              <label className="label" htmlFor="full-name">Full Name</label>
              <input
                id="full-name"
                className="input"
                type="text"
                placeholder="Dr. Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.field}>
            <label className="label" htmlFor="email">Email Address</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="doctor@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className={styles.successBox} role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {message}
            </div>
          )}

          <button
            id="submit-btn"
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Secure access for licensed medical professionals only.
        </p>
      </div>
    </div>
  );
}
