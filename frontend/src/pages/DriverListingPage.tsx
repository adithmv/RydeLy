import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { getDrivers, initiateCall, reportDriver, Driver } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, ShieldCheck, AlertTriangle, Clock, Loader2 } from "lucide-react";

const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-orange-400 to-yellow-300",
  "bg-gradient-to-br from-emerald-500 to-teal-400",
  "bg-gradient-to-br from-blue-500 to-cyan-400",
  "bg-gradient-to-br from-purple-500 to-pink-400",
  "bg-gradient-to-br from-rose-500 to-amber-400",
  "bg-gradient-to-br from-indigo-500 to-blue-400",
];

function CallModal({
  driverName,
  onCancel,
  onConfirm,
  loading,
}: {
  driverName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-5" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-foreground rounded-card p-8 max-w-[400px] w-full shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mx-auto">
            <Phone size={26} className="text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-primary-foreground">Call {driverName}?</h2>
            <p className="font-malayalam text-xs text-muted-foreground mt-1">{driverName} നെ വിളിക്കണോ?</p>
          </div>
          <p className="font-body text-sm text-primary-foreground/70">
            This call will be logged for your safety.
          </p>
          <p className="font-malayalam text-xs text-muted-foreground">
            ഈ കോൾ നിങ്ങളുടെ സുരക്ഷയ്ക്കായി ലോഗ് ചെയ്യപ്പെടും
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connecting...</> : "Call Now"}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full btn-pill bg-foreground text-primary-foreground hover:bg-foreground/80 transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ReportModal({
  driver,
  onClose,
}: {
  driver: Driver;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await reportDriver(driver.id, reason.trim());
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch {
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-5" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-card p-8 max-w-[420px] w-full shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto">
              <ShieldCheck size={22} className="text-green-600" />
            </div>
            <p className="font-heading text-lg font-bold">Report Submitted</p>
            <p className="font-body text-sm text-muted-foreground">Thank you for helping keep RydeLy safe.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-bold">Report {driver.name}</h2>
              <p className="font-body text-sm text-muted-foreground mt-1">Describe your experience so our team can review it</p>
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="What happened? Be as specific as possible..."
              rows={4}
              className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 btn-pill bg-foreground text-primary-foreground hover:bg-foreground/80 transition-all font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason.trim() || loading}
                className="flex-1 btn-pill bg-red-500 text-white font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Report"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function DriverListingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { incrementCallCount, callCount } = useApp();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [callModal, setCallModal] = useState<Driver | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [reportModal, setReportModal] = useState<Driver | null>(null);
  const [rateLimitError, setRateLimitError] = useState("");

  const town = searchParams.get("town") || "";
  const stand = searchParams.get("stand") || "";
  const standName = searchParams.get("standName") || stand;
  const remaining = 5 - callCount;

  // ── Fetch drivers from backend ──────────────────────────────
  useEffect(() => {
    if (!town || !stand) return;
    setLoadingDrivers(true);
    setFetchError("");
    getDrivers(town, stand)
      .then(data => setDrivers(data))
      .catch(err => setFetchError(err.message || "Failed to load drivers. Please try again."))
      .finally(() => setLoadingDrivers(false));
  }, [town, stand]);

  // ── Confirm call → POST /commuter/call/initiate ─────────────
  const confirmCall = async () => {
    if (!callModal) return;
    const allowed = incrementCallCount();
    if (!allowed) {
      setRateLimitError("You have reached your hourly call limit of 5 calls. Please try again later.");
      setCallModal(null);
      return;
    }
    setCallLoading(true);
    try {
      const { phone } = await initiateCall(callModal.id);
      setCallModal(null);
      window.location.href = `tel:${phone}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate call.";
      setRateLimitError(msg);
      setCallModal(null);
    } finally {
      setCallLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-[680px] mx-auto px-5">

        {/* Back button */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to search
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-heading text-2xl font-bold">{standName}</h1>
            <p className="font-body text-sm text-muted-foreground mt-0.5">{town}</p>
          </div>
          {!loadingDrivers && (
            <span className="bg-primary/10 text-primary font-body text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
              {drivers.length} Available
            </span>
          )}
        </div>

        {/* Rate limit bar */}
        <div className="flex items-center gap-2 mt-4 mb-6 bg-card border border-border-warm rounded-xl px-4 py-3">
          <Clock size={14} className="text-muted-foreground flex-shrink-0" />
          <p className="font-body text-xs text-muted-foreground">
            Hourly call limit:{" "}
            <span className={`font-semibold ${remaining <= 1 ? "text-red-500" : "text-foreground"}`}>
              {remaining} of 5 remaining
            </span>
          </p>
        </div>

        {/* Rate limit / error banner */}
        <AnimatePresence>
          {rateLimitError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 font-body text-sm"
            >
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              {rateLimitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {loadingDrivers && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {/* Fetch error */}
        {fetchError && !loadingDrivers && (
          <div className="text-center py-12">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="font-body text-sm text-red-600">{fetchError}</p>
            <button
              onClick={() => {
                setFetchError("");
                setLoadingDrivers(true);
                getDrivers(town, stand)
                  .then(setDrivers)
                  .catch(e => setFetchError(e.message))
                  .finally(() => setLoadingDrivers(false));
              }}
              className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all mt-5 text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Driver list */}
        {!loadingDrivers && !fetchError && (
          <div className="space-y-3">
            {drivers.map((driver, i) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="flex items-center gap-4 bg-card rounded-2xl px-5 py-4 border border-border-warm shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              >
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-full ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-heading text-lg font-bold flex-shrink-0`}
                >
                  {driver.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-base font-bold">{driver.name}</span>
                    {driver.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-body font-semibold">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">{driver.autoNumber}</p>
                </div>

                {/* Call button */}
                <button
                  onClick={() => setCallModal(driver)}
                  disabled={remaining <= 0}
                  className="btn-pill bg-primary text-primary-foreground text-sm font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex-shrink-0 disabled:bg-[hsl(var(--cream-dark))] disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Phone size={14} /> Call
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingDrivers && !fetchError && drivers.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-cream-dark rounded-full mx-auto mb-4">
              <Phone size={22} className="text-muted-foreground" />
            </div>
            <p className="font-heading text-lg font-bold">No drivers available</p>
            <p className="font-body text-sm text-muted-foreground mt-1">
              No verified drivers are online at this stand right now.
            </p>
            <p className="font-malayalam text-xs text-muted-foreground mt-1">
              ഈ സ്ഥലത്ത് ഇപ്പോൾ ആരും ലഭ്യമല്ല
            </p>
            <button
              onClick={() => navigate("/home")}
              className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all mt-6"
            >
              Search another stand
            </button>
          </div>
        )}

        {/* Report link */}
        {!loadingDrivers && drivers.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={() => drivers[0] && setReportModal(drivers[0])}
              className="inline-flex items-center gap-2 font-body text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              <AlertTriangle size={14} /> Had a bad experience? Report a driver
            </button>
          </div>
        )}

      </div>

      {/* Modals */}
      <AnimatePresence>
        {callModal && (
          <CallModal
            driverName={callModal.name}
            onCancel={() => !callLoading && setCallModal(null)}
            onConfirm={confirmCall}
            loading={callLoading}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reportModal && (
          <ReportModal driver={reportModal} onClose={() => setReportModal(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}