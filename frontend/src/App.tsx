import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import DriverListingPage from "@/pages/DriverListingPage";
import DriverRegistrationPage from "@/pages/DriverRegistrationPage";
import AdminDashboard from "@/pages/AdminDashboard";
import CallHistoryPage from "@/pages/CallHistoryPage";
import DriverPortalPage from "@/pages/DriverPortalPage";
import DriverComplaintPage from "@/pages/DriverComplaintPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Separate component so we can use useLocation inside BrowserRouter
function AppLayout() {
  const { pathname } = useLocation();
  const hideFooter = pathname === "/admin";

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
          element={
            <ProtectedRoute redirectIfAuth>
              <DriverRegistrationPage />
            </ProtectedRoute>
          }
        />

        {/* Commuter routes — must be logged in */}
        <Route
          path="/home"
          element={
            <ProtectedRoute requireAuth>
              <HomePage />
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

        {/* Admin routes — must be logged in AND admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAuth requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Driver routes — must be logged in AND driver */}
        <Route
          path="/driver/portal"
          element={
            <ProtectedRoute requireAuth requireDriver>
              <DriverPortalPage />
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
          <AppLayout />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}