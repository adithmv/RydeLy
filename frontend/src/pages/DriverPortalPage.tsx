import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAvailability } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, ShieldCheck, AlertTriangle, LogOut,
  CheckCircle, XCircle, Loader2, Car
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface DriverProfile {
  name: string;
  phone: string;
  stand: string;
  town: string;
  autoNumber: string;
  isAvailable: boolean;
  warningCount: number;
  callsThisWeek: number;
  status: "verified" | "pending" | "banned";
}

const BASE = "http://127.0.0.1:5000";

export default function DriverPortalPage() {
  const navigate = useNavigate();
  const { logout } = useApp();

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch driver profile ──────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/driver/profile`, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((data: DriverProfile) => setProfile(data))
      .catch(err => setFetchError(err.message))
      .finally(() => setLoadingProfile(false));
  }, []);

  // ── Auto-dismiss toast ────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Toggle availability ───────────────────────────────────
  const handleToggle = async () => {
    if (!profile || toggling) return;
    setToggling(true);
    const newVal = !profile.isAvailable;
    try {
      await setAvailability(newVal);
      setProfile(prev => prev ? { ...prev, isAvailable: newVal } : prev);
      setToast({
        msg: newVal ? "You are now visible to commuters" : "You are now offline",
        type: "success",
      });
    } catch (err: unknown) {
      setToast({
        msg: err instanceof Error ? err.message : "Failed to update availability",
        type: "error",
      });
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" });
    logout();
    navigate("/login");
  };

  // ── Loading ───────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </main>
    );
  }

  // ── Fetch error ───────────────────────────────────────────
  if (fetchError || !profile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center space-y-4">
          <AlertTriangle size={32} className="text-red-400 mx-auto" />
          <p className="font-body text-sm text-red-600">{fetchError || "Profile not found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-full font-body text-sm font-medium shadow-lg flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-foreground text-primary-foreground"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success"
              ? <CheckCircle size={15} />
              : <XCircle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[520px] mx-auto px-5 space-y-5">

        {/* Profile card */}
        <div className="bg-card rounded-card border border-border-warm shadow-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center text-white font-heading text-2xl font-bold flex-shrink-0">
              {profile.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl font-bold">{profile.name}</h1>
                {profile.status === "verified" && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-body font-semibold">
                    <ShieldCheck size={10} /> Verified
                  </span>
                )}
                {profile.status === "pending" && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-body font-semibold">
                    Pending Approval
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Phone size={12} className="text-muted-foreground" />
                <p className="font-body text-sm text-muted-foreground">+91 {profile.phone}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Car size={12} className="text-muted-foreground" />
                <p className="font-body text-xs text-muted-foreground">{profile.autoNumber} · {profile.stand}, {profile.town}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-warm">
            {[
              { label: "Calls this week", value: profile.callsThisWeek },
              { label: "Warnings", value: profile.warningCount },
              { label: "Status", value: profile.status === "verified" ? "Active" : "Pending" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="font-heading text-xl font-bold">{stat.value}</p>
                <p className="font-body text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning notice */}
        {profile.warningCount > 0 && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-yellow-800">
                You have {profile.warningCount} warning{profile.warningCount > 1 ? "s" : ""}
              </p>
              <p className="font-body text-xs text-yellow-700 mt-0.5">
                3 warnings will result in account removal. Please ensure professional conduct.
              </p>
            </div>
          </div>
        )}

        {/* Availability toggle card */}
        <div className="bg-card rounded-card border border-border-warm shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold">Availability</h2>
              <p className="font-malayalam text-xs text-muted-foreground mt-0.5">ലഭ്യത</p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                {profile.isAvailable
                  ? "You are visible to commuters"
                  : "You are currently offline"}
              </p>
            </div>

            {/* Toggle */}
            <button
              onClick={handleToggle}
              disabled={toggling || profile.status !== "verified"}
              className="relative flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Toggle availability"
            >
              {toggling ? (
                <div className="w-16 h-9 rounded-full bg-cream-dark flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-muted-foreground" />
                </div>
              ) : (
                <motion.div
                  className={`w-16 h-9 rounded-full flex items-center transition-colors duration-300 ${
                    profile.isAvailable ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    className="w-7 h-7 bg-white rounded-full shadow-md mx-1"
                    animate={{ x: profile.isAvailable ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.div>
              )}
            </button>
          </div>

          {profile.status !== "verified" && (
            <p className="font-body text-xs text-muted-foreground mt-3 bg-cream-dark rounded-lg px-3 py-2">
              Availability toggle is disabled until your account is approved by an admin.
            </p>
          )}

          <p className="font-body text-[11px] text-muted-foreground mt-3">
            Remember to turn off availability when you finish for the day.
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/driver/complaint")}
            className="btn-pill bg-card border border-border-warm text-foreground font-body text-sm font-medium hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle size={14} /> File a Complaint
          </button>
          <button
            onClick={handleLogout}
            className="btn-pill bg-card border border-border-warm text-foreground font-body text-sm font-medium hover:border-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

      </div>
    </main>
  );
}