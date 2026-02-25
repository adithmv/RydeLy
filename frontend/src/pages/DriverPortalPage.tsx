import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Phone, MapPin, AlertTriangle,
  ToggleLeft, ToggleRight, CheckCircle, Clock
} from "lucide-react";

export default function DriverPortalPage() {
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const driver = {
    name: "Rajan K",
    phone: "+91 98765 43210",
    autoNumber: "KL-58-A-1234",
    stand: "Railway Station",
    town: "Payyanur",
    isVerified: true,
    warningCount: 0,
    callsThisWeek: 12,
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleToggle = async () => {
    setToggling(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsAvailable((prev) => {
      const next = !prev;
      showToast(
        next
          ? "You are now visible to commuters."
          : "You are now hidden from the directory."
      );
      return next;
    });
    setToggling(false);
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-[640px] mx-auto px-5 space-y-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading text-2xl font-bold">Driver Portal</h1>
          <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
            ഡ്രൈവർ പോർട്ടൽ
          </p>
        </motion.div>

        {/* Availability Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`rounded-card p-7 border-2 transition-all duration-500 ${
            isAvailable
              ? "bg-[#f0fdf4] border-green-300 shadow-[0_4px_24px_rgba(22,163,74,0.15)]"
              : "bg-card border-[#E8DDD0] shadow-card"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Availability
              </p>
              <h2
                className={`font-heading text-2xl font-bold transition-colors duration-300 ${
                  isAvailable ? "text-green-700" : "text-foreground"
                }`}
              >
                {isAvailable ? "You're Available" : "You're Offline"}
              </h2>
              <p className="font-body text-sm text-muted-foreground mt-1">
                {isAvailable
                  ? "Commuters can see you in the directory."
                  : "You are hidden from all commuters."}
              </p>
              <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                {isAvailable
                  ? "ഉപഭോക്താക്കൾക്ക് നിങ്ങളെ കാണാൻ കഴിയും"
                  : "നിങ്ങൾ ഡയറക്ടറിയിൽ ഇല്ല"}
              </p>
            </div>

            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`flex-shrink-0 transition-all duration-300 rounded-full p-1 ${
                toggling
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:scale-105"
              }`}
            >
              {isAvailable ? (
                <ToggleRight size={52} className="text-green-600" strokeWidth={1.5} />
              ) : (
                <ToggleLeft size={52} className="text-muted-foreground" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1.5 rounded-full transition-all duration-300 ${
                isAvailable
                  ? "bg-green-100 text-green-700"
                  : "bg-[hsl(var(--muted))] text-muted-foreground"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  isAvailable ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              {isAvailable ? "Live in directory" : "Hidden from directory"}
            </span>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-card p-6 border border-[#E8DDD0] shadow-card"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center text-white font-heading text-xl font-bold flex-shrink-0">
              {driver.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-lg font-bold">{driver.name}</span>
                {driver.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))] px-2 py-0.5 rounded-full font-body font-semibold">
                    <ShieldCheck size={10} /> Verified
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="font-body text-sm text-muted-foreground">{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="font-body text-sm text-muted-foreground">
                    {driver.stand}, {driver.town}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-muted-foreground font-medium">
                    Auto: {driver.autoNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E8DDD0] grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-heading text-xl font-bold text-primary">{driver.callsThisWeek}</p>
              <p className="font-body text-[11px] text-muted-foreground mt-0.5">Calls this week</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-foreground">{driver.warningCount}/3</p>
              <p className="font-body text-[11px] text-muted-foreground mt-0.5">Warnings</p>
            </div>
            <div>
              <p className={`font-heading text-xl font-bold ${driver.isVerified ? "text-green-600" : "text-amber-500"}`}>
                {driver.isVerified ? "Active" : "Pending"}
              </p>
              <p className="font-body text-[11px] text-muted-foreground mt-0.5">Account status</p>
            </div>
          </div>
        </motion.div>

        {/* Warning notice — only shows if warnings > 0 */}
        {driver.warningCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
          >
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="font-body text-sm text-amber-700">
              You have {driver.warningCount} warning{driver.warningCount > 1 ? "s" : ""}. At 3 warnings your account will be automatically banned.
            </p>
          </motion.div>
        )}

        {/* Report CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card rounded-card p-6 border border-[#E8DDD0] shadow-card"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-base font-bold">Had a bad experience?</h3>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Report a commuter who was rude, abusive, or a no-show after calling.
              </p>
              <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                ഒരു ഉപഭോക്താവിനെ റിപ്പോർട്ട് ചെയ്യുക
              </p>
            </div>
            <button
              onClick={() => navigate("/driver/complaint")}
              className="btn-pill bg-primary text-primary-foreground font-medium shadow-[var(--shadow-orange-glow)] hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all flex-shrink-0 text-sm"
            >
              Report
            </button>
          </div>
        </motion.div>

        {/* Reminder note */}
        <div className="flex items-start gap-2 px-1">
          <Clock size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-muted-foreground">
            Availability does not reset automatically. Remember to mark yourself offline when you're done for the day.
          </p>
        </div>

      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-foreground text-primary-foreground px-5 py-3 rounded-full shadow-modal font-body text-sm font-medium z-50"
          >
            <CheckCircle size={15} className="text-yellow-300" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}