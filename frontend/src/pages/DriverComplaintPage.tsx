import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle, Phone } from "lucide-react";

export default function DriverComplaintPage() {
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [commuterPhone, setCommuterPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isValid = reason.trim().length >= 10 && commuterPhone.length === 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px] bg-card rounded-card p-10 shadow-card border border-[#E8DDD0] text-center space-y-5"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[hsl(var(--green-light))] rounded-full mx-auto">
            <CheckCircle size={32} className="text-[hsl(var(--green-dark))]" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Report Submitted</h1>
            <p className="font-malayalam text-xs text-muted-foreground mt-1">
              റിപ്പോർട്ട് സമർപ്പിച്ചു
            </p>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            Our admin team will review your report. Thank you for helping keep RydeLy safe.
          </p>
          <button
            onClick={() => navigate("/driver/portal")}
            className="w-full btn-pill bg-primary text-primary-foreground font-medium shadow-[var(--shadow-orange-glow)] hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
          >
            Back to Portal
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-[560px] mx-auto px-5">

        <button
          onClick={() => navigate("/driver/portal")}
          className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Portal
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-card p-8 border border-[#E8DDD0] shadow-card"
        >
          <div className="mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Report a Commuter</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Describe what happened so our team can review it
            </p>
            <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
              ഒരു ഉപഭോക്താവിനെ റിപ്പോർട്ട് ചെയ്യുക
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Commuter phone */}
            <div>
              <label className="font-body text-sm font-medium text-foreground block mb-2">
                Commuter's Phone Number
              </label>
              <div className="flex gap-2">
                <span className="flex items-center justify-center bg-[hsl(var(--cream-dark))] border-2 border-[hsl(var(--border-warm))] rounded-xl px-4 font-body text-sm text-muted-foreground font-medium">
                  +91
                </span>
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={commuterPhone}
                    onChange={(e) =>
                      setCommuterPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit number"
                    className="w-full pl-9 pr-4 py-3 bg-[hsl(var(--cream-dark))] border-2 border-[hsl(var(--border-warm))] rounded-xl font-body text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="font-body text-sm font-medium text-foreground block mb-2">
                What happened?{" "}
                <span className="text-red-400 font-normal">(required)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Be as specific as possible — rude behaviour, no-show after calling, abusive language, etc."
                rows={5}
                className="w-full px-4 py-3 bg-[hsl(var(--cream-dark))] border-2 border-[hsl(var(--border-warm))] rounded-xl font-body text-sm focus:border-primary outline-none transition-colors resize-none"
              />
              <p
                className={`font-body text-xs mt-1 transition-colors ${
                  reason.length < 10 && reason.length > 0
                    ? "text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                {reason.length < 10
                  ? `${10 - reason.length} more characters needed`
                  : `${reason.length} characters`}
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="font-body text-xs text-amber-700">
                False reports may result in a warning on your own account. Only submit if you genuinely experienced an issue.
              </p>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full btn-pill bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:bg-[hsl(var(--cream-dark))] disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed"
            >
              Submit Report
            </button>

          </form>
        </motion.div>
      </div>
    </main>
  );
}