import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { BookingProvider } from './context/BookingContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { SoundProvider, useSound } from './context/SoundContext';
import { AdminProvider } from './context/AdminContext';
import { TechnicianProvider } from './context/TechnicianContext';
import MainLayout from './layouts/MainLayout';
import { Toaster, toast } from 'react-hot-toast'; // Import Toaster & toast
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
import PaymentMethodsPage from './pages/Profile/PaymentMethodsPage';
import ReviewManager from './components/ReviewManager';
import AIChatBot from './components/mobile/AIChatBot';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/Admin/AdminOverview';
import AdminToggles from './pages/Admin/AdminToggles';
import AdminTechnicians from './pages/Admin/AdminTechnicians';
import AdminBookings from './pages/Admin/AdminBookings';
import AdminServices from './pages/Admin/AdminServices';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminReasons from './pages/Admin/AdminReasons';
import AdminFeedback from './pages/Admin/AdminFeedback';
import AdminCategories from './pages/Admin/AdminCategories';
import AdminRolesPanel from './pages/Admin/AdminRolesPanel';
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import AdminHeroSettings from './pages/Admin/AdminHeroSettings';
import CareersPage from './pages/Static/CareersPage';
import ContactPage from './pages/Static/ContactPage';
import AboutUsPage from './pages/Static/AboutUsPage';
import ScrollToTop from './components/common/ScrollToTop';

import PartnerLandingPage from './pages/BeAPartner/PartnerLandingPage';
import TechnicianRegisterPage from './pages/BeAPartner/TechnicianRegisterPage';
import TechnicianOnboardingPage from './pages/BeAPartner/TechnicianOnboardingPage';
import TechnicianDashboard from './pages/Technician/TechnicianDashboard';
import TechnicianLoginPage from './pages/Technician/TechnicianLoginPage';
import NotFoundPage from './pages/Static/NotFoundPage';
import MaintenancePage from './pages/Static/MaintenancePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import client from './api/client';
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

import UserRoutes from './routes/UserRoutes';
import TechnicianRoutes from './routes/TechnicianRoutes';

function AnimatedRoutes() {
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [maintenance, setMaintenance] = React.useState({ active: false, message: '', endTime: null });
  const { user } = useUser();

  const appType = import.meta.env.VITE_APP_TYPE || 'ALL'; // Modes: USER, TECH, ALL

  React.useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await client.get('/maintenance-status');
        if (res.data.status === 'success' && res.data.data.settings.maintenanceMode) {
          setMaintenance({
            active: true,
            message: res.data.data.settings.maintenanceMessage,
            endTime: res.data.data.settings.maintenanceEndTime
          });
        } else {
          setMaintenance(prev => ({ ...prev, active: false }));
        }
      } catch (err) {
        console.error("Failed to fetch maintenance status", err);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleResize = (e) => setIsMobile(e.matches);

    mediaQuery.addEventListener('change', handleResize);
    setIsMobile(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // Show maintenance page if active and user is not an admin, and not on admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (maintenance.active && user?.role !== 'ADMIN' && !isAdminRoute) {
    return <MaintenancePage message={maintenance.message} endTime={maintenance.endTime} />;
  }

  return (
    <div
      className="bg-transparent dark:bg-slate-950 transition-colors duration-300"
      style={isMobile ? { position: 'relative', minHeight: '100vh', overflowX: 'hidden' } : {}}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={isMobile ? location.pathname : 'desktop-view'}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className={isMobile ? "mobile-page-transition" : ""}
          style={isMobile ? {
            position: 'relative',
            width: '100%',
            minHeight: '100vh',
            zIndex: 0
          } : {}}
        >
          {appType === 'USER' && <UserRoutes />}
          {appType === 'TECH' && <TechnicianRoutes />}
          {appType === 'ALL' && (
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
                <Route path="payments" element={<PaymentMethodsPage />} />
                <Route path="transport" element={<TransportPage />} />
                <Route path="houseshifting" element={<HouseShiftingPage />} />
                <Route path="careers" element={<CareersPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="about" element={<AboutUsPage />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />


              {/* Technician Routes */}
              <Route path="/partner" element={<PartnerLandingPage />} />
              <Route path="/partner/register" element={<TechnicianRegisterPage />} />
              <Route path="/technician/login" element={<TechnicianLoginPage />} />
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

              {/* Modular Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminOverview />} />
                <Route path="dashboard" element={<AdminOverview />} />
                <Route path="toggles" element={<AdminToggles />} />
                <Route path="experts" element={<AdminTechnicians />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="reasons" element={<AdminReasons />} />
                <Route path="feedback" element={<AdminFeedback />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="roles" element={<AdminRolesPanel />} />
                <Route path="hero" element={<AdminHeroSettings />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          )}
        </motion.div>
      </AnimatePresence>
      <ReviewManager />
      {appType !== 'TECH' && !isAdminRoute && !location.pathname.startsWith('/technician') && <AIChatBot />}
    </div>
  );
}


const NotificationListener = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { playNotificationSound } = useSound();

  React.useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      // Play sound
      playNotificationSound();

      toast(data.message || 'New Notification', {
        icon: '🔔',
        style: {
          borderRadius: '1rem',
          background: '#333',
          color: '#fff',
        },
      });
    };

    const handleServiceUpdate = () => {
      // Invalidate all service related queries to show fresh ratings
      queryClient.invalidateQueries(['services']);
      queryClient.invalidateQueries(['service']);
    };

    socket.on('notification', handleNotification);
    socket.on('service:updated', handleServiceUpdate);
    socket.on('review:created', handleServiceUpdate);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('service:updated', handleServiceUpdate);
      socket.off('review:created', handleServiceUpdate);
    };
  }, [socket, queryClient, playNotificationSound]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <SoundProvider>
            <SocketProvider>
              <NotificationListener />
              <BookingProvider>
                <AdminProvider>
                  <TechnicianProvider>
                    <ThemeProvider>
                      <Router>
                        <ScrollToTop />
                        <AnimatedRoutes />
                        <Toaster position="top-center" />
                      </Router>
                    </ThemeProvider>
                  </TechnicianProvider>
                </AdminProvider>
              </BookingProvider>
            </SocketProvider>
          </SoundProvider>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
