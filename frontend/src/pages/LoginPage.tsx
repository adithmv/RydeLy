import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  MapPin,
  ArrowLeft,
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
import "./live.css";
export default function LoginPage() {
  const [phone, setPhone] = useState(""),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const captcha = useRef<HTMLDivElement>(null);
  const { refreshSession } = useApp();
  const navigate = useNavigate();
  useEffect(
    () => () => {
      verifier.current?.clear();
    },
    [],
  );
  const send = async (e: React.FormEvent) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your code");
      verifier.current?.clear();
      verifier.current = null;
    } finally {
      setBusy(false);
    }
  };
  const verify = async (e: React.FormEvent) => {
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
          <ShieldCheck size={20} /> A verified number. A more accountable
          journey.
        </p>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="login-icon">
            <MapPin size={28} />
          </span>
          <p className="live-eyebrow">WELCOME TO RYDELY</p>
          <h2>
            {confirmation ? "Check your messages" : "Let’s get you moving."}
          </h2>
          <p className="live-muted">
            {confirmation
              ? `Enter the six-digit code sent to +91 ${phone}.`
              : "Sign in or create your account with your phone number."}
          </p>
          {!confirmation ? (
            <form onSubmit={send}>
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
          ) : (
            <form onSubmit={verify}>
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
                onClick={() => {
                  setConfirmation(null);
                  setCode("");
                  verifier.current?.clear();
                  verifier.current = null;
                }}
              >
                <ArrowLeft size={14} /> Change number or resend
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
            <Phone size={15} /> We send a verification SMS to confirm it’s you.
            Your account access is managed securely by the server.
          </p>
        </div>
      </section>
    </main>
  );
}
