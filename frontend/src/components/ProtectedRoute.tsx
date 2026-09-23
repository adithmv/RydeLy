import { Navigate } from "react-router-dom";
import { useApp } from "@/context/app-state";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;     // must be logged in
  requireAdmin?: boolean;    // must be admin
  requireDriver?: boolean;   // must be driver
  redirectIfAuth?: boolean;  // kick out if already logged in (login/register pages)
  allowCommuter?: boolean;   // allow commuters (riders) through when redirectIfAuth
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireDriver = false,
  redirectIfAuth = false,
  allowCommuter = false,
}: ProtectedRouteProps) {
  const { isLoggedIn, isAdmin, isDriver, authLoading } = useApp();

  if (authLoading) return <main className="demo-page" role="status">Checking your session…</main>;

  // Already logged in trying to visit /login or /register
  if (redirectIfAuth && isLoggedIn) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    if (isDriver) return <Navigate to="/driver/portal" replace />;
    if (allowCommuter) return <>{children}</>; // Allow commuters to register as driver
    return <Navigate to="/home" replace />;
  }

  // Not logged in trying to visit protected page
  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin trying to visit /admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // Logged in but not driver trying to visit /driver/*
  if (requireDriver && !isDriver) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}