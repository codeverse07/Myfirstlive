import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { useUser } from './UserContext';
import { toast } from 'react-hot-toast';

const TechnicianContext = createContext();

export const useTechnician = () => useContext(TechnicianContext);

export const TechnicianProvider = ({ children }) => {
    const { user, isAuthenticated } = useUser();
    const [technicianProfile, setTechnicianProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [reviews, setReviews] = useState([]);

    // Fetch Technician Profile if user is a TECHNICIAN
    useEffect(() => {
        const fetchTechnicianData = async () => {
            if (isAuthenticated && user?.role === 'TECHNICIAN') {
                try {
                    setLoading(true);
                    // Fetch technician profile by User ID
                    const res = await client.get(`/technicians?user=${user._id}`);

                    if (res.data.status === 'success' && res.data.data.technicians.length > 0) {
                        setTechnicianProfile(res.data.data.technicians[0]);
                    } else {
                        // Profile doesn't exist yet (New registered technician)
                        setTechnicianProfile(null);
                    }
                } catch (error) {
                    console.error("Error fetching technician data", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchTechnicianData();
    }, [isAuthenticated, user]);

    const uploadDocuments = async (docs) => {
        try {
            const formData = new FormData();
            if (docs.aadharCard) formData.append('aadharCard', docs.aadharCard);
            if (docs.panCard) formData.append('panCard', docs.panCard);
            if (docs.resume) formData.append('resume', docs.resume);

            const res = await client.post('/technicians/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setTechnicianProfile(res.data.data.profile);
            toast.success("Documents uploaded successfully!");
            return { success: true };
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Document upload failed");
            return { success: false, message: error.response?.data?.message };
        }
    };

    const createProfile = async (profileData) => {
        try {
            const formData = new FormData();
            formData.append('bio', profileData.bio);

            profileData.skills.forEach(skill => formData.append('skills', skill));

            if (profileData.location) {
                formData.append('location[type]', 'Point');
                formData.append('location[coordinates][0]', profileData.location.coordinates[0]);
                formData.append('location[coordinates][1]', profileData.location.coordinates[1]);
                formData.append('location[address]', profileData.location.address);
            }

            if (profileData.profilePhoto) {
                formData.append('profilePhoto', profileData.profilePhoto);
            }

            const res = await client.post('/technicians/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setTechnicianProfile(res.data.data.profile);
            toast.success("Profile created successfully!");
            return { success: true };
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to create profile");
            return { success: false, message: error.response?.data?.message };
        }
    };

    const updateStatus = async (isOnline) => {
        try {
            if (!technicianProfile) {
                // First time going online? Create profile with defaults
                const formData = new FormData();
                formData.append('bio', 'Looking for work');
                formData.append('skills', 'General');
                formData.append('isOnline', isOnline);

                const res = await client.post('/technicians/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setTechnicianProfile(res.data.data.profile);
                toast.success(isOnline ? "You are now Online" : "You are now Offline");
                return;
            }

            const res = await client.patch('/technicians/profile', { isOnline });
            setTechnicianProfile(prev => ({ ...prev, isOnline: res.data.data.profile.isOnline }));
            toast.success(isOnline ? "You are now Online" : "You are now Offline");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update status. Please complete your profile first.");
        }
    };

    const updateProfileData = async (data) => {
        try {
            setLoading(true);
            const formData = new FormData();
            if (data.bio) formData.append('bio', data.bio);
            if (data.skills) {
                // handle array or comma string
                if (Array.isArray(data.skills)) {
                    data.skills.forEach(s => formData.append('skills', s));
                } else {
                    formData.append('skills', data.skills); // if string
                }
            }
            if (data.profilePhoto instanceof File) {
                formData.append('profilePhoto', data.profilePhoto);
            }

            // If patching, we use specific endpoint logic
            const res = await client.patch('/technicians/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setTechnicianProfile(res.data.data.profile);
            toast.success("Profile updated successfully");
            return { success: true };
        } catch (error) {
            console.error("Update profile failed", error);
            toast.error(error.response?.data?.message || "Update failed");
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicianStats = async () => {
        try {
            const res = await client.get('/bookings/stats');
            setStats(res.data.data.stats);
        } catch (error) {
            console.error("Error fetching stats", error);
        }
    };

    const fetchTechnicianBookings = async () => {
        try {
            const res = await client.get('/bookings');
            setJobs(res.data.data.bookings);
        } catch (error) {
            console.error("Error fetching bookings", error);
        }
    };

    const fetchTechnicianReviews = async () => {
        try {
            if (!technicianProfile?._id) return;
            const res = await client.get(`/technicians/${technicianProfile._id}/reviews`);
            setReviews(res.data.data.reviews);
        } catch (error) {
            console.error("Error fetching reviews", error);
        }
    };

    // Initial Data Load
    useEffect(() => {
        if (isAuthenticated && user?.role === 'TECHNICIAN') {
            fetchTechnicianStats();
            fetchTechnicianBookings();
            fetchTechnicianReviews();
        }
    }, [isAuthenticated, user, technicianProfile?._id]);

    // Auto-refresh for new jobs (Polling as fallback for sockets)
    useEffect(() => {
        let interval;
        if (isAuthenticated && user?.role === 'TECHNICIAN') {
            interval = setInterval(() => {
                fetchTechnicianBookings();
                fetchTechnicianStats();
            }, 30000); // Check every 30 seconds
        }
        return () => clearInterval(interval);
    }, [isAuthenticated, user]);

    const updateBookingStatus = async (bookingId, status) => {
        try {
            await client.patch(`/bookings/${bookingId}/status`, { status });
            toast.success(`Booking ${status.toLowerCase().replace('_', ' ')} successfully`);
            fetchTechnicianBookings(); // Refresh list
            fetchTechnicianStats(); // Refresh stats (e.g. if completed)
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
            return false;
        }
    };

    const value = {
        technicianProfile,
        loading,
        stats,
        jobs,
        reviews,
        createProfile,
        updateStatus,
        updateProfileData,
        fetchTechnicianBookings,
        fetchTechnicianStats,
        fetchTechnicianReviews,
        updateBookingStatus
    };

    return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
};
