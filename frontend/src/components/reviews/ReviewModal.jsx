import React, { useState } from 'react';
import { Star, X, Check, ArrowRight, User, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, booking, onSubmit }) => {
    const [step, setStep] = useState(1); // 1: Service, 2: Technician
    const [serviceRating, setServiceRating] = useState(0);
    const [technicianRating, setTechnicianRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !booking) return null;

    const handleSubmit = async () => {
        if (technicianRating === 0) {
            toast.error('Please rate the technician');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({
                bookingId: booking.id,
                rating: serviceRating,
                technicianRating,
                review: reviewText || "Great service!" // Default text if empty
            });
            onClose();
        } catch (error) {
            // Error handled by context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (serviceRating === 0) {
            toast.error('Please rate the service');
            return;
        }
        setStep(2);
    };

    const StarRating = ({ rating, setRating, size = "lg" }) => {
        return (
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-all duration-200 hover:scale-110 focus:outline-none ${size === "lg" ? "p-1" : "p-0.5"
                            }`}
                    >
                        <Star
                            className={`${size === "lg" ? "w-10 h-10" : "w-6 h-6"
                                } ${star <= rating
                                    ? "text-yellow-400 fill-yellow-400 drop-shadow-sm"
                                    : "text-slate-200 dark:text-slate-700 fill-transparent"
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden"
                >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: step === 1 ? '50%' : '100%' }}
                        />
                    </div>

                    <div className="text-center mb-8 pt-4">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                            {step === 1 ? 'Rate Service' : 'Rate Technician'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {step === 1
                                ? `How was the ${booking.serviceName}?`
                                : `How was ${booking.technician?.name || 'the expert'}?`}
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-8 mb-8">
                        {step === 1 ? (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                key="step1"
                                className="flex flex-col items-center gap-6 w-full"
                            >
                                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-2">
                                    <Wrench className="w-10 h-10" />
                                </div>
                                <StarRating rating={serviceRating} setRating={setServiceRating} />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                key="step2"
                                className="flex flex-col items-center gap-6 w-full"
                            >
                                <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 mb-2 overflow-hidden">
                                    {booking.technician?.image ? (
                                        <img src={booking.technician.image} alt="Tech" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10" />
                                    )}
                                </div>
                                <StarRating rating={technicianRating} setRating={setTechnicianRating} />

                                <textarea
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 resize-none transition-all"
                                    placeholder="Share your experience (optional)..."
                                    rows={3}
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                />
                            </motion.div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {step === 2 && (
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                Back
                            </Button>
                        )}
                        <Button
                            className="flex-1"
                            onClick={step === 1 ? handleNext : handleSubmit}
                            isLoading={isSubmitting}
                        >
                            {step === 1 ? (
                                <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                            ) : (
                                <>Submit Review <Check className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReviewModal;
