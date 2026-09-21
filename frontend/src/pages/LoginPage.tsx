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
import { signInDriverWithEmail, sendDriverPasswordReset, signOutDriver } from "@/lib/firebase";
import "./live.css";

type AuthMode = "rider" | "driver";
type RiderStep = "phone" | "code";
type DriverStep = "login" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useApp();

  // Shared state
  const [mode, setMode] = useState<AuthMode>("rider");
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

  // Driver (email) state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      if (!user)
        throw new Error("Your session could not be established. Please retry.");
      navigate(
        user.role === "admin"
          ? "/admin"
          : user.role === "driver"
            ? "/driver/portal"
            : "/home",
        { replace: true },
      );
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
    verifier.current?.clear();
    verifier.current = null;
  };

  // --- Driver (Email) Flow ---
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await signInDriverWithEmail(email.trim(), password);
      if (!user.emailVerified) {
        setError("Please verify your email before signing in. Check your inbox for the verification link.");
        await signOutDriver();
        return;
      }
      await loginToken(await user.getIdToken());
      await signOutDriver();
      const loggedInUser = await refreshSession();
      if (!loggedInUser)
        throw new Error("Your session could not be established. Please retry.");
      navigate(
        loggedInUser.role === "admin"
          ? "/admin"
          : loggedInUser.role === "driver"
            ? "/driver/portal"
            : "/home",
        { replace: true },
      );
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
              <Phone size={16} /> Rider (Phone)
            </button>
            <button
              role="tab"
              aria-selected={mode === "driver"}
              onClick={() => { setMode("driver"); setError(""); }}
              className={`mode-tab ${mode === "driver" ? "active" : ""}`}
            >
              <Mail size={16} /> Driver (Email)
            </button>
          </div>

          <p className="live-eyebrow">WELCOME TO RYDELY</p>
          <h2>
            {mode === "rider"
              ? riderStep === "phone"
                ? "Let's get you moving."
                : "Check your messages"
              : driverStep === "login"
                ? "Sign in to your driver account"
                : "Reset your password"}
          </h2>
          <p className="live-muted">
            {mode === "rider"
              ? riderStep === "phone"
                ? "Sign in or create your account with your phone number."
                : `Enter the six-digit code sent to +91 ${phone}.`
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

          {/* Driver Form - Login */}
          {mode === "driver" && driverStep === "login" && (
            <form onSubmit={handleDriverLogin}>
              <label>
                Email address
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
              <button
                className="live-primary"
                disabled={busy || !email || !password}
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
            Your account access is managed securely by the server.
          </p>
        </div>
      </section>
    </main>
  );
}
