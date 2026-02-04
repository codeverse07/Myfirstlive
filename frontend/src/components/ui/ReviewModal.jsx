import { useState } from 'react';
import { Star, X } from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';

const ReviewModal = ({ bookingId, onClose, onSuccess, initialData }) => {
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState(initialData?.review || '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            // Note: client.patch / client.post usually returns res.data
            if (initialData) {
                await client.patch(`/bookings/${bookingId}/reviews`, {
                    rating,
                    review
                });
                toast.success('Review updated successfully!');
            } else {
                await client.post(`/bookings/${bookingId}/reviews`, {
                    rating,
                    review
                });
                toast.success('Review submitted successfully!');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Submit review error:', error);
            const msg = error.response?.data?.message || 'Failed to submit review';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Rate Your Service</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        <p className="text-sm text-gray-500 mb-3">How was your experience?</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <Star
                                        size={32}
                                        className={`${star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-indigo-600 mt-2 h-5">
                            {rating === 1 && "Poor"}
                            {rating === 2 && "Fair"}
                            {rating === 3 && "Good"}
                            {rating === 4 && "Very Good"}
                            {rating === 5 && "Excellent"}
                        </p>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
                            Write a review
                        </label>
                        <textarea
                            id="review"
                            rows={4}
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Tell us what you liked or what needs improvement..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all placeholder:text-gray-400 text-sm"
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
