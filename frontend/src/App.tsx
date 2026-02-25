import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import DriverListingPage from '@/pages/DriverListingPage';
import DriverRegistrationPage from '@/pages/DriverRegistrationPage';
import AdminDashboard from '@/pages/AdminDashboard';
import CallHistoryPage from '@/pages/CallHistoryPage';
import DriverPortalPage from '@/pages/DriverPortalPage';
import DriverComplaintPage from '@/pages/DriverComplaintPage';
import NotFound from '@/pages/NotFound';


const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/"                 element={<LandingPage />} />
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/home"             element={<HomePage />} />
            <Route path="/drivers"          element={<DriverListingPage />} />
            <Route path="/register"         element={<DriverRegistrationPage />} />
            <Route path="/admin"            element={<AdminDashboard />} />
            <Route path="/history"          element={<CallHistoryPage />} />
            <Route path="/driver/portal"    element={<DriverPortalPage />} />
            <Route path="/driver/complaint" element={<DriverComplaintPage />} />
            <Route path="*" element={<NotFound />} />
            
          </Routes>
          <Footer />
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}