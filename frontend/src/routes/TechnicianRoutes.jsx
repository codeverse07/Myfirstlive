import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TechnicianLoginPage from '../pages/Technician/TechnicianLoginPage';
import TechnicianRegisterPage from '../pages/BeAPartner/TechnicianRegisterPage';
import TechnicianOnboardingPage from '../pages/BeAPartner/TechnicianOnboardingPage';
import TechnicianDashboard from '../pages/Technician/TechnicianDashboard';
import PartnerLandingPage from '../pages/BeAPartner/PartnerLandingPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import NotFoundPage from '../pages/Static/NotFoundPage';
import ProfilePage from '../pages/Profile/ProfilePage';

const TechnicianRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/technician/dashboard" replace />} />
            <Route path="/technician/login" element={<TechnicianLoginPage />} />
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

            <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                    <ProfilePage />
                </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default TechnicianRoutes;
