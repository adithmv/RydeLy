import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase";
import { loginToken } from "@/lib/live";
import { request } from "@/lib/http";
import { useApp } from "@/context/app-state";
import "./live.css";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const auth = getFirebaseAuth();
      const result = await import("firebase/auth").then(m => m.signInWithEmailAndPassword(auth, email.trim(), password));
      if (!result.user.emailVerified) {
        setError("Please verify your email before signing in.");
        await import("firebase/auth").then(m => m.signOut(auth));
        return;
      }
      await loginToken(await result.user.getIdToken());
      await import("firebase/auth").then(m => m.signOut(auth));
      const loggedInUser = await refreshSession();
      if (!loggedInUser) throw new Error("Your session could not be established. Please retry.");
      // Admin login: only allow if role is admin
      if (loggedInUser.role !== "admin") {
        setError("Admin access required. This account does not have admin privileges.");
        await request("/auth/logout", { method: "POST" });
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      if (message.includes("auth/user-not-found") || message.includes("auth/wrong-password") || message.includes("auth/invalid-credential")) {
        setError("Invalid email or password");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const auth = getFirebaseAuth();
      await import("firebase/auth").then(m => m.sendPasswordResetEmail(auth, forgotEmail.trim()));
      setError("Password reset email sent. Check your inbox.");
      setForgot(false);
      setForgotEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="live-login">
      <section className="login-story">
        <span className="login-wordmark">
          Ryde<span>Ly.</span>
        </span>
        <div>
          <p className="live-eyebrow">ADMINISTRATION</p>
          <h1>
            Secure Access
            <br />for Operators
          </h1>
          <p>
            This portal is for authorized administrators only.
          </p>
        </div>
        <p>
          <ShieldCheck size={20} /> Server-side role verification on every request.
        </p>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="login-icon">
            <ShieldCheck size={28} />
          </span>

          <p className="live-eyebrow">ADMIN SIGN IN</p>
          <h2>{forgot ? "Reset Password" : "Email & Password"}</h2>
          <p className="live-muted">
            {forgot
              ? "Enter your admin email to receive a password reset link."
              : "Use your verified admin email and password."}
          </p>

          {!forgot && (
            <form onSubmit={handleLogin}>
              <label>
                Email address
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="admin@example.com"
                    required
                    disabled={busy}
                    autoFocus
                  />
                </div>
              </label>
              <label>
                Password
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Your password"
                    required
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <button className="live-primary" disabled={busy || !email || !password}>
                {busy ? "Signing in…" : "Sign in"} <ShieldCheck size={18} />
              </button>
              <button type="button" className="live-link" disabled={busy} onClick={() => { setForgot(true); setError(""); }}>
                Forgot password?
              </button>
            </form>
          )}

          {forgot && (
            <form onSubmit={handleForgotPassword}>
              <label>
                Email address
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="admin@example.com"
                    required
                    disabled={busy}
                    autoFocus
                  />
                </div>
              </label>
              <button className="live-primary" disabled={busy || !forgotEmail}>
                {busy ? "Sending…" : "Send reset link"} <ShieldCheck size={18} />
              </button>
              <button type="button" className="live-link" disabled={busy} onClick={() => { setForgot(false); setError(""); }}>
                <AlertCircle size={14} /> Back to sign in
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="live-error">
              {error}
            </p>
          )}
          <p className="login-footnote">
            <ShieldCheck size={15} /> Admin access is verified server-side via Firebase <code>/admins/&lbrace;uid&rbrace;</code>.
            <br />
            <Mail size={15} style={{ marginLeft: "24px", verticalAlign: "middle" }} /> No phone OTP — email/password only.
          </p>
        </div>
      </section>
    </main>
  );
}