"use client";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import { APP } from "@/lib/config";
import { safeNext } from "@/lib/domain.mjs";
import { Field, Notice } from "./ui";
export function AuthForm({
  nextPath = "/dashboard",
  reset = false,
}: {
  nextPath?: string;
  reset?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return (
    <main id="main-content" className="auth-wrap">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-mark">✓</span>
          {APP.name}
        </div>
        <div>
          <p className="eyebrow">An everyday home for delegated work</p>
          <h1>
            Know what’s next.
            <br />
            Trust what’s done.
          </h1>
          <p>Instructions, checklists, evidence and decisions — connected in one calm workspace.</p>
        </div>
        <small className="muted">Built for virtual assistants and the clients they support.</small>
      </section>
      <section className="auth-form-area">
        <div className="auth-card">
          <div className="brand">
            <span className="brand-mark">✓</span>
            {APP.name}
          </div>
          <div>
            <h1>
              {reset
                ? "Choose a new password"
                : mode === "signup"
                  ? "Create your account"
                  : mode === "forgot"
                    ? "Reset your password"
                    : "Welcome back"}
            </h1>
            <p className="muted" style={{ marginTop: 8 }}>
              {mode === "signup"
                ? "Start with one client workspace. Invite your team when you are ready."
                : "Clear instructions. Accountable execution. Less chasing."}
            </p>
          </div>
          <form
            id="auth-form"
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              setMessage("");
              const f = new FormData(e.currentTarget);
              const email = String(f.get("email") || "");
              const password = String(f.get("password") || "");
              try {
                const db = browserSupabase();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                // A full same-origin navigation discards cached data from the previous auth session.
                if (reset) {
                  const { error } = await db.auth.updateUser({ password });
                  if (error) throw error;
                  window.location.assign(new URL("/dashboard", window.location.origin));
                  return;
                }
                if (mode === "forgot") {
                  const { error } = await db.auth.resetPasswordForEmail(email, {
                    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
                  });
                  if (error) throw error;
                  setMessage(
                    "Check your email for a password reset link. Delivery depends on your Supabase email configuration.",
                  );
                } else if (mode === "signup") {
                  const { data, error } = await db.auth.signUp({
                    email,
                    password,
                    options: {
                      data: { display_name: String(f.get("display_name") || "") },
                      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext(nextPath))}`,
                    },
                  });
                  if (error) throw error;
                  if (data.session) {
                    window.location.assign(new URL(safeNext(nextPath), window.location.origin));
                  } else
                    setMessage(
                      "Check your email to confirm your account, then sign in. Email confirmation follows your Supabase project settings.",
                    );
                } else {
                  const { error } = await db.auth.signInWithPassword({ email, password });
                  if (error) throw error;
                  window.location.assign(new URL(safeNext(nextPath), window.location.origin));
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to authenticate.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {mode === "signup" && !reset && (
              <Field label="Your name">
                <input
                  id="auth-name"
                  name="display_name"
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </Field>
            )}
            {!reset && (
              <Field label="Email address">
                <input id="auth-email" name="email" type="email" autoComplete="email" required />
              </Field>
            )}
            {(reset || mode !== "forgot") && (
              <Field
                label="Password"
                hint={mode === "signup" || reset ? "Use at least 12 characters." : undefined}
              >
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  minLength={mode === "login" && !reset ? 1 : 12}
                  maxLength={128}
                  autoComplete={reset || mode === "signup" ? "new-password" : "current-password"}
                  required
                />
              </Field>
            )}
            {error && <Notice error>{error}</Notice>}
            {message && <Notice>{message}</Notice>}
            <button id="auth-submit" type="submit" className="btn primary" disabled={busy}>
              {busy
                ? "Please wait…"
                : reset
                  ? "Update password"
                  : mode === "signup"
                    ? "Create account"
                    : mode === "forgot"
                      ? "Send reset link"
                      : "Sign in"}
            </button>
          </form>
          {!reset && (
            <div className="auth-switch">
              <button
                id="auth-mode"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setError("");
                  setMessage("");
                }}
              >
                {mode === "signup" ? "Already registered? Sign in" : "Create an account"}
              </button>
              <button
                id="auth-forgot"
                onClick={() => {
                  setMode(mode === "forgot" ? "login" : "forgot");
                  setError("");
                  setMessage("");
                }}
              >
                {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
              </button>
            </div>
          )}
          <small className="muted">
            Use your own account. Invitations never require sharing credentials.
          </small>
        </div>
      </section>
    </main>
  );
}
