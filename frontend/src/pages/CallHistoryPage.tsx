import { useNavigate } from "react-router-dom";
import { MOCK_CALL_LOGS } from "@/data/mockData";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function CallHistoryPage() {
  const navigate = useNavigate();

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Call History</h1>
            <p className="font-malayalam text-xs text-muted-foreground mt-0.5">കോൾ ചരിത്രം</p>
          </div>
          <span className="bg-primary/10 text-primary font-body text-xs font-semibold px-3 py-1.5 rounded-full">
            {MOCK_CALL_LOGS.length} calls
          </span>
        </div>

        {/* List */}
        <div className="space-y-3">
          {MOCK_CALL_LOGS.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="bg-card rounded-2xl px-5 py-4 border border-border-warm shadow-card flex items-center gap-4"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${log.reported ? "bg-red-50" : "bg-green-light"}`}>
                <Phone size={16} className={log.reported ? "text-red-500" : "text-green-dark"} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-sm font-bold">{log.driverName}</span>
                  {log.reported ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-body font-semibold">
                      <AlertTriangle size={9} /> Reported
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-body font-semibold">
                      <CheckCircle size={9} /> Completed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground">
                    <MapPin size={11} /> {log.stand}, {log.town}
                  </span>
                  <span className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground">
                    <Clock size={11} /> {log.timestamp}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {MOCK_CALL_LOGS.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-cream-dark rounded-full mx-auto mb-4">
              <Phone size={22} className="text-muted-foreground" />
            </div>
            <p className="font-heading text-lg font-bold">No calls yet</p>
            <p className="font-body text-sm text-muted-foreground mt-1">Your call history will appear here.</p>
            <button
              onClick={() => navigate("/home")}
              className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all mt-6"
            >
              Find Drivers
            </button>
          </div>
        )}

      </div>
    </main>
  );
}