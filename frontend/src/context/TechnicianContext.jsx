import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { useUser } from './UserContext';
import { useSocket } from './SocketContext';
import { useSound } from './SoundContext';
import { toast } from 'react-hot-toast';

const TechnicianContext = createContext();

export const useTechnician = () => useContext(TechnicianContext);

export const TechnicianProvider = ({ children }) => {
    const { user, isAuthenticated } = useUser();
    const { socket } = useSocket();
    const { playNotificationSound } = useSound();
    const [technicianProfile, setTechnicianProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reasons, setReasons] = useState([]);

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
            if (!user?._id) return;
            const res = await client.get(`/reviews/technician/${user._id}`);
            setReviews(res.data.data.reviews);
        } catch (error) {
            console.error("Error fetching reviews", error);
        }
    };

    const fetchReasons = async () => {
        try {
            const res = await client.get('/reasons');
            setReasons(res.data.data.reasons);
        } catch (error) {
            console.error("Error fetching reasons", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.role === 'TECHNICIAN') {
            fetchTechnicianStats();
            fetchTechnicianBookings();
            fetchTechnicianReviews();
            fetchReasons();
        }
    }, [isAuthenticated, user?._id]);

    // Real-time Updates via Socket.IO
    useEffect(() => {
        if (isAuthenticated && user?.role === 'TECHNICIAN' && socket) {
            const handleNotification = (data) => {
                // Play sound
                playNotificationSound();

                // Show notification toast
                toast(t => (
                    <div onClick={() => toast.dismiss(t.id)} className="cursor-pointer">
                        <p className="font-bold text-sm">{data.title}</p>
                        <p className="text-xs">{data.message}</p>
                    </div>
                ), { position: 'top-right', duration: 5000, icon: '🔔' });

                // Refresh data
                fetchTechnicianBookings();
                fetchTechnicianStats();
                fetchTechnicianReviews();
            };

            const handleBookingUpdated = (updatedBooking) => {
                // Play sound for job updates too if relevant
                playNotificationSound();

                setJobs(prev => prev.map(j => j._id === updatedBooking._id ? updatedBooking : j));
                fetchTechnicianStats();
            };

            socket.on('notification', handleNotification);
            socket.on('booking:updated', handleBookingUpdated);

            return () => {
                socket.off('notification', handleNotification);
                socket.off('booking:updated', handleBookingUpdated);
            };
        }
    }, [isAuthenticated, user, socket, playNotificationSound]);

    // Polling as fallback (keep existing but reduced frequency if socket is active? No, keep as backup)
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

    const updateBookingStatus = async (bookingId, status, completionData = null) => {
        try {
            // Optimistic Update: Update local state immediately
            setJobs(prevJobs => prevJobs.map(job =>
                job._id === bookingId ? { ...job, status: status } : job
            ));

            let data = { status };
            let headers = {};

            if (completionData) {
                // Determine if we need FormData (for generic file uploads)
                // We check for 'partImages' array with files, or legacy 'billImage'
                const hasFiles = (completionData.partImages && completionData.partImages.length > 0) || completionData.billImage;

                if (hasFiles) {
                    const formData = new FormData();
                    formData.append('status', status);

                    // Add other fields from completionData if it exists
                    if (completionData) {
                        Object.keys(completionData).forEach(key => {
                            // Skip file fields and previews (handled separately or ignored)
                            if (!['partImages', 'billImage', 'previews'].includes(key)) {
                                formData.append(key, completionData[key]);
                            }
                        });
                    }

                    // Handle generic partImages (Array of Files)
                    if (completionData.partImages && completionData.partImages.length > 0) {
                        completionData.partImages.forEach(file => {
                            formData.append('partImages', file);
                        });
                    }

                    // Handle legacy billImage (Single File)
                    if (completionData.billImage) {
                        formData.append('billImage', completionData.billImage);
                    }

                    data = formData;
                    // Force headers to be empty so axios doesn't use the default JSON content-type
                    headers = { 'Content-Type': undefined };
                } else {
                    // JSON Fallback: Exclude frontend-only fields like 'previews' and 'partImages' (if empty array)
                    // eslint-disable-next-line no-unused-vars
                    const { partImages, previews, billImage, ...cleanData } = completionData;
                    data = { status, ...cleanData };
                }
            }

            await client.patch(`/bookings/${bookingId}/status`, data, { headers });
            toast.success(`Booking ${status.toLowerCase().replace('_', ' ')} successfully`);

            // Refetch in background to ensure data consistency
            fetchTechnicianBookings();
            fetchTechnicianStats();
            return true;
        } catch (error) {
            // Revert optimistic update on error
            console.error("Update failed", error);
            fetchTechnicianBookings(); // Revert to server state
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
        reasons,
        createProfile,
        uploadDocuments,
        updateStatus,
        updateProfileData,
        fetchTechnicianBookings,
        fetchTechnicianStats,
        fetchTechnicianReviews,
        fetchReasons,
        updateBookingStatus,
        requestPasswordReset: async () => {
            try {
                const res = await client.patch('/technicians/request-reset');
                if (res.data.status === 'success') {
                    toast.success("Reset request submitted to admin");
                    return { success: true };
                }
            } catch (error) {
                console.error("Request reset failed", error);
                toast.error(error.response?.data?.message || "Request failed");
                return { success: false };
            }
        }
    };

    return <TechnicianContext.Provider value={value}>{children}</TechnicianContext.Provider>;
};
