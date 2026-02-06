import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingProvider } from './context/BookingContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { SoundProvider } from './context/SoundContext';
import { AdminProvider } from './context/AdminContext';
import { TechnicianProvider } from './context/TechnicianContext';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ServicesPage from './pages/Services/ServicesPage';
import ServiceDetailsPage from './pages/Services/ServiceDetailsPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import MobileSearchPage from './pages/Search/MobileSearchPage';
import TransportPage from './pages/Services/TransportPage';
import HouseShiftingPage from './pages/Services/HouseShiftingPage';
import SavedServicesPage from './pages/Saved/SavedServicesPage';
import AddressesPage from './pages/Profile/AddressesPage';
import AIChatBot from './components/mobile/AIChatBot';
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CareersPage from './pages/Static/CareersPage';
import ContactPage from './pages/Static/ContactPage';
import PartnerLandingPage from './pages/BeAPartner/PartnerLandingPage';
import TechnicianRegisterPage from './pages/BeAPartner/TechnicianRegisterPage';
import TechnicianOnboardingPage from './pages/BeAPartner/TechnicianOnboardingPage';
import TechnicianDashboard from './pages/Technician/TechnicianDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleResize = (e) => setIsMobile(e.matches);

    mediaQuery.addEventListener('change', handleResize);
    // Initial check
    setIsMobile(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  return (
    <div
      className="bg-white dark:bg-slate-950 transition-colors duration-300"
      style={isMobile ? { position: 'relative', minHeight: '100vh', overflowX: 'hidden' } : {}}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={isMobile ? location.pathname : 'desktop-view'}
          initial={isMobile ? { opacity: 0 } : false}
          animate={isMobile ? { opacity: 1 } : false}
          exit={isMobile ? { opacity: 0 } : false}
          transition={{ duration: 0.05 }}
          className={isMobile ? "mobile-page-transition" : ""}
          style={isMobile ? {
            position: 'relative',
            width: '100%',
            minHeight: '100vh',
            zIndex: 0
          } : {}}
        >
          <Routes location={location}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="services/:id" element={<ServiceDetailsPage />} />
              <Route path="search" element={<MobileSearchPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="saved" element={<SavedServicesPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="transport" element={<TransportPage />} />
              <Route path="houseshifting" element={<HouseShiftingPage />} />
              <Route path="careers" element={<CareersPage />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />


            {/* Technician Routes */}
            <Route path="/partner" element={<PartnerLandingPage />} />
            <Route path="/partner/register" element={<TechnicianRegisterPage />} />
            <Route path="/technician/onboarding" element={
              <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                <TechnicianOnboardingPage />
              </ProtectedRoute>
            } />
            <Route path="/technician/dashboard" element={
              <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />

            {/* Isolated Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<AdminLoginPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <AIChatBot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BookingProvider>
          <AdminProvider>
            <TechnicianProvider>
              <ThemeProvider>
                <SoundProvider>
                  <Router>
                    <AnimatedRoutes />
                    <Toaster position="top-center" />
                  </Router>
                </SoundProvider>
              </ThemeProvider>
            </TechnicianProvider>
          </AdminProvider>
        </BookingProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
