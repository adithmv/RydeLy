import { useApp } from "@/context/app-state";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { registerDriver } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ChevronDown, Loader2, Car, Mail, Lock, Eye, EyeOff, AlertCircle, AlertTriangle, ArrowRight, ArrowLeft, Phone, Shield, MapPin } from "lucide-react";
import { signUpDriverWithEmail, signOutDriver } from "@/lib/firebase";
import { request } from "@/lib/http";
import { sendEmailVerification } from "firebase/auth";
import { loginToken } from "@/lib/live";
import { ALL_TOWNS, getStandsByTown, type Stand } from "@/data/index";

export default function DriverRegistrationPage() {

  const navigate = useNavigate();
  const { user, isDriver, isAdmin, refreshSession } = useApp();

  // Handle already-logged-in users
  useEffect(() => {
    if (user) {
      if (isDriver) {
        navigate("/driver/portal", { replace: true });
      } else if (isAdmin) {
        navigate("/admin", { replace: true });
      }
      // If rider (commuter), allow them to stay and register as driver (link account)
    }
  }, [user, isDriver, isAdmin, navigate]);

  const [step, setStep] = useState<"form" | "verify-email" | "success">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [autoNumber, setAutoNumber] = useState("");
  const [town, setTown] = useState("");
  const [standId, setStandId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Pre-fill phone for logged-in riders
  useEffect(() => {
    if (user && !isDriver && !isAdmin && user.phone && !phone) {
      const digits = user.phone.replace(/\D/g, "").slice(-10);
      if (digits.length === 10) {
        setPhone(digits);
      }
    }
  }, [user, isDriver, isAdmin, phone]);

  // Derived lists for dropdowns
  const towns = useMemo(() => ALL_TOWNS, []);
  const stands = useMemo(() => getStandsByTown(town), [town]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  const canSubmit = 
    name.trim().length >= 2 && 
    validateEmail(email) && 
    validatePassword(password) && 
    password === confirmPassword &&
    phone.length === 10 && 
    autoNumber.trim().length >= 2 && 
    town.length >= 2 && 
    standId.length >= 2 && 
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      // Create Firebase user with email/password
      const user = await signUpDriverWithEmail(email.trim().toLowerCase(), password);
      setFirebaseUser(user);
      setStep("verify-email");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      if (message.includes("auth/email-already-in-use")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (message.includes("auth/weak-password")) {
        setError("Password is too weak. Use at least 8 characters with uppercase, lowercase, and number.");
      } else if (message.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError("");
    try {
      await sendEmailVerification(firebaseUser);
      setError("Verification email resent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError("");
    try {
      // Reload user to get latest emailVerified status
      await firebaseUser.reload();
      if (firebaseUser.emailVerified) {
        // Email verified, now register driver with backend
        const idToken = await firebaseUser.getIdToken();
        await loginToken(idToken);
        await signOutDriver();
        
        // Register driver with backend
        await registerDriver({ 
          name: name.trim(), 
          phone, 
          town,  // Now collected from form
          standId,  // Now collected from form
          autoNumber: autoNumber.trim(),
          email: email.trim().toLowerCase(),
          emailVerified: true
        });
        setStep("success");
      } else {
        setError("Email not yet verified. Please check your inbox and click the verification link.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification check failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep("form");
    setFirebaseUser(null);
  };

  return (
    <main className="min-h-screen bg-background flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-foreground text-primary-foreground p-12">
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-8">
            <Car size={24} className="text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight">
            Join RydeLy as a Driver
          </h1>
          <p className="font-malayalam text-base text-primary-foreground/70 mt-2">
            ഡ്രൈവറായി ചേരൂ
          </p>
          <p className="font-body text-sm text-primary-foreground/60 mt-5 leading-relaxed">
            Register your auto-rickshaw and start receiving direct calls from commuters in your area. Zero commission, always.
          </p>
        </div>
        <div className="space-y-4">
          {["Zero commission on every ride", "Direct calls from commuters", "You control your availability"].map(item => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle size={16} className="text-primary flex-shrink-0" />
              <span className="font-body text-sm text-primary-foreground/80">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px]">

          <AnimatePresence mode="wait">
            {step === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold">Registration Submitted!</h2>
                  <p className="font-malayalam text-sm text-muted-foreground mt-1">
                    രജിസ്ട്രേഷൻ സ്വീകരിച്ചു
                  </p>
                </div>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Your email has been verified. Our team will review your application and verify your details. You'll receive a call once approved — usually within 24 hours.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
                >
                  Back to Home
                </button>
              </motion.div>
            ) : step === "verify-email" ? (
              <motion.div
                key="verify-email"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="font-heading text-2xl font-bold">Verify Your Email</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">We've sent a verification link to</p>
                  <p className="font-body text-sm text-primary font-medium">{email}</p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    നിങ്ങളുടെ ഇമെയിൽ സത്യാപിക്കുക
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Mail size={24} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="font-body text-sm text-blue-800 leading-relaxed">
                      <p className="font-medium mb-2">Please check your inbox (and spam folder) for the verification email.</p>
                      <p>Click the link in the email to verify your address, then press "I've Verified" below.</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                    {error}
                  </p>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleCheckVerification}
                    disabled={loading}
                    className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <React.Fragment>
                        <Loader2 size={16} className="animate-spin" /> Checking...
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <CheckCircle size={16} /> I've Verified My Email
                      </React.Fragment>
                    )}
                  </button>
                  <button
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="w-full btn-pill bg-transparent text-primary border-2 border-primary hover:bg-primary/5 font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={16} /> Resend Verification Email
                  </button>
                  <button
                    onClick={handleBackToForm}
                    disabled={loading}
                    className="w-full btn-pill bg-transparent text-muted-foreground border-2 border-border-warm hover:bg-foreground/5 font-medium transition-all"
                  >
                    <ArrowLeft size={16} /> Back to Registration
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="font-heading text-2xl font-bold">Driver Registration</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name as on licence"
                      className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>

                  {/* Email - Primary Identifier */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-primary" />
                      Email Address <span className="text-xs text-primary font-medium">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Mail size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value.toLowerCase())}
                        placeholder="driver@example.com"
                        autoComplete="email"
                        className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors pl-10"
                        required
                      />
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1">Primary login identifier. A verification link will be sent to this email.</p>
                  </div>

                  {/* Password - Primary Credential */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Lock size={16} className="text-primary" />
                      Password <span className="text-xs text-primary font-medium">*</span>
                    </label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 8 characters, upper, lower, number"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2">
                      Confirm Password <span className="text-xs text-primary font-medium">*</span>
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                      required
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="font-body text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Phone Number - Required Contact Info (not for login) */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-primary" />
                      Phone Number <span className="text-xs text-primary font-medium">*</span>
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center bg-cream-dark border-2 border-border-warm rounded-xl px-4 font-body text-sm text-muted-foreground font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="flex-1 px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                        maxLength={10}
                        required
                      />
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Shield size={12} /> Stored as contact info only. Not used for login or OTP.
                    </p>
                  </div>

                  {/* Vehicle Number - Required */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Car size={16} className="text-primary" />
                      Vehicle Number <span className="text-xs text-primary font-medium">*</span>
                    </label>
                    <input
                      type="text"
                      value={autoNumber}
                      onChange={e => setAutoNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. KL 13 AB 1234"
                      className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                      required
                    />
                    <p className="font-body text-xs text-muted-foreground mt-1">Auto-rickshaw registration/number plate</p>
                  </div>

                  {/* Town - Required */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      Town <span className="text-xs text-primary font-medium">*</span>
                    </label>
                    <select
                      value={town}
                      onChange={e => { setTown(e.target.value); setStandId(""); }}
                      className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                      required
                    >
                      <option value="">Select your town</option>
                      {towns.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <p className="font-body text-xs text-muted-foreground mt-1">Your service town (e.g. Kannur, Kasaragod, Payyanur)</p>
                  </div>

                  {/* Auto Stand - Required */}
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      Auto Stand <span className="text-xs text-primary font-medium">*</span>
                    </label>
                    <select
                      value={standId}
                      onChange={e => setStandId(e.target.value)}
                      className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                      required
                      disabled={!town}
                    >
                      <option value="">Select your auto stand</option>
                      {stands.map((stand: Stand) => <option key={stand.id} value={stand.id}>{stand.name}</option>)}
                    </select>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {town ? `Available stands in ${town}` : "Select a town first to see available stands"}
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                      <AlertTriangle size={16} /> {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <React.Fragment>
                        <Loader2 size={16} className="animate-spin" /> Creating Account...
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        Create Account & Send Verification
                        <ArrowRight size={16} />
                      </React.Fragment>
                    )}
                  </button>

                  <p className="font-body text-[11px] text-muted-foreground text-center">
                    Already have an account?{" "}
                    <button type="button" onClick={() => navigate("/login")} className="text-primary hover:underline">
                      Sign in here
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