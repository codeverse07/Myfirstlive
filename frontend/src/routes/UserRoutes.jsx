import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import ServicesPage from '../pages/Services/ServicesPage';
import ServiceDetailsPage from '../pages/Services/ServiceDetailsPage';
import BookingsPage from '../pages/Bookings/BookingsPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import MobileSearchPage from '../pages/Search/MobileSearchPage';
import SavedServicesPage from '../pages/Saved/SavedServicesPage';
import AddressesPage from '../pages/Profile/AddressesPage';
import PaymentMethodsPage from '../pages/Profile/PaymentMethodsPage';
import TransportPage from '../pages/Services/TransportPage';
import HouseShiftingPage from '../pages/Services/HouseShiftingPage';
import CareersPage from '../pages/Static/CareersPage';
import ContactPage from '../pages/Static/ContactPage';
import AboutUsPage from '../pages/Static/AboutUsPage';
import NotFoundPage from '../pages/Static/NotFoundPage';

const UserRoutes = () => {
    return (
        <Routes>
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
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default UserRoutes;
