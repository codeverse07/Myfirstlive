import React, { createContext, useState, useContext } from 'react';


const BookingContext = createContext();

export const useBookings = () => useContext(BookingContext);

import { useUser } from './UserContext';
import client from '../api/client';
import { toast } from 'react-hot-toast';

export const BookingProvider = ({ children }) => {
    const { isAuthenticated } = useUser();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-refresh for new bookings/status updates
    React.useEffect(() => {
        let interval;
        if (isAuthenticated) {
            fetchBookings();
            interval = setInterval(fetchBookings, 30000); // Poll every 30s
        }
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Helper to transform backend booking
    const transformBooking = (doc) => {
        const dateObj = new Date(doc.scheduledAt);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Map status (backend UPPERCASE to Title Case)
        const statusMap = {
            'PENDING': 'Pending',
            'ACCEPTED': 'Assigned',
            'IN_PROGRESS': 'Assigned',
            'COMPLETED': 'Completed',
            'CANCELLED': 'Canceled'
        };

        return {
            id: doc._id || doc.id,
            serviceId: doc.service?._id || doc.service,
            serviceName: doc.service?.title || 'Reservice Detail',
            category: doc.service?.category || '',
            status: statusMap[doc.status] || doc.status,
            date,
            time,
            price: doc.price || doc.service?.price,
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
            image: doc.service?.headerImage || doc.service?.image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800', // More generic service fallback
            review: doc.review ? {
                id: doc.review._id || doc.review.id,
                rating: doc.review.rating,
                comment: doc.review.review
            } : null
        };
    };

    // Define fetchBookings as a reusable function
    const fetchBookings = async () => {
        if (!isAuthenticated) {
            setBookings([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await client.get('/bookings');
            let rawBookings = [];
            // Check response structure for JSend or direct array
            if (res.data.data && Array.isArray(res.data.data)) {
                rawBookings = res.data.data;
            } else if (res.data.data && res.data.data.docs) {
                rawBookings = res.data.data.docs;
            } else if (res.data.data && res.data.data.bookings) {
                rawBookings = res.data.data.bookings;
            }

            setBookings(rawBookings.map(transformBooking));

        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setIsLoading(false);
        }
    };

    const addBooking = async (newBooking) => {
        try {
            // White-list fields for the backend
            const {
                serviceId,
                date,
                time,
                description,
                subServiceName,
                notes,
                coordinates,
                address,
                pickupLocation,
                dropLocation
            } = newBooking;

            // Prepare notes: Combine description and subServiceName if provided
            let finalNotes = notes || '';
            if (description) finalNotes += (finalNotes ? '\n' : '') + `Description: ${description}`;
            if (subServiceName) finalNotes += (finalNotes ? '\n' : '') + `Plan: ${subServiceName}`;

            let scheduledAt;
            if (date && time) {
                scheduledAt = new Date(`${date}T${time}`);
            } else {
                scheduledAt = new Date();
            }

            // Construct sanitized payload
            const payload = {
                serviceId,
                scheduledAt,
                notes: finalNotes,
                coordinates,
                address: address || pickupLocation,
                pickupLocation,
                dropLocation
            };

            // Remove undefined fields
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            const res = await client.post('/bookings', payload);

            if (res.data.status === 'success') {
                const createdBooking = res.data.data.booking || res.data.data.data;
                setBookings(prev => [transformBooking(createdBooking), ...prev]);
            }
        } catch (err) {
            console.error("Backend booking failed.", err);
            const message = err.response?.data?.message || "Booking failed. Please try again.";
            toast.error(message);
            throw err;
        }
    };

    const cancelBooking = async (id) => {
        try {
            await client.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
            setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Canceled' } : b));
        } catch (err) {
            console.error("Failed to cancel booking", err);
        }
    };

    const updateBookingStatus = async (id, status) => {
        try {
            const backendStatus = status.toUpperCase();
            await client.patch(`/bookings/${id}/status`, { status: backendStatus });
            setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    return (
        <BookingContext.Provider value={{ bookings, isLoading, fetchBookings, addBooking, cancelBooking, updateBookingStatus }}>
            {children}
        </BookingContext.Provider>
    );
};
