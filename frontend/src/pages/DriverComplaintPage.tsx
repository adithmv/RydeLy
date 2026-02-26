import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportCommuter } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, ShieldCheck } from "lucide-react";

const MIN_CHARS = 10;

export default function DriverComplaintPage() {
  const navigate = useNavigate();

  const [commuterPhone, setCommuterPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit =
    commuterPhone.length === 10 &&
    reason.trim().length >= MIN_CHARS &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await reportCommuter(commuterPhone, reason.trim());
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-[560px] mx-auto px-5">

        {/* Back */}
        <button
          onClick={() => navigate("/driver/portal")}
          className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to portal
        </button>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5 py-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold">Complaint Submitted</h2>
                <p className="font-malayalam text-sm text-muted-foreground mt-1">
                  പരാതി സ്വീകരിച്ചു
                </p>
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-[340px] mx-auto">
                Our team will review your complaint and take appropriate action. Thank you for helping keep RydeLy safe.
              </p>
              <div className="flex flex-col gap-3 max-w-[260px] mx-auto pt-2">
                <button
                  onClick={() => navigate("/driver/portal")}
                  className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
                >
                  Back to Portal
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setCommuterPhone("");
                    setReason("");
                  }}
                  className="btn-pill bg-card border border-border-warm text-foreground font-body text-sm font-medium hover:border-primary hover:text-primary transition-all"
                >
                  Submit Another
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
              {/* Header */}
              <div className="mb-8">
                <h1 className="font-heading text-2xl font-bold">File a Complaint</h1>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Report a commuter for misconduct or harassment
                </p>
                <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                  ഒരു യാത്രക്കാരനെ റിപ്പോർട്ട് ചെയ്യുക
                </p>
              </div>

              {/* Warning notice */}
              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <AlertTriangle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="font-body text-xs text-yellow-800 leading-relaxed">
                  False reports may result in a warning on your account. Only submit complaints for genuine incidents.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Commuter phone */}
                <div>
                  <label className="font-body text-sm font-medium text-foreground block mb-2">
                    Commuter's Phone Number
                  </label>
                  <div className="flex gap-2">
                    <span className="flex items-center justify-center bg-cream-dark border-2 border-border-warm rounded-xl px-4 font-body text-sm text-muted-foreground font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={commuterPhone}
                      onChange={e => setCommuterPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <p className="font-body text-[11px] text-muted-foreground mt-1.5">
                    This is the number they used to call you through RydeLy
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <label className="font-body text-sm font-medium text-foreground block mb-2">
                    What happened?
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Describe the incident clearly. Include time, location, and what occurred..."
                    rows={5}
                    className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors resize-none"
                  />
                  {/* Character counter */}
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="font-body text-[11px] text-muted-foreground">
                      Minimum {MIN_CHARS} characters required
                    </p>
                    <p className={`font-body text-[11px] font-medium ${
                      reason.trim().length < MIN_CHARS ? "text-muted-foreground" : "text-green-600"
                    }`}>
                      {reason.trim().length} / {MIN_CHARS}+
                    </p>
                  </div>
                </div>

                {/* Safety note */}
                <div className="flex items-start gap-3 bg-card border border-border-warm rounded-xl p-4">
                  <ShieldCheck size={15} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">
                    Your complaint is reviewed by our moderation team within 24 hours. The commuter's account may be suspended if the report is verified.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full btn-pill bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    : "Submit Complaint"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}