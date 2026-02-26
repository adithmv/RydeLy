import { useState, useEffect, useCallback } from "react";
import {
  adminGetDrivers, adminGetUsers, adminGetLogs,
  adminGetReports, adminVerifyDriver, adminWarn,
  adminRemove, adminResolveReport,
  AdminDriver, AdminUser, AdminLog, AdminReport,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  Users, Car, Phone, AlertTriangle, CheckCircle,
  XCircle, ShieldCheck, Clock, Loader2, RefreshCw,
  Megaphone,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

// ── Stat card ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border-warm shadow-card px-5 py-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className="font-body text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-heading text-2xl font-bold">{value}</p>
      {sub && <p className="font-body text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: AdminDriver["status"] }) {
  const map = {
    verified: "bg-green-light text-green-dark",
    pending: "bg-yellow-100 text-yellow-700",
    banned: "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-body font-semibold ${map[status]}`}>
      {status === "verified" && <ShieldCheck size={9} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Time helper ───────────────────────────────────────────
function fmtTime(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Main component ────────────────────────────────────────
export default function AdminDashboard() {
  const { logout } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"drivers" | "users" | "logs" | "reports" | "announce">("drivers");
  const [driverSubTab, setDriverSubTab] = useState<"pending" | "verified">("pending");

  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [announcement, setAnnouncement] = useState("");
  const [announceSending, setAnnounceSending] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState(false);

  const BASE = "http://127.0.0.1:5000";

  // ── Fetch all data ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [d, u, l, r] = await Promise.all([
        adminGetDrivers(),
        adminGetUsers(),
        adminGetLogs(),
        adminGetReports(),
      ]);
      setDrivers(d as AdminDriver[]);
      setUsers(u as AdminUser[]);
      setLogs(l as AdminLog[]);
      setReports(r as AdminReport[]);
    } catch {
      // individual tabs will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ─────────────────────────────────────────────
  const approveDriver = async (id: string) => {
    setActionLoading(id + "_approve");
    try {
      await adminVerifyDriver(id, true);
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: "verified" } : d));
    } finally { setActionLoading(null); }
  };

  const warnEntity = async (type: "driver" | "user", id: string) => {
    setActionLoading(id + "_warn");
    try {
      await adminWarn(type, id);
      if (type === "driver") {
        setDrivers(prev => prev.map(d => d.id === id ? { ...d, warningCount: d.warningCount + 1 } : d));
      } else {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, reportCount: u.reportCount + 1 } : u));
      }
    } finally { setActionLoading(null); }
  };

  const removeEntity = async (type: "driver" | "user", id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setActionLoading(id + "_remove");
    try {
      await adminRemove(type, id);
      if (type === "driver") setDrivers(prev => prev.filter(d => d.id !== id));
      else setUsers(prev => prev.filter(u => u.id !== id));
    } finally { setActionLoading(null); }
  };

  const resolveReport = async (id: string) => {
    setActionLoading(id + "_resolve");
    try {
      await adminResolveReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, resolved: true } : r));
    } finally { setActionLoading(null); }
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setAnnounceSending(true);
    try {
      await fetch(`${BASE}/admin/announcement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: announcement.trim() }),
      });
      setAnnounceSuccess(true);
      setAnnouncement("");
      setTimeout(() => setAnnounceSuccess(false), 3000);
    } finally { setAnnounceSending(false); }
  };

  // ── Derived ─────────────────────────────────────────────
  const pending = drivers.filter(d => d.status === "pending");
  const verified = drivers.filter(d => d.status === "verified");
  const openReports = reports.filter(r => !r.resolved);

  const TABS = [
    { key: "drivers", label: "Drivers", icon: <Car size={14} /> },
    { key: "users", label: "Users", icon: <Users size={14} /> },
    { key: "logs", label: "Call Logs", icon: <Phone size={14} /> },
    { key: "reports", label: `Reports${openReports.length > 0 ? ` (${openReports.length})` : ""}`, icon: <AlertTriangle size={14} /> },
    { key: "announce", label: "Announce", icon: <Megaphone size={14} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-background">

      {/* Top bar */}
      <div className="bg-foreground text-primary-foreground px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-bold">RydeLy Admin</h1>
          <p className="font-body text-xs text-primary-foreground/60">Management Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 font-body text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="font-body text-xs text-primary-foreground/70 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-[960px] mx-auto px-5 py-8 space-y-6">

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Car size={15} className="text-primary" />} label="Total Drivers" value={drivers.length} sub={`${verified.length} verified`} />
            <StatCard icon={<Clock size={15} className="text-primary" />} label="Pending" value={pending.length} sub="awaiting approval" />
            <StatCard icon={<Users size={15} className="text-primary" />} label="Users" value={users.length} />
            <StatCard icon={<AlertTriangle size={15} className="text-primary" />} label="Open Reports" value={openReports.length} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <>
            {/* Tab bar */}
            <div className="flex gap-1 bg-cream-dark rounded-xl p-1 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-body text-sm font-medium whitespace-nowrap transition-all ${
                    tab === t.key
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── DRIVERS TAB ── */}
            {tab === "drivers" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex gap-2 mb-4">
                  {(["pending", "verified"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setDriverSubTab(st)}
                      className={`px-4 py-1.5 rounded-full font-body text-xs font-semibold transition-all ${
                        driverSubTab === st
                          ? "bg-primary text-primary-foreground"
                          : "bg-cream-dark text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {st === "pending" ? `Pending (${pending.length})` : `Verified (${verified.length})`}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {(driverSubTab === "pending" ? pending : verified).map(driver => (
                    <div key={driver.id} className="bg-card rounded-2xl border border-border-warm shadow-card px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center text-white font-heading font-bold flex-shrink-0">
                          {driver.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading text-base font-bold">{driver.name}</span>
                            <StatusBadge status={driver.status} />
                            {driver.warningCount > 0 && (
                              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-body font-semibold">
                                {driver.warningCount} warning{driver.warningCount > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <p className="font-body text-xs text-muted-foreground mt-0.5">
                            {driver.phone} · {driver.autoNumber}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">
                            {driver.stand}, {driver.town}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {driver.status === "pending" && (
                            <button
                              onClick={() => approveDriver(driver.id)}
                              disabled={actionLoading === driver.id + "_approve"}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg font-body text-xs font-medium hover:bg-green-600 transition-all disabled:opacity-50"
                            >
                              {actionLoading === driver.id + "_approve"
                                ? <Loader2 size={12} className="animate-spin" />
                                : <CheckCircle size={12} />}
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => warnEntity("driver", driver.id)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg font-body text-xs font-medium hover:bg-yellow-200 transition-all disabled:opacity-50"
                          >
                            {actionLoading === driver.id + "_warn"
                              ? <Loader2 size={12} className="animate-spin" />
                              : <AlertTriangle size={12} />}
                            Warn
                          </button>
                          <button
                            onClick={() => removeEntity("driver", driver.id)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg font-body text-xs font-medium hover:bg-red-200 transition-all disabled:opacity-50"
                          >
                            {actionLoading === driver.id + "_remove"
                              ? <Loader2 size={12} className="animate-spin" />
                              : <XCircle size={12} />}
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(driverSubTab === "pending" ? pending : verified).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground font-body text-sm">
                      No {driverSubTab} drivers
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── USERS TAB ── */}
            {tab === "users" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="bg-card rounded-2xl border border-border-warm shadow-card px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-heading font-bold flex-shrink-0">
                      {user.name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-base font-bold">{user.name || "—"}</p>
                      <p className="font-body text-xs text-muted-foreground">{user.phone}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {user.callCount} calls · {user.reportCount} reports filed
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => warnEntity("user", user.id)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg font-body text-xs font-medium hover:bg-yellow-200 transition-all disabled:opacity-50"
                      >
                        {actionLoading === user.id + "_warn"
                          ? <Loader2 size={12} className="animate-spin" />
                          : <AlertTriangle size={12} />}
                        Warn
                      </button>
                      <button
                        onClick={() => removeEntity("user", user.id)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg font-body text-xs font-medium hover:bg-red-200 transition-all disabled:opacity-50"
                      >
                        {actionLoading === user.id + "_remove"
                          ? <Loader2 size={12} className="animate-spin" />
                          : <XCircle size={12} />}
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground font-body text-sm">No users yet</div>
                )}
              </motion.div>
            )}

            {/* ── LOGS TAB ── */}
            {tab === "logs" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="bg-card rounded-2xl border border-border-warm shadow-card px-5 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold">{log.driverName}</p>
                      <p className="font-body text-xs text-muted-foreground">{log.stand}, {log.town}</p>
                      <p className="font-body text-xs text-muted-foreground">Caller: {log.commuterPhone}</p>
                    </div>
                    <div className="flex items-center gap-1 font-body text-[11px] text-muted-foreground flex-shrink-0">
                      <Clock size={11} />
                      {fmtTime(log.timestamp)}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground font-body text-sm">No call logs yet</div>
                )}
              </motion.div>
            )}

            {/* ── REPORTS TAB ── */}
            {tab === "reports" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {reports.map(report => (
                  <div key={report.id} className={`bg-card rounded-2xl border shadow-card px-5 py-4 ${report.resolved ? "border-border-warm opacity-60" : "border-red-200"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${report.resolved ? "bg-green-100" : "bg-red-100"}`}>
                        {report.resolved
                          ? <CheckCircle size={14} className="text-green-600" />
                          : <AlertTriangle size={14} className="text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-body text-sm font-semibold">{report.targetName}</p>
                          <span className="text-[10px] bg-cream-dark text-muted-foreground px-2 py-0.5 rounded-full font-body">
                            {report.type}
                          </span>
                          {report.resolved && (
                            <span className="text-[10px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-body font-semibold">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-muted-foreground mt-0.5">
                          Reported by: {report.reporterPhone}
                        </p>
                        <p className="font-body text-sm text-foreground mt-2 leading-relaxed">{report.reason}</p>
                        <p className="font-body text-[11px] text-muted-foreground mt-1">{fmtTime(report.timestamp)}</p>
                      </div>
                      {!report.resolved && (
                        <button
                          onClick={() => resolveReport(report.id)}
                          disabled={actionLoading === report.id + "_resolve"}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg font-body text-xs font-medium hover:bg-green-600 transition-all disabled:opacity-50 flex-shrink-0"
                        >
                          {actionLoading === report.id + "_resolve"
                            ? <Loader2 size={12} className="animate-spin" />
                            : <CheckCircle size={12} />}
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground font-body text-sm">No reports yet</div>
                )}
              </motion.div>
            )}

            {/* ── ANNOUNCE TAB ── */}
            {tab === "announce" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[560px] space-y-5">
                <div>
                  <h2 className="font-heading text-lg font-bold">Post Announcement</h2>
                  <p className="font-body text-sm text-muted-foreground mt-0.5">
                    This message will be visible to all drivers on their portal
                  </p>
                </div>
                <textarea
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  placeholder="Type your announcement here..."
                  rows={5}
                  className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors resize-none"
                />
                {announcement.trim() && (
                  <div className="bg-card border border-border-warm rounded-xl p-4">
                    <p className="font-body text-[11px] text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Preview</p>
                    <p className="font-body text-sm text-foreground leading-relaxed">{announcement}</p>
                  </div>
                )}
                {announceSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 font-body text-sm">
                    <CheckCircle size={15} /> Announcement sent successfully
                  </div>
                )}
                <button
                  onClick={sendAnnouncement}
                  disabled={!announcement.trim() || announceSending}
                  className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {announceSending
                    ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                    : <><Megaphone size={15} /> Send Announcement</>}
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}