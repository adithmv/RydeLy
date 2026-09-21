import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDriverEarnings, type DriverEarnings } from "@/lib/api";
import { Clock, Calendar, CalendarDays, Wallet, Star, TrendingUp, RefreshCw, ArrowLeft } from "lucide-react";
import "./live.css";

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function DriverEarningsPage() {
  const [period, setPeriod] = useState<"today" | "thisWeek" | "thisMonth" | "allTime">("allTime");

  const earningsQuery = useQuery({
    queryKey: ["driver-earnings"],
    queryFn: getDriverEarnings,
    refetchInterval: 30000,
    retry: 1,
  });

  const data = earningsQuery.data;
  const loading = earningsQuery.isLoading;
  const error = earningsQuery.error;

  const currentTotal = data?.summary[period] ?? 0;
  const rideHistory = data?.rides ?? [];

  const handleRefresh = () => {
    earningsQuery.refetch();
  };

  return (
    <main className="live-app">
      <header className="live-subnav">
        <div className="flex items-center gap-3">
          <Link to="/driver/portal" className="live-link">
            <ArrowLeft size={18} /> Back to Portal
          </Link>
          <strong>Earnings Dashboard</strong>
        </div>
        <button
          className="live-secondary"
          onClick={handleRefresh}
          disabled={earningsQuery.isFetching}
        >
          <RefreshCw size={14} className={earningsQuery.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      <div className="live-layout">
        <aside className="live-booking">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <RefreshCw size={32} className="animate-spin text-primary mb-4" />
              <p className="live-muted">Loading your earnings…</p>
            </div>
          ) : error ? (
            <div role="alert" className="text-center py-8">
              <p className="live-error mb-4">{error.message}</p>
              <button className="live-secondary" onClick={handleRefresh}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : (
            <>
              {/* Period Selector */}
              <div className="mb-6">
                <p className="live-eyebrow">SELECT PERIOD</p>
                <div className="period-tabs flex gap-2">
                  {[
                    { key: "today", label: "Today", icon: <Calendar size={14} /> },
                    { key: "thisWeek", label: "This Week", icon: <CalendarDays size={14} /> },
                    { key: "thisMonth", label: "This Month", icon: <Clock size={14} /> },
                    { key: "allTime", label: "All Time", icon: <TrendingUp size={14} /> },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPeriod(p.key as typeof period)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all ${
                        period === p.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-cream-dark text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Earnings Card */}
              <div className="earnings-main-card bg-gradient-to-br from-primary to-yellow rounded-2xl p-6 text-primary-foreground mb-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm opacity-80">Estimated Earnings</p>
                    <p className="text-4xl font-bold font-heading">{formatCurrency(currentTotal)}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {data?.summary.rideCount ?? 0} completed rides · Cash fares (not verified payments)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-2">
                      <Star size={16} fill="currentColor" />
                      <span className="font-bold">
                        {data?.summary.averageRating !== null
                          ? data?.summary.averageRating.toFixed(1)
                          : "—"}
                      </span>
                      <span className="text-xs opacity-70">avg rating</span>
                    </div>
                    <p className="text-xs opacity-70">
                      {data?.summary.rideCount ?? 0} total rides
                    </p>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-primary-foreground/20">
                  {[
                    { label: "Today", value: data?.summary.today ?? 0, icon: <Calendar size={16} /> },
                    { label: "This Week", value: data?.summary.thisWeek ?? 0, icon: <CalendarDays size={16} /> },
                    { label: "This Month", value: data?.summary.thisMonth ?? 0, icon: <Clock size={16} /> },
                    { label: "All Time", value: data?.summary.allTime ?? 0, icon: <TrendingUp size={16} /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-primary-foreground/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {stat.icon}
                        <span className="text-xs opacity-70">{stat.label}</span>
                      </div>
                      <p className="text-xl font-bold">{formatCurrency(stat.value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ride History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg font-bold">Completed Rides</h2>
                  <span className="text-sm text-muted-foreground">
                    {rideHistory.length} ride{rideHistory.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {rideHistory.length === 0 ? (
                  <div className="text-center py-12 bg-cream-dark rounded-xl border border-border-warm">
                    <Wallet size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-body text-muted-foreground">No completed rides yet</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">Complete rides to see your earnings history</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {rideHistory.map((ride) => (
                      <div
                        key={ride.rideId}
                        className="bg-card rounded-xl border border-border-warm p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-heading text-base font-bold text-foreground">
                                {formatCurrency(ride.fare)}
                              </span>
                              {ride.rating && (
                                <span className="flex items-center gap-1 text-yellow-500">
                                  <Star size={12} fill="currentColor" />
                                  <span className="font-bold text-sm">{ride.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                            <p className="font-body text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {formatDuration(ride.durationSeconds)}
                              </span>
                              <span className="text-muted-foreground">·</span>
                              <span className="flex items-center gap-1">
                                <TrendingUp size={10} /> {ride.distanceKm.toFixed(1)} km
                              </span>
                            </p>
                            <p className="font-body text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <span>{formatDate(ride.completedAt)} at {formatTime(ride.completedAt)}</span>
                            </p>
                            <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-1">
                              {ride.pickup.label} → {ride.destination.label}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="font-body text-sm text-amber-800">
                      <p className="font-medium mb-1">Important: Estimated Earnings Only</p>
                      <p>
                        These figures represent the agreed cash fares for completed rides.
                        They are <strong>not verified payments</strong> — actual cash collection
                        is not tracked by the platform. A payment gateway integration would
                        be required for verified income tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>

        <section className="live-map-panel">
          <div className="flex items-center justify-center h-full bg-cream-dark">
            <div className="text-center text-muted-foreground">
              <Wallet size={64} className="mx-auto mb-4 opacity-50" />
              <p className="font-body">Earnings view — no map</p>
              <p className="font-body text-xs mt-1">Switch to the Portal tab for live navigation</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}