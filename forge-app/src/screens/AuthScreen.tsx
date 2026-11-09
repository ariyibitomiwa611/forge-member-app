import { type FormEvent, useState } from "react";
import { supabase } from "../lib/api";

type Mode = "signin" | "signup" | "forgot";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const google = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setNotice("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Join FORGE" : "Reset your password";
  const sub =
    mode === "signin"
      ? "Pick up where your training left off."
      : mode === "signup"
        ? "A training diary that listens. Choose your distance next."
        : "We'll email you a link to set a new one.";

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand" style={{ padding: "0 0 28px" }}>FORGE</div>
        <h1 className="modal-title" style={{ margin: 0 }}>{title}</h1>
        <p className="modal-sub" style={{ margin: "4px 0 0" }}>{sub}</p>

        {mode !== "forgot" && (
          <>
            <button type="button" className="btn-google" onClick={google}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              Continue with Google
            </button>
            <div className="auth-or"><span>or</span></div>
          </>
        )}

        <form onSubmit={submit}>
          {mode === "signup" && (
            <>
              <label className="field-label" htmlFor="name" style={{ marginTop: 0 }}>Your name</label>
              <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </>
          )}
          <label className="field-label" htmlFor="email" style={mode === "signup" ? undefined : { marginTop: mode === "forgot" ? 22 : 0 }}>Email</label>
          <input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode !== "forgot" && (
            <>
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}

          {error && <p className="auth-msg error" role="alert">{error}</p>}
          {notice && <p className="auth-msg" role="status">{notice}</p>}

          <button type="submit" className="btn-primary" style={{ marginTop: 22 }} disabled={busy}>
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "signin" && (
            <>
              <button type="button" onClick={() => switchMode("forgot")}>Forgot password?</button>
              <button type="button" onClick={() => switchMode("signup")}>New here? <strong>Create an account</strong></button>
            </>
          )}
          {mode !== "signin" && (
            <button type="button" onClick={() => switchMode("signin")}>Already a member? <strong>Sign in</strong></button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shown after a member opens a password-reset link. */
export function SetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand" style={{ padding: "0 0 28px" }}>FORGE</div>
        <h1 className="modal-title" style={{ margin: 0 }}>Choose a new password</h1>
        <label className="field-label" htmlFor="newpw" style={{ marginTop: 22 }}>New password</label>
        <input id="newpw" type="password" className="input" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="auth-msg error" role="alert">{error}</p>}
        <button type="submit" className="btn-primary" style={{ marginTop: 22 }} disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
  );
}
