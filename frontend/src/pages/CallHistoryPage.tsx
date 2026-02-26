import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCallHistory, CallLog } from "@/lib/api";
import { motion } from "framer-motion";
import { Phone, AlertTriangle, ShieldCheck, Clock, ArrowLeft, Loader2 } from "lucide-react";

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function CallHistoryPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCallHistory()
      .then(setLogs)
      .catch(err => setError(err.message || "Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-[680px] mx-auto px-5">

        {/* Back */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to search
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold">Call History</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">Your recent driver calls</p>
          <p className="font-malayalam text-xs text-muted-foreground mt-0.5">കഴിഞ്ഞ കോളുകൾ</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-body text-sm">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Log list */}
        {!loading && !error && logs.length > 0 && (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-4 bg-card rounded-2xl px-5 py-4 border border-border-warm shadow-card"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-base font-bold truncate">{log.driverName}</p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    {log.stand} · {log.town}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1 font-body text-[11px] text-muted-foreground">
                    <Clock size={11} />
                    {timeAgo(log.timestamp)}
                  </div>
                  {log.wasReported ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-body font-semibold">
                      <AlertTriangle size={9} /> Reported
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-body font-semibold">
                      <ShieldCheck size={9} /> Safe
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-cream-dark rounded-full mx-auto mb-4">
              <Phone size={22} className="text-muted-foreground" />
            </div>
            <p className="font-heading text-lg font-bold">No calls yet</p>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Your call history will appear here once you start using RydeLy.
            </p>
            <p className="font-malayalam text-xs text-muted-foreground mt-1">
              കോൾ ചരിത്രം ഇവിടെ കാണാം
            </p>
            <button
              onClick={() => navigate("/home")}
              className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all mt-6"
            >
              Find a driver
            </button>
          </div>
        )}

      </div>
    </main>
  );
}