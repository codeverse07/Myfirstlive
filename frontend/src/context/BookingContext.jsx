import React, { createContext, useState, useContext, useEffect } from 'react';
import client from '../api/client';
import { useUser } from './UserContext';
import { useSocket } from './SocketContext';
import { useSound } from './SoundContext';
import { toast } from 'react-hot-toast';

const BookingContext = createContext();

export const useBookings = () => useContext(BookingContext);

export const BookingProvider = ({ children }) => {
    const { isAuthenticated, user } = useUser();
    const { socket } = useSocket();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingReviews, setPendingReviews] = useState([]);

    // Auto-refresh for new bookings/status updates (Fallback polling)
    useEffect(() => {
        let interval;
        if (isAuthenticated) {
            fetchBookings();
            interval = setInterval(fetchBookings, 60000); // Poll every 60s as backup
        }
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Update Pending Reviews whenever bookings change
    useEffect(() => {
        if (bookings.length > 0 && user?.role === 'USER') {
            const pending = bookings.filter(b => b.status === 'Completed' && !b.review);
            setPendingReviews(pending);
        } else {
            setPendingReviews([]);
        }
    }, [bookings, user?.role]);

    const { playNotificationSound } = useSound();

    // REAL-TIME UPDATES
    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        const handleBookingCreated = (newBooking) => {
            playNotificationSound();
            setBookings(prev => [transformBooking(newBooking), ...prev]);
        };

        const handleBookingUpdated = (updatedBooking) => {
            playNotificationSound();
            setBookings(prev => prev.map(b => (b.id === updatedBooking._id || b.id === updatedBooking.id) ? transformBooking(updatedBooking) : b));

            // Show toast if status changed
            toast.success(`Booking status updated to ${updatedBooking.status}`);
        };

        socket.on('booking:created', handleBookingCreated);
        socket.on('booking:updated', handleBookingUpdated);

        return () => {
            socket.off('booking:created', handleBookingCreated);
            socket.off('booking:updated', handleBookingUpdated);
        };
    }, [socket, isAuthenticated, playNotificationSound]);

    // Helper to transform backend booking
    const transformBooking = (doc) => {
        const item = doc.category || doc.service || {};
        const dateObj = new Date(doc.scheduledAt);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Map status (backend UPPERCASE to Title Case)
        const statusMap = {
            'PENDING': 'Pending',
            'ASSIGNED': 'Assigned',
            'ACCEPTED': 'Assigned', // Tech accepted = Assigned
            'IN_PROGRESS': 'In Progress',
            'COMPLETED': 'Completed',
            'CANCELLED': 'Canceled'
        };

        return {
            id: doc._id || doc.id,
            categoryName: doc.category?.name || doc.service?.category || 'Unknown Category',
            serviceName: doc.service?.title || doc.category?.name || 'Unknown Service',
            price: doc.price || item.price || 0,
            status: statusMap[doc.status] || doc.status,
            date,
            time,
            image: item.image || item.headerImage || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800',
            technician: doc.technician ? {
                name: doc.technician.name,
                image: doc.technician.profilePhoto
                    ? (doc.technician.profilePhoto.startsWith('http')
                        ? doc.technician.profilePhoto
                        : `/uploads/users/${doc.technician.profilePhoto}`)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.technician.name || 'Technician')}&background=random`,
                phone: doc.technician.phone || '',
                id: doc.technician._id
            } : null,
            customer: doc.customer,
            location: doc.location,
            notes: doc.notes,
            referenceImage: doc.referenceImage,
            securityPin: doc.securityPin,
            review: doc.review ? {
                id: doc.review._id || doc.review.id,
                rating: doc.review.rating,
                comment: doc.review.review
            } : null
        };
    };

    const fetchBookings = async () => {
        if (!isAuthenticated) {
            setBookings([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await client.get('/bookings');
            let rawBookings = [];
            if (res.data.data && Array.isArray(res.data.data)) {
                rawBookings = res.data.data;
            } else if (res.data.data && res.data.data.bookings) {
                rawBookings = res.data.data.bookings;
            } else if (res.data.data && res.data.data.docs) {
                rawBookings = res.data.data.docs;
            }

            setBookings(rawBookings.map(transformBooking));
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setIsLoading(false);
        }
    };

    const addBooking = async (newBooking) => {
        const { categoryId, serviceId, scheduledAt, date, notes, address, pickupLocation, dropLocation, coordinates, referenceImageFile } = newBooking;

        // Ensure we have a valid Date object
        const bookingDate = scheduledAt ? new Date(scheduledAt) : (date ? new Date(date) : new Date());

        setIsLoading(true);
        setError(null);

        try {
            // Determine which notes to use
            const finalNotes = typeof notes === 'object' ? notes.userNote : (notes || '');

            const formData = new FormData();
            if (categoryId) formData.append('categoryId', categoryId);
            if (serviceId) formData.append('serviceId', serviceId);
            formData.append('scheduledAt', bookingDate.toISOString());
            formData.append('notes', finalNotes);

            if (address) formData.append('address', address);
            if (pickupLocation) formData.append('pickupLocation', pickupLocation);
            if (dropLocation) formData.append('dropLocation', dropLocation);
            if (coordinates) formData.append('coordinates', JSON.stringify(coordinates));

            if (referenceImageFile) {
                formData.append('referenceImage', referenceImageFile);
            }

            const res = await client.post('/bookings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.status === 'success' && res.data.data) {
                const createdBooking = res.data.data.booking || res.data.data.data;
                if (createdBooking) {
                    setBookings(prev => [transformBooking(createdBooking), ...prev]);
                    return createdBooking;
                } else {
                    throw new Error("No booking data received from server");
                }
            } else {
                throw new Error(res.data.message || "Booking failed");
            }
        } catch (err) {
            console.error("Backend booking failed.", err);
            const message = err.response?.data?.message || err.message || "Booking failed. Please try again.";
            setError(message);
            toast.error(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const cancelBooking = async (id) => {
        try {
            await client.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Canceled' } : b));
            toast.success('Booking cancelled');
        } catch (err) {
            console.error("Failed to cancel booking", err);
            toast.error("Failed to cancel booking");
        }
    };

    const updateBookingStatus = async (id, status) => {
        try {
            const backendStatus = status.toUpperCase();
            await client.patch(`/bookings/${id}/status`, { status: backendStatus });
            // Soft update
            fetchBookings();
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("Failed to update status");
        }
    };

    const processPayment = async (bookingId, paymentMethod) => {
        try {
            const res = await client.post('/payments/process', {
                bookingId,
                paymentMethod: paymentMethod || 'card'
            });

            if (res.data.status === 'success') {
                toast.success('Payment processed successfully');
                fetchBookings();
                return res.data.data;
            }
        } catch (err) {
            console.error("Payment processing failed", err);
            toast.error(err.response?.data?.message || "Payment failed");
            throw err;
        }
    };

    const submitReview = async (reviewData) => {
        try {
            const { bookingId, rating, technicianRating, review } = reviewData;

            // 1. Send to Backend
            const res = await client.post(`/bookings/${bookingId}/reviews`, {
                rating,
                technicianRating,
                review
            });

            if (res.data.status === 'success') {
                toast.success('Review submitted successfully! 🎉');

                // 2. Update Local State (Remove from pending, add review to booking)
                setBookings(prev => prev.map(b => {
                    if (b.id === bookingId) {
                        return {
                            ...b,
                            review: {
                                id: res.data.data.review._id,
                                rating,
                                comment: review
                            }
                        }; // Adding review object marks it as reviewed
                    }
                    return b;
                }));

                // 3. Remove from pending list explicitly
                setPendingReviews(prev => prev.filter(b => b.id !== bookingId));

                return res.data;
            }
        } catch (err) {
            console.error("Review submission failed", err);
            toast.error(err.response?.data?.message || "Failed to submit review");
            throw err;
        }
    };

    return (
        <BookingContext.Provider value={{ bookings, isLoading, error, fetchBookings, addBooking, cancelBooking, updateBookingStatus, processPayment, pendingReviews, submitReview }}>
            {children}
        </BookingContext.Provider>
    );
};
