import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/app-state';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowLeft, Lock, ShieldCheck, Star, MapPin, User } from 'lucide-react';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=phone, 2=otp, 3=name
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const navigate = useNavigate();
  const { login, loginAsAdmin } = useApp();

  // ── Clean up reCAPTCHA on unmount ─────────────────────────
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // ── Step 1: Send OTP via Firebase ─────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setError('');
    setLoading(true);

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          getFirebaseAuth(),
          recaptchaContainerRef.current!,
          { size: 'invisible' }
        );
      }

      const result = await signInWithPhoneNumber(
        getFirebaseAuth(),
        '+91' + phone,
        recaptchaVerifierRef.current
      );
      setConfirmationResult(result);
      setStep(2);
    } catch (err: unknown) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-phone-number')) {
        setError('Invalid phone number. Please check and try again.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (msg.includes('quota-exceeded')) {
        setError('SMS quota exceeded. Please try again later.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP → get idToken → POST to backend ────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6 || !confirmationResult) return;

    setError('');
    setLoading(true);

    try {
      const userCredential = await confirmationResult.confirm(otpString);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch(`${BASE}/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();

      if (data.role === 'admin') {
        loginAsAdmin();
        navigate('/admin');
      } else if (data.role === 'driver') {
        login(true);
        navigate('/driver/portal');
      } else {
        login(false);
        if (data.isFirstLogin) {
          setStep(3);
        } else {
          navigate('/home');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-verification-code') || msg.includes('code-expired')) {
        setError('Incorrect or expired OTP. Please try again.');
      } else {
        setError(msg || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Save commuter name ─────────────────────────────
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/auth/set-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save name');
      navigate('/home');
    } catch {
      navigate('/home'); // Non-critical — let them through
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ─────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const resetToStep1 = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setConfirmationResult(null);
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
  };

  return (
    <main className="min-h-screen bg-background flex">

      {/* Invisible reCAPTCHA mount point */}
      <div ref={recaptchaContainerRef} />

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-foreground text-primary-foreground p-12">
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-8">
            <MapPin size={24} className="text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight">
            Welcome back<br />to RydeLy
          </h1>
          <p className="font-malayalam text-base text-primary-foreground/70 mt-2">
            RydeLy-ലേക്ക് സ്വാഗതം
          </p>
          <p className="font-body text-sm text-primary-foreground/60 mt-5 leading-relaxed">
            Sign in with your phone number to find auto-rickshaws near you.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { icon: <ShieldCheck size={16} />, text: 'Verified drivers only' },
            { icon: <Phone size={16} />,       text: 'Direct calls, no middlemen' },
            { icon: <Star size={16} />,        text: 'Zero commission, always' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="text-primary flex-shrink-0">{item.icon}</div>
              <span className="font-body text-sm text-primary-foreground/80">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">

          <AnimatePresence mode="wait">

            {/* ── Step 1: Phone number ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-5">
                    <Phone size={22} className="text-primary" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold">Enter your number</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    We'll send a 6-digit OTP to verify
                  </p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    നിങ്ങളുടെ നമ്പർ നൽകുക
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center bg-cream-dark border-2 border-border-warm rounded-xl px-4 font-body text-sm text-muted-foreground font-medium flex-shrink-0">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        autoFocus
                        className="flex-1 px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={phone.length < 10 || loading}
                    className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending OTP...</>
                      : 'Send OTP'}
                  </button>

                  <p className="font-body text-[11px] text-muted-foreground text-center">
                    New driver?{' '}
                    <button type="button" onClick={() => navigate('/register')} className="text-primary hover:underline">
                      Register here
                    </button>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ── Step 2: OTP ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={resetToStep1}
                  className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
                >
                  <ArrowLeft size={16} /> Change number
                </button>

                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-5">
                    <Lock size={22} className="text-primary" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold">Enter OTP</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Sent to <span className="font-semibold text-foreground">+91 {phone}</span>
                  </p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    OTP നൽകുക
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="flex gap-3 justify-between" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0}
                        className="w-12 h-14 text-center text-xl font-heading font-bold bg-cream-dark border-2 border-border-warm rounded-xl focus:border-primary outline-none transition-colors"
                      />
                    ))}
                  </div>

                  {error && (
                    <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={otp.join('').length !== 6 || loading}
                    className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                      : 'Verify & Sign In'}
                  </button>

                  <p className="font-body text-xs text-muted-foreground text-center">
                    Didn't receive it?{' '}
                    <button
                      type="button"
                      onClick={resetToStep1}
                      className="text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </p>
                </form>
              </motion.div>
            )}

            {/* ── Step 3: First-time commuter name ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-5">
                    <User size={22} className="text-primary" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold">What's your name?</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Just once — so drivers know who's calling
                  </p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    നിങ്ങളുടെ പേര് നൽകുക
                  </p>
                </div>

                <form onSubmit={handleSaveName} className="space-y-5">
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Adith MV"
                      autoFocus
                      className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>

                  {error && (
                    <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={name.trim().length < 2 || loading}
                    className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                      : 'Continue'}
                  </button>

                  <p className="font-body text-[11px] text-muted-foreground text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/home')}
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      Skip for now
                    </button>
                  </p>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}