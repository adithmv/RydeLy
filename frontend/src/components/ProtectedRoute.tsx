import { Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;     // must be logged in
  requireAdmin?: boolean;    // must be admin
  requireDriver?: boolean;   // must be driver
  redirectIfAuth?: boolean;  // kick out if already logged in (login/register pages)
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireDriver = false,
  redirectIfAuth = false,
}: ProtectedRouteProps) {
  const { isLoggedIn, isAdmin, isDriver } = useApp();

  // Already logged in trying to visit /login or /register
  if (redirectIfAuth && isLoggedIn) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isDriver) return <Navigate to="/driver/portal" replace />;
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