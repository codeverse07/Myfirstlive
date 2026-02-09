import React, { useState, useEffect } from 'react';
import { useBookings } from '../context/BookingContext';
import { useUser } from '../context/UserContext';
import ReviewModal from './reviews/ReviewModal';

const ReviewManager = () => {
    const { user } = useUser();
    const { pendingReviews, submitReview } = useBookings();
    const [currentReview, setCurrentReview] = useState(null);

    useEffect(() => {
        // Only allow customers to see/submit reviews
        if (user?.role !== 'USER') return;

        if (pendingReviews && pendingReviews.length > 0) {
            // Pick the first one if no review is currently being handled
            if (!currentReview) {
                setCurrentReview(pendingReviews[0]);
            }
        } else {
            setCurrentReview(null);
        }
    }, [pendingReviews, currentReview]);

    const handleClose = () => {
        // If closed without submitting, we might want to remind them later
        // For now, we keep it open or just nullify until next refresh/trigger
        // Ideally, we shouldn't allow closing without submitting if it's mandatory
        // But for UX, we allow closing. It will pop up again next time context updates or app loads
        setCurrentReview(null);
    };

    const handleSubmit = async (data) => {
        await submitReview(data);
        setCurrentReview(null); // Will trigger effect to pick next one if any
    };

    if (user?.role !== 'USER' || !currentReview) return null;

    return (
        <ReviewModal
            isOpen={!!currentReview}
            onClose={handleClose}
            booking={currentReview}
            onSubmit={handleSubmit}
        />
    );
};

export default ReviewManager;
