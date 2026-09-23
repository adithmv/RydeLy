import LiveRiderPage from "@/pages/LiveRiderPage";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import HomePage from "@/pages/HomePage";
import DriverListingPage from "@/pages/DriverListingPage";
import DriverRegistrationPage from "@/pages/DriverRegistrationPage";
import DriverEarningsPage from "@/pages/DriverEarningsPage";
import { lazy, Suspense } from "react";
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
import CallHistoryPage from "@/pages/CallHistoryPage";
import LiveDriverPage from "@/pages/LiveDriverPage";
import DriverComplaintPage from "@/pages/DriverComplaintPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Separate component so we can use useLocation inside BrowserRouter
function AppLayout() {
  const { pathname } = useLocation();
  const hideFooter =
    pathname === "/admin" ||
    pathname === "/admin/dashboard" ||
    pathname === "/home" ||
    pathname === "/driver/portal";

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes — redirect away if already logged in */}
        <Route
          path="/login"
          element={
            <ProtectedRoute redirectIfAuth>
              <LoginPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={<DriverRegistrationPage />}
        />

        {/* Admin login — auto-redirects to dashboard */}
        <Route
          path="/admin"
          element={<AdminLoginPage />}
        />

        {/* Commuter routes — must be logged in */}
        <Route
          path="/home"
          element={
            <ProtectedRoute requireAuth>
              <LiveRiderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute requireAuth>
              <DriverListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute requireAuth>
              <CallHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stands"
          element={
            <ProtectedRoute requireAuth>
              <HomePage />
            </ProtectedRoute>
          }
        />
        {/* Admin dashboard — direct access without authentication */}
        <Route
          path="/admin/dashboard"
          element={
            <Suspense
              fallback={<p className="demo-page">Loading management…</p>}
            >
              <AdminDashboard />
            </Suspense>
          }
        />

        {/* Driver routes — must be logged in AND driver */}
        <Route
          path="/driver/portal"
          element={
            <ProtectedRoute requireAuth requireDriver>
              <LiveDriverPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/earnings"
          element={
            <ProtectedRoute requireAuth requireDriver>
              <DriverEarningsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/complaint"
          element={
            <ProtectedRoute requireAuth requireDriver>
              <DriverComplaintPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppLayout />
          </ErrorBoundary>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
