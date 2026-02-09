import React, { createContext, useContext, useState, useEffect } from 'react';
import { categories as initialCategories } from '../data/mockData';
import { useUser } from './UserContext';
import { useSocket } from './SocketContext';
import { useSound } from './SoundContext';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const { user, isAuthenticated, login: userLogin, logout: userLogout } = useUser();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    // Derive admin status directly from UserContext
    // preventing separate "admin_auth" state sync issues.
    const isAdminAuthenticated = isAuthenticated && user?.role === 'ADMIN';

    const [appSettings, setAppSettings] = useState(() => {
        const savedSettings = localStorage.getItem('app_settings');
        return savedSettings ? JSON.parse(savedSettings) : {
            showWallet: false,
            showReferralBanner: false,
            maintenanceMode: false,
            maintenanceMessage: 'Our server is currently undergoing maintenance. We will be back soon!',
            maintenanceEndTime: null,
            adminEmail: 'admin@reservice.com',
            adminPassword: 'admin123'
        };
    });

    const [allBookings, setAllBookings] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [heroes, setHeroes] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to transform backend service to frontend shape
    const transformService = (service) => {
        let categoryName = 'General';
        let categoryId = service.category;

        // Handle populated category object or raw ID/String
        if (service.category && typeof service.category === 'object' && service.category.name) {
            categoryName = service.category.name;
            categoryId = service.category._id || service.category.id;
        } else if (typeof service.category === 'string') {
            categoryName = service.category; // Fallback
        }

        const lowerCat = categoryName.toLowerCase();

        // Map backend category names to frontend IDs if they differ (for images/icons logic)
        const categoryMap = {
            'plumbing': 'plumber',
            'plumber': 'plumber',
            'carpentry': 'carpentry',
            'carpenter': 'carpentry',
            'house shifting': 'houseshifting',
            'houseshifting': 'houseshifting',
            'pest control': 'pestcontrol',
            'pestcontrol': 'pestcontrol',
            'home appliance': 'homeappliance',
            'homeappliance': 'homeappliance', 'appliances': 'homeappliance',
            'electrical': 'electrical',
            'electrician': 'electrical',
            'cleaning': 'cleaning',
            'painting': 'painting',
            'painter': 'painting',
            'transport': 'transport',
            'gardening': 'gardening', 'garden': 'gardening',
            'smart home': 'smarthome', 'smarthome': 'smarthome',
            'security': 'security', 'cctv': 'security',
            'car wash': 'carwash', 'carwash': 'carwash', 'car cleaning': 'carwash'
        };
        const mappedCat = categoryMap[lowerCat] || lowerCat.replace(/\s+/g, '').toLowerCase();

        const categoryBtn = initialCategories.find(c => c.id === mappedCat) || {};
        const isHouseshifting = categoryName.toLowerCase().includes('shift'); // Relaxed check

        // Title Cleanup
        let title = service.title || '';
        title = title.replace(' / Transport', '').replace(' / transport', '');

        // SubServices Generation
        let subServices;
        if (isHouseshifting) {
            subServices = [
                { id: 'consultation', name: "Consultation & Quote", price: 199, description: "Expert visit for distance verification and fixed quote estimation.", isActive: true },
            ];
        } else {
            subServices = [
                { id: 'basic', name: "Basic Service", price: service.price, description: "Includes diagnosis and minor repairs.", isActive: true },
                { id: 'premium', name: "Premium Service", price: Math.round(service.price * 2), description: "Deep cleaning + parts check + 30 day warranty.", isActive: true },
                { id: 'consultation', name: "Consultation", price: 199, description: "Expert visit and cost estimation.", isActive: true },
            ];
        }

        return {
            ...service,
            category: categoryId, // Use ID for filtering
            categoryName: categoryName, // Use Name for Display
            normalizedCategory: mappedCat, // Keep for legacy if needed
            id: service._id || service.id, // Handle Mongo ID
            title,
            price: isHouseshifting ? 199 : service.price,
            image: service.headerImage || service.image || categoryBtn.image || 'https://images.unsplash.com/photo-1581578731117-1045293d2f28?q=80&w=400',
            rating: service.rating || 0, // Default rating if missing
            reviews: service.reviews || 0,
            subServices
        };
    };

    const fetchData = async () => {
        if (!isAdminAuthenticated) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const endpoints = [
            { key: 'stats', url: '/admin/dashboard-stats', setter: setDashboardStats },
            { key: 'bookings', url: '/admin/bookings?limit=1000', setter: setAllBookings, transform: (d) => d.data.bookings },
            { key: 'technicians', url: '/admin/technicians?limit=1000', setter: setTechnicians, transform: (d) => d.data.technicians },
            { key: 'users', url: '/admin/users?limit=1000', setter: setUsers, transform: (d) => d.data.users },
            { key: 'services', url: '/services', setter: setServices, transform: (d) => d.data.services.map(transformService) },
            { key: 'categories', url: '/categories', setter: setCategories, transform: (d) => d.data.categories },
            { key: 'reasons', url: '/reasons', setter: setReasons, transform: (d) => d.data.reasons },
            { key: 'settings', url: '/admin/settings', setter: setAppSettings, transform: (d) => d.data.settings },
            { key: 'feedbacks', url: '/feedbacks', setter: setFeedbacks, transform: (d) => d.data.feedbacks },
            { key: 'reviews', url: '/reviews/all', setter: setReviews, transform: (d) => d.data.reviews },
            { key: 'heroes', url: '/heroes', setter: setHeroes, transform: (d) => d.data.heroes },
        ];

        try {
            const results = await Promise.allSettled(
                endpoints.map(ep => client.get(ep.url))
            );

            results.forEach((result, index) => {
                const ep = endpoints[index];
                if (result.status === 'fulfilled') {
                    const data = result.value.data;
                    if (ep.transform) {
                        ep.setter(ep.transform(data));
                    } else {
                        ep.setter(data.data || data);
                    }
                } else {
                    const status = result.reason.response?.status;
                    const message = result.reason.message;
                    console.warn(`Failed to load ${ep.key}`, status);
                    if (status === 401 || status === 403) {
                        toast.error(`Access Denied: ${ep.key} (${status})`);
                    } else {
                        toast.error(`Failed to load ${ep.key}: ${message}`);
                    }
                }
            });
        } catch (error) {
            console.error('Critical fetch error', error);
            toast.error("Critical error loading admin data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAdminAuthenticated]);

    useEffect(() => {
        if (!socket || !isAdminAuthenticated) return;

        const handleTechOnline = ({ userId }) => {
            setTechnicians(prev => prev.map(t =>
                (t.user?._id === userId || t.user === userId) ? { ...t, isOnline: true } : t
            ));
        };

        const handleTechOffline = ({ userId }) => {
            setTechnicians(prev => prev.map(t =>
                (t.user?._id === userId || t.user === userId) ? { ...t, isOnline: false } : t
            ));
        };

        socket.on('technician:online', handleTechOnline);
        socket.on('technician:offline', handleTechOffline);

        return () => {
            socket.off('technician:online', handleTechOnline);
            socket.off('technician:offline', handleTechOffline);
        };
    }, [socket, isAdminAuthenticated]);

    useEffect(() => {
        localStorage.setItem('app_settings', JSON.stringify(appSettings));
    }, [appSettings]);

    // Unified Login Wrapper (Updates to match UserContext signature)
    const login = async (email, password) => {
        // Pass 'bypass-token' for recaptcha and 'ADMIN' as role
        const res = await userLogin(email, password, 'bypass-token', 'ADMIN');
        if (res.success && res.user.role === 'ADMIN') {
            return true;
        } else if (res.success) {
            return "Not authorized as admin";
        }
        return res.message;
    };

    const logout = userLogout;

    const toggleSetting = async (key) => {
        const newValue = !appSettings[key];
        setAppSettings(prev => ({ ...prev, [key]: newValue }));

        try {
            await client.patch('/admin/settings', { [key]: newValue });
        } catch (err) {
            console.error("Failed to sync setting", err);
            setAppSettings(prev => ({ ...prev, [key]: !newValue }));
        }
    };

    const updateSettings = async (settings) => {
        try {
            const res = await client.patch('/admin/settings', settings);
            if (res.data.status === 'success') {
                setAppSettings(prev => ({ ...prev, ...res.data.data.settings }));
                toast.success("Settings updated");
            }
        } catch (err) {
            console.error("Failed to update settings", err);
            toast.error("Failed to sync settings");
        }
    };

    const addCategory = async (categoryData) => {
        try {
            const res = await client.post('/categories', categoryData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === 'success') {
                // Force refresh to get merged fields and correct order
                await fetchData();
                toast.success("Category launched successfully");
            }
        } catch (err) {
            console.error("Failed to add category", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Failed to add category");
        }
    };

    const updateCategory = async (id, categoryData) => {
        try {
            const res = await client.patch(`/categories/${id}`, categoryData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === 'success') {
                setCategories(prev => prev.map(cat =>
                    cat._id === id || cat.id === id ? { ...cat, ...res.data.data.category } : cat
                ));
                queryClient.invalidateQueries({ queryKey: ['categories'] });
            }
        } catch (err) {
            console.error("Failed to update category", err);
        }
    };

    const deleteCategory = async (id) => {
        try {
            await client.delete(`/categories/${id}`);
            // Filter out the deleted category by _id OR id
            setCategories(prev => prev.filter(cat => cat._id !== id && cat.id !== id));
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success("Category deleted");
        } catch (err) {
            console.error("Failed to delete category", err);
            toast.error("Failed to delete category");
        }
    };

    const addService = async (serviceData) => {
        try {
            // Validate required fields
            if (!serviceData.title || !serviceData.category || !serviceData.price) {
                toast.error("Title, Category, and Price are required");
                return;
            }

            const isMultipart = !!serviceData.imageFile;
            let payload;
            let headers = {};

            if (isMultipart) {
                payload = new FormData();
                payload.append('title', serviceData.title);
                payload.append('category', serviceData.category);
                payload.append('price', serviceData.price);
                payload.append('description', serviceData.description || 'No description');
                if (serviceData.technicianId) payload.append('technician', serviceData.technicianId);
                payload.append('headerImage', serviceData.imageFile);
                headers = { 'Content-Type': 'multipart/form-data' };
            } else {
                payload = {
                    title: serviceData.title,
                    category: serviceData.category,
                    price: Number(serviceData.price),
                    description: serviceData.description || 'No description',
                    headerImage: serviceData.image // URL fallback
                };
                if (serviceData.technicianId) payload.technician = serviceData.technicianId;
            }

            const res = await client.post('/services', payload, { headers });

            if (res.data.status === 'success') {
                const newService = transformService(res.data.data.service || res.data.data.data);
                setServices(prev => [...prev, newService]);
                toast.success("Service added successfully");
                return { success: true };
            }
        } catch (err) {
            console.error("Failed to add service", err);
            toast.error(err.response?.data?.message || "Failed to add service");
            return { success: false, message: err.message };
        }
    };

    const updateServicePrice = async (id, newPrice) => {
        try {
            const res = await client.patch(`/services/${id}`, { price: Number(newPrice) });
            if (res.data.status === 'success') {
                const updatedService = transformService(res.data.data.service);
                setServices(prev => prev.map(s => s.id === id ? updatedService : s));
                toast.success("Price updated");
            }
        } catch (err) {
            console.error("Failed to update service price", err);
            toast.error("Failed to update price");
        }
    };

    const updateService = async (id, serviceData) => {
        try {
            let payload;
            let headers = {};

            if (serviceData instanceof FormData) {
                payload = serviceData;
                headers = { 'Content-Type': 'multipart/form-data' };
            } else {
                payload = serviceData;
            }

            const res = await client.patch(`/services/${id}`, payload, { headers });

            if (res.data.status === 'success') {
                const updatedService = transformService(res.data.data.service);
                setServices(prev => prev.map(s => s.id === id ? updatedService : s));
                toast.success("Service updated successfully");
                return { success: true };
            }
        } catch (err) {
            console.error("Failed to update service", err);
            toast.error(err.response?.data?.message || "Failed to update service");
            return { success: false, message: err.message };
        }
    };

    const deleteService = async (id) => {
        try {
            await client.delete(`/services/${id}`);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success("Service deleted");
        } catch (err) {
            console.error("Failed to delete service", err);
            toast.error("Failed to delete service");
        }
    };

    const updateSubServicePrice = (serviceId, subServiceId, newPrice) => {
        if (subServiceId === 'basic') {
            updateServicePrice(serviceId, newPrice);
        }
        setServices(prev => prev.map(s => {
            if (s.id === serviceId) {
                const updatedSubServices = s.subServices.map(ss =>
                    ss.id === subServiceId ? { ...ss, price: Number(newPrice) } : ss
                );
                return { ...s, subServices: updatedSubServices };
            }
            return s;
        }));
    };

    const toggleSubService = (serviceId, subServiceId) => {
        setServices(prev => prev.map(s =>
            s.id === serviceId ? {
                ...s,
                subServices: s.subServices.map(ss =>
                    ss.id === subServiceId ? { ...ss, isActive: !ss.isActive } : ss
                )
            } : s
        ));
    };

    const updateTechnicianProfile = async (id, profileData) => {
        try {
            const isMultipart = profileData instanceof FormData;
            const res = await client.patch(`/admin/technicians/${id}/profile`, profileData, {
                headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : {}
            });
            if (res.data.status === 'success') {
                const updatedTech = res.data.data.technician;
                setTechnicians(prev => prev.map(t =>
                    (t._id === id || t.id === id) ? updatedTech : t
                ));
                toast.success("Profile updated");
                return { success: true, data: updatedTech };
            }
        } catch (err) {
            console.error("Failed to update technician profile", err);
            toast.error(err.response?.data?.message || "Update failed");
            return { success: false, message: err.message };
        }
    };

    const addTechnician = async (techData) => {
        try {
            const formData = new FormData();
            formData.append('name', techData.name);
            formData.append('email', techData.email);
            formData.append('password', techData.password || 'password123');
            formData.append('phone', techData.phone);
            formData.append('bio', techData.bio || '');

            if (techData.agreementFile) {
                formData.append('agreement', techData.agreementFile);
            }

            if (techData.skills) {
                const skillsArray = typeof techData.skills === 'string'
                    ? techData.skills.split(',').map(s => s.trim())
                    : techData.skills;
                skillsArray.forEach(skill => formData.append('skills', skill));
            }

            const res = await client.post('/admin/technicians', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.status === 'success') {
                const newTechnician = res.data.data.profile;
                newTechnician.user = res.data.data.user;
                setTechnicians(prev => [newTechnician, ...prev]);
                toast.success("Technician added");
            }
        } catch (err) {
            console.error("Failed to add technician", err);
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const approveTechnician = async (id, categoryIds, serviceIds) => {
        try {
            await client.patch(`/admin/technicians/${id}/approve`, { categoryIds, serviceIds });
            await fetchData(); // Force refresh to get populated categories/services
            toast.success("Technician approved and roles assigned");
        } catch (err) {
            console.error("Failed to approve technician", err);
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const rejectTechnician = async (id) => {
        try {
            await client.patch(`/admin/technicians/${id}/reject`);
            setTechnicians(prev => prev.map(t =>
                t._id === id || t.id === id ? { ...t, documents: { ...t.documents, verificationStatus: 'REJECTED' } } : t
            ));
            toast.success("Technician rejected");
        } catch (err) {
            console.error("Failed to reject technician", err);
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const deleteTechnician = async (id) => {
        try {
            await client.delete(`/admin/technicians/${id}`);
            setTechnicians(prev => prev.filter(t => t._id !== id && t.id !== id));
            toast.success("Technician permanently deleted");
        } catch (err) {
            console.error("Failed to delete technician", err);
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const resetTechnicianPassword = async (id, newPassword) => {
        try {
            const res = await client.patch(`/admin/technicians/${id}/reset-password`, { password: newPassword });
            if (res.data.status === 'success') {
                toast.success("Password reset successfully");
                await fetchData(); // Refresh to clear request flags in UI
                return { success: true };
            }
        } catch (err) {
            console.error("Failed to reset password", err);
            toast.error(err.response?.data?.message || "Reset failed");
            return { success: false };
        }
    };

    const toggleUserStatus = async (id, newStatus) => {
        try {
            // Fix: We now expect 'newStatus' (the desired state) directly, not 'currentStatus'.
            // And we DO NOT flip it here. We send it as is.
            await client.patch(`/admin/users/${id}/status`, { isActive: newStatus });
            setUsers(prev => prev.map(u =>
                u._id === id || u.id === id ? { ...u, isActive: newStatus } : u
            ));
            // Also update technicians list if the user is a technician
            setTechnicians(prev => prev.map(t =>
                t.user && (t.user._id === id || t.user.id === id) ? { ...t, user: { ...t.user, isActive: newStatus } } : t
            ));

            toast.success(newStatus ? "User enabled" : "User disabled");
        } catch (err) {
            console.error("Failed to update user status", err);
            toast.error("Failed to update status");
        }
    };

    const cancelBooking = async (id) => {
        try {
            const res = await client.patch(`/admin/bookings/${id}/cancel`);
            const updatedBooking = res.data.data.booking;
            setAllBookings(prev => prev.map(b => b._id === id ? updatedBooking : b));
            toast.success("Booking cancelled");
        } catch (err) {
            console.error("Failed to cancel booking", err);
            toast.error("Failed to cancel booking");
        }
    };

    const addReason = async (reasonData) => {
        try {
            const res = await client.post('/reasons', reasonData);
            if (res.data.status === 'success') {
                setReasons(prev => [...prev, res.data.data.reason]);
                toast.success("Reason added");
            }
        } catch (err) {
            console.error("Failed to add reason", err);
        }
    };

    const deleteReason = async (id) => {
        try {
            await client.delete(`/reasons/${id}`);
            setReasons(prev => prev.filter(r => r._id !== id));
            toast.success("Reason deleted");
        } catch (err) {
            console.error("Failed to delete reason", err);
        }
    };

    const assignTechnician = async (bookingId, technicianId) => {
        try {
            const res = await client.patch(`/admin/bookings/${bookingId}/assign`, { technicianId });
            const updatedBooking = res.data.data.booking;
            setAllBookings(prev => prev.map(b => b._id === bookingId ? updatedBooking : b));
            toast.success("Technician assigned");
        } catch (err) {
            console.error("Failed to assign technician", err);
            toast.error("Assignment failed");
        }
    };

    const updateBookingStatus = async (bookingId, status, additionalData = {}) => {
        try {
            // Using the general booking route which we updated to allow Admin bypass
            const res = await client.patch(`/bookings/${bookingId}/status`, { status, ...additionalData });
            const updatedBooking = res.data.data.booking;

            setAllBookings(prev => prev.map(b => b._id === bookingId ? updatedBooking : b));
            return { success: true, data: updatedBooking };
        } catch (err) {
            console.error("Failed to update booking status", err);
            toast.error(err.response?.data?.message || "Failed to update status");
            return { success: false, message: err.message };
        }
    };

    const deleteReview = async (id) => {
        try {
            await client.delete(`/reviews/${id}`);
            setReviews(prev => prev.filter(r => r._id !== id));
            toast.success("Review removed");
        } catch (err) {
            console.error("Delete review error", err);
            toast.error("Failed to delete review");
        }
    };

    const deleteFeedback = async (id) => {
        try {
            await client.delete(`/feedbacks/${id}`);
            setFeedbacks(prev => prev.filter(f => f._id !== id));
            toast.success("Feedback removed");
        } catch (err) {
            console.error("Delete feedback error", err);
            toast.error("Failed to delete feedback");
        }
    };

    const addHero = async (heroData) => {
        try {
            const res = await client.post('/heroes', heroData);
            if (res.data.status === 'success') {
                setHeroes(prev => [...prev, res.data.data.hero]);
                toast.success("Hero slide added");
                return { success: true };
            }
        } catch (err) {
            console.error("Failed to add hero", err);
            toast.error(err.response?.data?.message || "Failed to add hero");
            return { success: false };
        }
    };

    const updateHero = async (id, heroData) => {
        try {
            const res = await client.patch(`/heroes/${id}`, heroData);
            if (res.data.status === 'success') {
                setHeroes(prev => prev.map(hero => hero._id === id ? res.data.data.hero : hero));
                toast.success("Hero updated");
                return { success: true };
            }
        } catch (err) {
            console.error("Failed to update hero", err);
            toast.error(err.response?.data?.message || "Update failed");
            return { success: false };
        }
    };

    const deleteHero = async (id) => {
        try {
            await client.delete(`/heroes/${id}`);
            setHeroes(prev => prev.filter(h => h._id !== id));
            toast.success("Hero removed");
            return { success: true };
        } catch (err) {
            console.error("Failed to delete hero", err);
            toast.error("Delete failed");
            return { success: false };
        }
    };

    const { playNotificationSound } = useSound();

    // Real-time Updates
    useEffect(() => {
        if (!socket || !isAdminAuthenticated) return;

        console.log('Admin Socket Listening...');

        // BOOKINGS
        const handleBookingCreated = (newBooking) => {
            console.log('Socket: Booking Created', newBooking._id);
            playNotificationSound();
            toast.success(`New Booking: ${newBooking.category?.name || 'Service'}`);
            setAllBookings(prev => [newBooking, ...prev]);
            fetchData(); // Refresh stats and other lists
        };

        const handleBookingUpdated = (updatedBooking) => {
            console.log('Socket: Booking Updated', updatedBooking._id);
            setAllBookings(prev => prev.map(b => (b._id === updatedBooking._id || b.id === updatedBooking._id) ? updatedBooking : b));
            fetchData(); // Refresh stats
        };

        // TECHNICIANS
        const handleTechnicianCreated = (newTech) => {
            console.log('Socket: Technician Created', newTech._id);
            playNotificationSound();
            setTechnicians(prev => [newTech, ...prev]);
            fetchData();
        };

        const handleTechnicianUpdated = (updatedTech) => {
            console.log('Socket: Technician Updated', updatedTech._id);
            setTechnicians(prev => prev.map(t => (t._id === updatedTech._id || t.id === updatedTech._id) ? updatedTech : t));
            fetchData();
        };

        const handleTechnicianDeleted = ({ id }) => {
            console.log('Socket: Technician Deleted', id);
            setTechnicians(prev => prev.filter(t => t._id !== id && t.id !== id));
            fetchData();
        };

        const handleTechnicianOnline = ({ userId, technicianId }) => {
            console.log('Socket: Tech Online', userId || technicianId);
            setTechnicians(prev => prev.map(t =>
                (t.user?._id === userId || t.user === userId || t._id === technicianId || t.id === technicianId)
                    ? { ...t, isOnline: true } : t
            ));
        };

        const handleTechnicianOffline = ({ userId, technicianId }) => {
            console.log('Socket: Tech Offline', userId || technicianId);
            setTechnicians(prev => prev.map(t =>
                (t.user?._id === userId || t.user === userId || t._id === technicianId || t.id === technicianId)
                    ? { ...t, isOnline: false } : t
            ));
        };

        // USERS
        const handleUserUpdated = (updatedUser) => {
            console.log('Socket: User Updated', updatedUser._id);
            setUsers(prev => prev.map(u => (u._id === updatedUser._id || u.id === updatedUser._id) ? updatedUser : u));
            // Also update technician list if this user is a technician
            setTechnicians(prev => prev.map(t =>
                (t.user?._id === updatedUser._id || t.user === updatedUser._id)
                    ? { ...t, user: updatedUser } : t
            ));
        };

        // SERVICES
        const handleServiceCreated = (newService) => {
            console.log('Socket: Service Created', newService._id);
            setServices(prev => [...prev, transformService(newService)]);
        };

        const handleServiceUpdated = (updatedService) => {
            console.log('Socket: Service Updated', updatedService._id);
            setServices(prev => prev.map(s => (s._id === updatedService._id || s.id === updatedService._id) ? transformService(updatedService) : s));
        };

        const handleServiceDeleted = ({ id }) => {
            console.log('Socket: Service Deleted', id);
            setServices(prev => prev.filter(s => s._id !== id && s.id !== id));
        };

        // CATEGORIES
        const handleCategoryCreated = (newCat) => {
            console.log('Socket: Category Created', newCat._id);
            setCategories(prev => [...prev, newCat]);
        };

        const handleCategoryUpdated = (updatedCat) => {
            console.log('Socket: Category Updated', updatedCat._id);
            setCategories(prev => prev.map(c => (c._id === updatedCat._id || c.id === updatedCat._id) ? updatedCat : c));
        };

        const handleCategoryDeleted = ({ id }) => {
            console.log('Socket: Category Deleted', id);
            setCategories(prev => prev.filter(c => c._id !== id && c.id !== id));
        };

        // FEEDBACK
        const handleFeedbackCreated = (newFeedback) => {
            console.log('Socket: Feedback Created', newFeedback._id);
            playNotificationSound();
            setFeedbacks(prev => [newFeedback, ...prev]);
        };

        const handleFeedbackUpdated = (updatedFeedback) => {
            console.log('Socket: Feedback Updated', updatedFeedback._id);
            setFeedbacks(prev => prev.map(f => (f._id === updatedFeedback._id || f.id === updatedFeedback._id) ? updatedFeedback : f));
        };

        const handleFeedbackDeleted = ({ id }) => {
            console.log('Socket: Feedback Deleted', id);
            setFeedbacks(prev => prev.filter(f => f._id !== id && f.id !== id));
        };

        // REVIEWS
        const handleReviewCreated = (newReview) => {
            console.log('Socket: Review Created', newReview._id);
            playNotificationSound();
            setReviews(prev => [newReview, ...prev]);
            fetchData(); // Stats change
        };

        const handleReviewUpdated = (updatedReview) => {
            console.log('Socket: Review Updated', updatedReview._id);
            setReviews(prev => prev.map(r => (r._id === updatedReview._id || r.id === updatedReview._id) ? updatedReview : r));
            fetchData();
        };

        const handleReviewDeleted = ({ id }) => {
            console.log('Socket: Review Deleted', id);
            setReviews(prev => prev.filter(r => r._id !== id && r.id !== id));
            fetchData();
        };

        // REASONS
        const handleReasonCreated = (newReason) => {
            console.log('Socket: Reason Created', newReason._id);
            setReasons(prev => [...prev, newReason]);
        };

        const handleReasonDeleted = ({ id }) => {
            console.log('Socket: Reason Deleted', id);
            setReasons(prev => prev.filter(r => r._id !== id && r.id !== id));
        };

        // SETTINGS
        const handleSettingsUpdated = (updatedSettings) => {
            console.log('Socket: Settings Updated');
            setAppSettings(prev => ({ ...prev, ...updatedSettings }));
            toast.success("System settings updated externally");
        };

        socket.on('booking:created', handleBookingCreated);
        socket.on('booking:updated', handleBookingUpdated);
        socket.on('technician:created', handleTechnicianCreated);
        socket.on('technician:updated', handleTechnicianUpdated);
        socket.on('technician:deleted', handleTechnicianDeleted);
        socket.on('technician:online', handleTechnicianOnline);
        socket.on('technician:offline', handleTechnicianOffline);
        socket.on('user:updated', handleUserUpdated);
        socket.on('service:created', handleServiceCreated);
        socket.on('service:updated', handleServiceUpdated);
        socket.on('service:deleted', handleServiceDeleted);
        socket.on('category:created', handleCategoryCreated);
        socket.on('category:updated', handleCategoryUpdated);
        socket.on('category:deleted', handleCategoryDeleted);
        socket.on('feedback:created', handleFeedbackCreated);
        socket.on('feedback:updated', handleFeedbackUpdated);
        socket.on('feedback:deleted', handleFeedbackDeleted);
        socket.on('review:created', handleReviewCreated);
        socket.on('review:updated', handleReviewUpdated);
        socket.on('review:deleted', handleReviewDeleted);
        socket.on('reason:created', handleReasonCreated);
        socket.on('reason:deleted', handleReasonDeleted);
        socket.on('settings:updated', handleSettingsUpdated);

        return () => {
            socket.off('booking:created', handleBookingCreated);
            socket.off('booking:updated', handleBookingUpdated);
            socket.off('technician:created', handleTechnicianCreated);
            socket.off('technician:updated', handleTechnicianUpdated);
            socket.off('technician:deleted', handleTechnicianDeleted);
            socket.off('technician:online', handleTechnicianOnline);
            socket.off('technician:offline', handleTechnicianOffline);
            socket.off('user:updated', handleUserUpdated);
            socket.off('service:created', handleServiceCreated);
            socket.off('service:updated', handleServiceUpdated);
            socket.off('service:deleted', handleServiceDeleted);
            socket.off('category:created', handleCategoryCreated);
            socket.off('category:updated', handleCategoryUpdated);
            socket.off('category:deleted', handleCategoryDeleted);
            socket.off('feedback:created', handleFeedbackCreated);
            socket.off('feedback:updated', handleFeedbackUpdated);
            socket.off('feedback:deleted', handleFeedbackDeleted);
            socket.off('review:created', handleReviewCreated);
            socket.off('review:updated', handleReviewUpdated);
            socket.off('review:deleted', handleReviewDeleted);
            socket.off('reason:created', handleReasonCreated);
            socket.off('reason:deleted', handleReasonDeleted);
            socket.off('settings:updated', handleSettingsUpdated);
        };
    }, [socket, isAdminAuthenticated, playNotificationSound]);

    return (
        <AdminContext.Provider value={{
            isAdminAuthenticated,
            appSettings,
            categories,
            services,
            technicians,
            feedbacks,
            reviews,
            isLoading,
            login,
            logout,
            toggleSetting,
            addCategory,
            updateCategory,
            deleteCategory,
            addService,
            deleteService,
            updateServicePrice,
            updateService,
            updateSubServicePrice,
            toggleSubService,
            updateTechnicianProfile,
            addTechnician,
            approveTechnician,
            rejectTechnician,
            deleteTechnician,
            resetTechnicianPassword,
            users,
            toggleUserStatus,
            allBookings,
            dashboardStats,
            reasons,
            addReason,
            deleteReason,
            assignTechnician,
            updateBookingStatus,
            cancelBooking,
            deleteReview,
            deleteFeedback,
            updateSettings,
            heroes,
            addHero,
            updateHero,
            deleteHero,
            refreshData: fetchData
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
