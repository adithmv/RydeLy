import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  MapPin,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
} from "lucide-react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { loginToken } from "@/lib/live";
import { request } from "@/lib/http";
import { useApp } from "@/context/app-state";
import { signInDriverWithEmail, sendDriverPasswordReset, signOutDriver, signInRiderWithEmail, sendRiderPasswordReset, signUpRiderWithEmail, signOutRider } from "@/lib/firebase";
import "./live.css";

type AuthMode = "rider" | "driver";
type RiderAuthMethod = "phone" | "email";
type RiderStep = "phone" | "code" | "email_login" | "email_signup" | "forgot";
type DriverStep = "login" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useApp();

  // Shared state
  const [mode, setMode] = useState<AuthMode>("rider");
  const [riderAuthMethod, setRiderAuthMethod] = useState<RiderAuthMethod>("phone");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Rider (phone) state
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [riderStep, setRiderStep] = useState<RiderStep>("phone");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const captcha = useRef<HTMLDivElement>(null);

  // Rider (email) state
  const [riderEmail, setRiderEmail] = useState("");
  const [riderPassword, setRiderPassword] = useState("");
  const [riderShowPassword, setRiderShowPassword] = useState(false);

  // Driver (email) state
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverShowPassword, setDriverShowPassword] = useState(false);
  const [driverStep, setDriverStep] = useState<DriverStep>("login");
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(
    () => () => {
      verifier.current?.clear();
    },
    [],
  );

  // --- Rider (Phone) Flow ---
  const sendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const auth = getFirebaseAuth();
      if (!verifier.current)
        verifier.current = new RecaptchaVerifier(auth, captcha.current!, {
          size: "normal",
        });
      setConfirmation(
        await signInWithPhoneNumber(auth, `+91${phone}`, verifier.current),
      );
      setRiderStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your code");
      verifier.current?.clear();
      verifier.current = null;
    } finally {
      setBusy(false);
    }
  };

  const verifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setBusy(true);
    setError("");
    try {
      const credential = await confirmation.confirm(code);
      await loginToken(await credential.user.getIdToken());
      if (name.trim())
        await request("/auth/set-name", {
          method: "POST",
          body: JSON.stringify({ name: name.trim() }),
        });
      await signOut(getFirebaseAuth());
      const user = await refreshSession();
      console.log("[PhoneLogin] Backend returned role:", user?.role, "full user:", user);
      if (!user)
        throw new Error("Your session could not be established. Please retry.");
      const targetRoute = user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "driver"
          ? "/driver/portal"
          : "/home";
      console.log("[PhoneLogin] Navigating to:", targetRoute);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The code could not be verified",
      );
    } finally {
      setBusy(false);
    }
  };

  const resendPhoneCode = () => {
    setConfirmation(null);
    setCode("");
    setRiderStep("phone");
    setRiderAuthMethod("phone");
    verifier.current?.clear();
    verifier.current = null;
  };

  // --- Rider (Email) Flow ---
  const handleRiderEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await signInRiderWithEmail(riderEmail.trim(), riderPassword);
      if (!user.emailVerified) {
        setError("Please verify your email before signing in. Check your inbox for the verification link.");
        await signOutRider();
        return;
      }
      await loginToken(await user.getIdToken());
      await signOutRider();
      const loggedInUser = await refreshSession();
      console.log("[RiderEmailLogin] Backend returned role:", loggedInUser?.role, "full user:", loggedInUser);
      if (!loggedInUser)
        throw new Error("Your session could not be established. Please retry.");
      const targetRoute = loggedInUser.role === "admin"
        ? "/admin/dashboard"
        : loggedInUser.role === "driver"
          ? "/driver/portal"
          : "/home";
      console.log("[RiderEmailLogin] Navigating to:", targetRoute);
      navigate(targetRoute, { replace: true });
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

  const handleRiderEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signUpRiderWithEmail(riderEmail.trim(), riderPassword);
      setError("Verification email sent. Please check your inbox and verify your email before signing in.");
      setRiderStep("email_login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      if (message.includes("auth/email-already-in-use")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (message.includes("auth/weak-password")) {
        setError("Password should be at least 6 characters.");
      } else if (message.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRiderForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendRiderPasswordReset(riderEmail.trim());
      setError("Password reset email sent. Check your inbox.");
      setRiderStep("email_login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  // --- Driver (Email) Flow ---
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await signInDriverWithEmail(driverEmail.trim(), driverPassword);
      if (!user.emailVerified) {
        setError("Please verify your email before signing in. Check your inbox for the verification link.");
        await signOutDriver();
        return;
      }
      await loginToken(await user.getIdToken());
      await signOutDriver();
      const loggedInUser = await refreshSession();
      // Debug: log the role returned from backend
      console.log("[DriverLogin] Backend returned role:", loggedInUser?.role, "full user:", loggedInUser);
      if (!loggedInUser)
        throw new Error("Your session could not be established. Please retry.");
      const targetRoute = loggedInUser.role === "admin"
        ? "/admin/dashboard"
        : loggedInUser.role === "driver"
          ? "/driver/portal"
          : "/home";
      console.log("[DriverLogin] Navigating to:", targetRoute);
      navigate(targetRoute, { replace: true });
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
      await sendDriverPasswordReset(forgotEmail.trim());
      setError("Password reset email sent. Check your inbox.");
      setDriverStep("login");
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
          <p className="live-eyebrow">YOUR TOWN. YOUR PEOPLE.</p>
          <h1>
            A familiar road.
            <br />A fresh way
            <br />
            to get there.
          </h1>
          <p>
            From the first ride of the day to the last stop on your way home.
          </p>
        </div>
        <p>
          <ShieldCheck size={20} /> A verified account. A more accountable
          journey.
        </p>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="login-icon">
            <MapPin size={28} />
          </span>

          {/* Mode Selector */}
          <div className="mode-tabs mb-6" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "rider"}
              onClick={() => { setMode("rider"); setError(""); }}
              className={`mode-tab ${mode === "rider" ? "active" : ""}`}
            >
              <Phone size={16} /> Rider
            </button>
            <button
              role="tab"
              aria-selected={mode === "driver"}
              onClick={() => { setMode("driver"); setError(""); }}
              className={`mode-tab ${mode === "driver" ? "active" : ""}`}
            >
              <Mail size={16} /> Driver
            </button>
          </div>

          {/* Rider Auth Method Selector (only shown when mode is rider) */}
          {mode === "rider" && (
            <div className="auth-method-tabs mb-6" role="tablist">
              <button
                role="tab"
                aria-selected={riderAuthMethod === "phone"}
                onClick={() => { setRiderAuthMethod("phone"); setRiderStep("phone"); setError(""); }}
                className={`auth-method-tab ${riderAuthMethod === "phone" ? "active" : ""}`}
              >
                <Phone size={14} /> Phone (OTP)
              </button>
              <button
                role="tab"
                aria-selected={riderAuthMethod === "email"}
                onClick={() => { setRiderAuthMethod("email"); setRiderStep("email_login"); setError(""); }}
                className={`auth-method-tab ${riderAuthMethod === "email" ? "active" : ""}`}
              >
                <Mail size={14} /> Email (Password)
              </button>
            </div>
          )}

          <p className="live-eyebrow">WELCOME TO RYDELY</p>
          <h2>
            {mode === "rider"
              ? riderAuthMethod === "phone"
                ? riderStep === "phone"
                  ? "Let's get you moving."
                  : "Check your messages"
                : riderStep === "email_login"
                  ? "Sign in with email"
                  : riderStep === "email_signup"
                    ? "Create your account"
                    : "Sign in with email"
              : driverStep === "login"
                ? "Sign in to your driver account"
                : "Reset your password"}
          </h2>
          <p className="live-muted">
            {mode === "rider"
              ? riderAuthMethod === "phone"
                ? riderStep === "phone"
                  ? "Sign in or create your account with your phone number."
                  : `Enter the six-digit code sent to +91 ${phone}.`
                : riderStep === "email_login"
                  ? "Use your registered email and password."
                  : "Create your rider account with email and password."
              : driverStep === "login"
                ? "Use your registered email and password."
                : "Enter your email to receive a password reset link."}
          </p>

          {/* Rider Form */}
          {mode === "rider" && riderStep === "phone" && (
            <form onSubmit={sendPhoneCode}>
              <label>
                Your name (optional)
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="What should we call you?"
                />
              </label>
              <label>
                Mobile number
                <div className="phone-field">
                  <span>+91</span>
                  <input
                    aria-label="Mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="10-digit mobile number"
                    required
                    pattern="[0-9]{10}"
                  />
                </div>
              </label>
              <button
                className="live-primary"
                disabled={busy || phone.length !== 10}
              >
                {busy ? "Sending code…" : "Continue"}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {mode === "rider" && riderStep === "code" && (
            <form onSubmit={verifyPhoneCode}>
              <label>
                Verification code
                <input
                  className="otp-code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                  pattern="[0-9]{6}"
                  autoFocus
                />
              </label>
              <button
                className="live-primary"
                disabled={busy || code.length !== 6}
              >
                {busy ? "Verifying…" : "Verify & sign in"}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="live-link"
                disabled={busy}
                onClick={resendPhoneCode}
              >
                <ArrowLeft size={14} /> Change number or resend
              </button>
            </form>
          )}

          {/* Rider Form - Email Login */}
          {mode === "rider" && riderAuthMethod === "email" && riderStep === "email_login" && (
            <form onSubmit={handleRiderEmailLogin}>
              <label>
                Email address
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    type="email"
                    value={riderEmail}
                    onChange={(e) => setRiderEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="rider@example.com"
                    required
                    disabled={busy}
                  />
                </div>
              </label>
              <label>
                Password
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type={riderShowPassword ? "text" : "password"}
                    value={riderPassword}
                    onChange={(e) => setRiderPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Your password"
                    required
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setRiderShowPassword(!riderShowPassword)}
                    className="toggle-password"
                    aria-label={riderShowPassword ? "Hide password" : "Show password"}
                  >
                    {riderShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <button
                className="live-primary"
                disabled={busy || !riderEmail || !riderPassword}
              >
                {busy ? "Signing in…" : "Sign in"}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="live-link"
                disabled={busy}
                onClick={() => { setRiderStep("forgot"); setError(""); }}
              >
                Forgot password?
              </button>
              <p className="live-muted small" style={{ marginTop: "12px" }}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setRiderStep("email_signup"); setError(""); }}
                  className="text-primary hover:underline"
                >
                  Create account
                </button>
              </p>
            </form>
          )}

          {/* Rider Form - Email Signup */}
          {mode === "rider" && riderAuthMethod === "email" && riderStep === "email_signup" && (
            <form onSubmit={handleRiderEmailSignup}>
              <label>
                Your name (optional)
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="What should we call you?"
                />
              </label>
              <label>
                Email address
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    type="email"
                    value={riderEmail}
                    onChange={(e) => setRiderEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="rider@example.com"
                    required
                    disabled={busy}
                  />
                </div>
              </label>
              <label>
                Password
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type={riderShowPassword ? "text" : "password"}
                    value={riderPassword}
                    onChange={(e) => setRiderPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setRiderShowPassword(!riderShowPassword)}
                    className="toggle-password"
                    aria-label={riderShowPassword ? "Hide password" : "Show password"}
                  >
                    {riderShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <button
                className="live-primary"
                disabled={busy || !riderEmail || !riderPassword || riderPassword.length < 6}
              >
                {busy ? "Creating account…" : "Create account"}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="live-link"
                disabled={busy}
                onClick={() => { setRiderStep("email_login"); setError(""); }}
              >
                <ArrowLeft size={14} /> Already have an account? Sign in
              </button>
            </form>
          )}

          {/* Rider Form - Forgot Password */}
          {mode === "rider" && riderAuthMethod === "email" && riderStep === "forgot" && (
            <form onSubmit={handleRiderForgotPassword}>
              <label>
                Email address
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    type="email"
                    value={riderEmail}
                    onChange={(e) => setRiderEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="rider@example.com"
                    required
                    disabled={busy}
                  />
                </div>
              </label>
              <button
                className="live-primary"
                disabled={busy || !riderEmail}
              >
                {busy ? "Sending reset link…" : "Send reset link"}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="live-link"
                disabled={busy}
                onClick={() => { setRiderStep("email_login"); setError(""); }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </form>
          )}

          {/* Driver Form - Login */}
          {mode === "driver" && driverStep === "login" && (
            <form onSubmit={handleDriverLogin}>
              <label>
                Email address
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    type="email"
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="driver@example.com"
                    required
                    disabled={busy}
                  />
                </div>
              </label>
              <label>
                Password
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type={driverShowPassword ? "text" : "password"}
                    value={driverPassword}
                    onChange={(e) => setDriverPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Your password"
                    required
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setDriverShowPassword(!driverShowPassword)}
                    className="toggle-password"
                    aria-label={driverShowPassword ? "Hide password" : "Show password"}
                  >
                    {driverShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              <button
                className="live-primary"
                disabled={busy || !driverEmail || !driverPassword}
              >
                {busy ? "Signing in…" : "Sign in"}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="live-link"
                disabled={busy}
                onClick={() => { setDriverStep("forgot"); setError(""); }}
              >
                Forgot password?
              </button>
              <p className="live-muted small" style={{ marginTop: "12px" }}>
                Don't have a driver account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-primary hover:underline"
                >
                  Register as Driver
                </button>
              </p>
            </form>
          )}

          {/* Driver Form - Forgot Password */}
          {mode === "driver" && driverStep === "forgot" && (
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
                    placeholder="driver@example.com"
                    required
                    disabled={busy}
                    autoFocus
                  />
                </div>
              </label>
              <button
                className="live-primary"
                disabled={busy || !forgotEmail}
              >
                {busy ? "Sending…" : "Send reset link"}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="live-link"
                disabled={busy}
                onClick={() => { setDriverStep("login"); setError(""); }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </form>
          )}

          <div ref={captcha} className="captcha-slot" />
          {error && (
            <p role="alert" className="live-error">
              {error}
            </p>
          )}
          <p className="login-footnote">
            <Phone size={15} /> Riders: We send a verification SMS to confirm it's you.
            <br />
            <Mail size={15} style={{ marginLeft: "24px", verticalAlign: "middle" }} /> Drivers: Sign in with your verified email and password.
            <br />
            <Mail size={15} style={{ marginLeft: "24px", verticalAlign: "middle" }} /> Riders (Email): Sign in with your verified email and password.
            Your account access is managed securely by the server.
          </p>
        </div>
      </section>
    </main>
  );
}