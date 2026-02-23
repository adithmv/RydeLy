import { useState } from "react";
import { MOCK_DRIVERS, MOCK_CALL_LOGS, MOCK_REPORTS } from "@/data/mockData";
import type { Driver, Report, CallLog } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldOff, AlertTriangle, Trash2,
  CheckCircle, Phone, Clock, Users,
  FileText, Megaphone, X
} from "lucide-react";

type Tab = "drivers" | "users" | "logs" | "reports" | "announcement";


const MOCK_USERS = [
  { id: "u1", phone: "+91 xxxxx1234", warningCount: 0, isBanned: false },
  { id: "u2", phone: "+91 xxxxx5678", warningCount: 1, isBanned: false },
  { id: "u3", phone: "+91 xxxxx9101", warningCount: 0, isBanned: true },
];

export default function AdminDashboard() {
    const [driverSubTab, setDriverSubTab] = useState<"verified" | "unverified">("unverified");
  const [activeTab, setActiveTab] = useState<Tab>("drivers");
  const [drivers, setDrivers] = useState<Driver[]>([...MOCK_DRIVERS]);
  const [reports, setReports] = useState<Report[]>([...MOCK_REPORTS]);
  const [users, setUsers] = useState(MOCK_USERS);
  const [announcement, setAnnouncement] = useState("");
  const [postedAnnouncement, setPostedAnnouncement] = useState("");
  const [announcementSaved, setAnnouncementSaved] = useState(false);

  const totalDrivers = drivers.length;
  const verified = drivers.filter(d => d.status === "verified").length;
  const pending = drivers.filter(d => d.status === "pending").length;
  const openReports = reports.filter(r => r.status === "pending").length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "drivers", label: "Drivers", icon: <ShieldCheck size={14} /> },
    { id: "users", label: "Users", icon: <Users size={14} /> },
    { id: "logs", label: "Call Logs", icon: <Phone size={14} /> },
    { id: "reports", label: "Reports", icon: <FileText size={14} /> },
    { id: "announcement", label: "Announcement", icon: <Megaphone size={14} /> },
  ];

  // Driver actions
  const toggleVerify = (id: string) => {
    setDrivers(ds => ds.map(d => d.id === id
      ? { ...d, isVerified: !d.isVerified, status: d.isVerified ? "pending" as const : "verified" as const }
      : d
    ));
  };

  const warnDriver = (id: string) => {
    setDrivers(ds => ds.map(d => {
      if (d.id !== id) return d;
      const wc = d.warningCount + 1;
      return { ...d, warningCount: wc, status: wc >= 3 ? "banned" as const : d.status };
    }));
  };

  const removeDriver = (id: string) => setDrivers(ds => ds.filter(d => d.id !== id));

  // User actions
  const warnUser = (id: string) => {
    setUsers(us => us.map(u => {
      if (u.id !== id) return u;
      const wc = u.warningCount + 1;
      return { ...u, warningCount: wc, isBanned: wc >= 3 };
    }));
  };

  const banUser = (id: string) => setUsers(us => us.map(u => u.id === id ? { ...u, isBanned: true } : u));

  // Report actions
  const resolveReport = (id: string) => {
    setReports(rs => rs.map(r => r.id === id ? { ...r, status: "resolved" as const } : r));
  };

  // Announcement
  const handlePostAnnouncement = () => {
    if (announcement.trim()) {
      setPostedAnnouncement(announcement.trim());
      setAnnouncementSaved(true);
      setTimeout(() => setAnnouncementSaved(false), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-[1100px] mx-auto px-5">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
          <p className="font-malayalam text-xs text-muted-foreground mt-0.5">അഡ്മിൻ ഡാഷ്ബോർഡ്</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Drivers", value: totalDrivers, color: "text-foreground" },
            { label: "Verified", value: verified, color: "text-green-dark" },
            { label: "Pending", value: pending, color: "text-amber-dark" },
            { label: "Total Calls", value: MOCK_CALL_LOGS.length, color: "text-primary" },
            { label: "Open Reports", value: openReports, color: "text-red-500" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-card p-5 shadow-card border border-border-warm text-center">
              <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 btn-pill text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-foreground text-primary-foreground"
                  : "bg-card text-foreground border border-border-warm hover:border-primary hover:text-primary"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-card shadow-card border border-border-warm overflow-hidden"
          >

            {/* DRIVERS TAB */}
            {activeTab === "drivers" && (
  <div>
    {/* Sub tabs */}
    <div className="flex border-b border-border-warm">
      <button
        onClick={() => setDriverSubTab("unverified")}
        className={`px-6 py-3 font-body text-sm font-medium transition-all ${
          driverSubTab === "unverified"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Pending Approval ({drivers.filter(d => d.status === "pending").length})
      </button>
      <button
        onClick={() => setDriverSubTab("verified")}
        className={`px-6 py-3 font-body text-sm font-medium transition-all ${
          driverSubTab === "verified"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Verified Drivers ({drivers.filter(d => d.status === "verified").length})
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-foreground text-primary-foreground">
            {["Name", "Phone", "Auto No.", "Stand", "Town", "Warnings", "Actions"].map(h => (
              <th key={h} className="text-left p-4 font-heading font-bold text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drivers
            .filter(d => driverSubTab === "verified" ? d.status === "verified" : d.status === "pending" || d.status === "banned")
            .map((d, i) => (
              <tr key={d.id} className={`border-t border-border-warm ${i % 2 === 0 ? "bg-background" : "bg-card"}`}>
                <td className="p-4 font-body font-medium">{d.name}</td>
                <td className="p-4 font-body text-xs font-medium text-primary">+91 98765{d.id.padStart(5, "0")}</td>
                <td className="p-4 font-body text-muted-foreground text-xs">{d.autoNumber}</td>
                <td className="p-4 font-body text-muted-foreground text-xs">{d.stand}</td>
                <td className="p-4 font-body text-muted-foreground text-xs">{d.town}</td>
                <td className="p-4 font-body text-muted-foreground text-xs">{d.warningCount} / 3</td>
                <td className="p-4">
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => toggleVerify(d.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg font-body font-semibold bg-green-light text-green-dark border border-green-dark/20 hover:bg-green-dark hover:text-white transition-all"
                    >
                      {d.isVerified ? <><ShieldOff size={10} /> Unverify</> : <><ShieldCheck size={10} /> Approve</>}
                    </button>
                    <button
                      onClick={() => warnDriver(d.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg font-body font-semibold bg-amber-light text-amber-dark border border-amber-dark/20 hover:bg-amber-dark hover:text-white transition-all"
                    >
                      <AlertTriangle size={10} /> Warn
                    </button>
                    <button
                      onClick={() => removeDriver(d.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg font-body font-semibold bg-red-light text-red-dark border border-red-dark/20 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={10} /> Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {drivers.filter(d => driverSubTab === "verified" ? d.status === "verified" : d.status === "pending" || d.status === "banned").length === 0 && (
        <div className="text-center py-10">
          <p className="font-body text-sm text-muted-foreground">No drivers in this category.</p>
        </div>
      )}
    </div>
  </div>
)}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-foreground text-primary-foreground">
                      {["Phone", "Status", "Warnings", "Actions"].map(h => (
                        <th key={h} className="text-left p-4 font-heading font-bold text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} className={`border-t border-border-warm ${i % 2 === 0 ? "bg-background" : "bg-card"}`}>
                        <td className="p-4 font-body font-medium">{u.phone}</td>
                        <td className="p-4">
                          {u.isBanned ? (
                            <span className="text-[10px] bg-red-light text-red-dark px-2 py-0.5 rounded-full font-body font-semibold">Banned</span>
                          ) : (
                            <span className="text-[10px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-body font-semibold">Active</span>
                          )}
                        </td>
                        <td className="p-4 font-body text-muted-foreground text-xs">{u.warningCount} / 3</td>
                        <td className="p-4">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => warnUser(u.id)}
                              disabled={u.isBanned}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg font-body font-semibold bg-amber-light text-amber-dark border border-amber-dark/20 hover:bg-amber-dark hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <AlertTriangle size={10} /> Warn
                            </button>
                            <button
                              onClick={() => banUser(u.id)}
                              disabled={u.isBanned}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg font-body font-semibold bg-red-light text-red-dark border border-red-dark/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <X size={10} /> Ban
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* CALL LOGS TAB */}
            {activeTab === "logs" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-foreground text-primary-foreground">
                      {["User", "Driver", "Stand", "Town", "Time", "Reported"].map(h => (
                        <th key={h} className="text-left p-4 font-heading font-bold text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CALL_LOGS.map((log: CallLog, i: number) => (
                      <tr key={log.id} className={`border-t border-border-warm ${i % 2 === 0 ? "bg-background" : "bg-card"}`}>
                        <td className="p-4 font-body text-muted-foreground text-xs">+91 xxxxx{(i + 1).toString().padStart(4, "0")}</td>
                        <td className="p-4 font-body font-medium">{log.driverName}</td>
                        <td className="p-4 font-body text-muted-foreground text-xs">{log.stand}</td>
                        <td className="p-4 font-body text-muted-foreground text-xs">{log.town}</td>
                        <td className="p-4 font-body text-muted-foreground text-xs">
                          <span className="inline-flex items-center gap-1"><Clock size={10} /> {log.timestamp}</span>
                        </td>
                        <td className="p-4">
                          {log.reported ? (
                            <span className="text-[10px] bg-red-light text-red-dark px-2 py-0.5 rounded-full font-body font-semibold">Yes</span>
                          ) : (
                            <span className="text-[10px] bg-green-light text-green-dark px-2 py-0.5 rounded-full font-body font-semibold">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === "reports" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-foreground text-primary-foreground">
                      {["Reporter", "Driver", "Reason", "Time", "Status", "Action"].map(h => (
                        <th key={h} className="text-left p-4 font-heading font-bold text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r: Report, i: number) => (
                      <tr key={r.id} className={`border-t border-border-warm ${i % 2 === 0 ? "bg-background" : "bg-card"}`}>
                        <td className="p-4 font-body text-muted-foreground text-xs">{r.reporterPhone}</td>
                        <td className="p-4 font-body font-medium">{r.driverName}</td>
                        <td className="p-4 font-body text-muted-foreground text-xs max-w-[180px] truncate">{r.reason}</td>
                        <td className="p-4 font-body text-muted-foreground text-xs">{r.timestamp}</td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-body font-semibold capitalize ${r.status === "pending" ? "bg-amber-light text-amber-dark" : "bg-green-light text-green-dark"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {r.status === "pending" && (
                            <button
                              onClick={() => resolveReport(r.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg font-body font-semibold bg-green-light text-green-dark border border-green-dark/20 hover:bg-green-dark hover:text-white transition-all"
                            >
                              <CheckCircle size={10} /> Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ANNOUNCEMENT TAB */}
            {activeTab === "announcement" && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="font-heading text-lg font-bold">Post Announcement</h2>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    This will be shown to all commuters on the home page.
                  </p>
                  <p className="font-malayalam text-xs text-muted-foreground mt-0.5">
                    എല്ലാ ഉപഭോക്താക്കൾക്കും ഒരു അറിയിപ്പ് അയക്കുക
                  </p>
                </div>

                <textarea
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  placeholder="Type your announcement here... (e.g. Service will be unavailable on Sunday 9AM–12PM for maintenance)"
                  rows={5}
                  className="w-full px-4 py-3 bg-cream-dark border-2 border-border-warm rounded-xl font-body text-sm focus:border-primary outline-none transition-colors resize-none"
                />

                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={!announcement.trim()}
                    className="btn-pill bg-primary text-primary-foreground font-medium shadow-orange-glow hover:bg-[hsl(var(--yellow))] hover:text-foreground transition-all disabled:bg-[hsl(var(--cream-dark))] disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    <Megaphone size={15} /> Post Announcement
                  </button>

                  {announcement && (
                    <button
                      onClick={() => setAnnouncement("")}
                      className="font-body text-sm text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}

                  <AnimatePresence>
                    {announcementSaved && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-1 font-body text-sm text-green-dark"
                      >
                        <CheckCircle size={14} /> Posted!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Current announcement preview */}
                {postedAnnouncement && (
                  <div className="mt-4">
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Current Live Announcement</p>
                    <div className="flex items-start gap-3 bg-amber-light border border-amber-dark/20 rounded-xl px-4 py-4">
                      <Megaphone size={16} className="text-amber-dark flex-shrink-0 mt-0.5" />
                      <p className="font-body text-sm text-amber-dark">{postedAnnouncement}</p>
                      <button
                        onClick={() => setPostedAnnouncement("")}
                        className="ml-auto text-amber-dark hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}