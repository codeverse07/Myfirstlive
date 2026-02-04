import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ShieldCheck, Clock, User, Phone } from 'lucide-react';
import client from '../../api/client';
import Button from '../../components/common/Button';
import { useBookings } from '../../context/BookingContext';
import { useUser } from '../../context/UserContext';
import BookingModal from '../../components/bookings/BookingModal';

const ServiceDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addBooking } = useBookings();
    const { isAuthenticated } = useUser();

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [userCoords, setUserCoords] = useState(null);

    // Get User Location for ETA
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserCoords([position.coords.longitude, position.coords.latitude]);
                },
                (error) => console.log("Location access denied or error:", error)
            );
        }
    }, []);

    useEffect(() => {
        const fetchServiceDetails = async () => {
            try {
                // Fetch service details
                const res = await client.get(`/services/${id}`);
                setService(res.data.data.service);

                // Fetch real reviews
                if (res.data.data.service?.technician?._id) {
                    fetchReviews(res.data.data.service.technician._id);
                }
            } catch (err) {
                console.error("Failed to fetch service details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchServiceDetails();
    }, [id]);

    const fetchReviews = async (technicianId) => {
        try {
            setLoadingReviews(true);
            const res = await client.get(`/technicians/${technicianId}/reviews`);
            setReviews(res.data.data.reviews);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleBookClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setIsBookingModalOpen(true);
    };

    const handleConfirmBooking = async (bookingData) => {
        try {
            await addBooking(bookingData);
            setIsBookingModalOpen(false);
            navigate('/bookings');
        } catch (err) {
            // Error handled by context toast
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!service) return <div className="min-h-screen flex items-center justify-center">Service not found</div>;

    const techProfile = service.technician?.technicianProfile || {};
    const techName = service.technician?.name || 'Technician';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh]">
                <img
                    src={service.headerImage || service.image || 'https://images.unsplash.com/photo-1581578731117-104f2a41d58e?auto=format&fit=crop&q=80'}
                    alt={service.title}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent" />

                <div className="absolute top-6 left-6 z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold uppercase tracking-wider text-sm">
                            <span className="bg-rose-500/20 px-3 py-1 rounded-full backdrop-blur-md border border-rose-500/30">
                                {service.category}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-4">{service.title}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-medium text-slate-200">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                <span className="text-white font-bold">{service.rating > 0 ? service.rating : "New"}</span>
                                {service.rating > 0 && <span className="text-white/60">({reviews.length} reviews)</span>}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-5 h-5" />
                                <span>{techProfile.isOnline ? "Online Now" : "60 mins estimated"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                <span>Verified Professional</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About this Service</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-6">
                            {service.description}
                        </p>

                        {/* Technician Contact Info */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 border border-slate-100 dark:border-slate-700">
                            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm overflow-hidden">
                                {service.technician?.profilePhoto ? (
                                    <img
                                        src={service.technician.profilePhoto}
                                        alt={techName}
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    techName[0]
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Technician</p>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{techName}</h3>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <Phone className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {service.technician?.phone || "No phone available"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <MapPin className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {(() => {
                                                const techCoords = service.technician?.technicianProfile?.location?.coordinates;
                                                // Default to address if no coords or user location
                                                if (!userCoords || !techCoords) return techProfile.location?.address || "Location hidden";

                                                const toRad = (value) => (value * Math.PI) / 180;
                                                const R = 6371; // km
                                                const [lon1, lat1] = userCoords;
                                                const [lon2, lat2] = techCoords;

                                                const dLat = toRad(lat2 - lat1);
                                                const dLon = toRad(lon2 - lon1);
                                                const a =
                                                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                                                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                                const distance = parseFloat((R * c).toFixed(1));
                                                const eta = Math.ceil((distance / 30) * 60 + 10);

                                                return `${eta} min (${distance} km) away`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bio if available */}
                        {techProfile.bio && (
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Technician Bio</h3>
                                <p className="text-sm text-slate-500 italic">"{techProfile.bio}"</p>
                            </div>
                        )}
                    </div>

                    {/* Customer Reviews */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer Reviews</h2>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                                {reviews.length} Reviews
                            </span>
                        </div>

                        {loadingReviews ? (
                            <div className="text-center py-8 text-slate-400">Loading reviews...</div>
                        ) : reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <div key={review._id} className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                                    {review.customer?.profilePhoto ? (
                                                        <img src={review.customer.profilePhoto} alt={review.customer.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        review.customer?.name?.[0] || 'U'
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{review.customer?.name || 'Anonymous'}</h4>
                                                    <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded-lg">
                                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{review.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 pl-13">
                                            "{review.review}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-900 dark:text-white font-bold">No reviews yet</p>
                                <p className="text-slate-500 text-sm mt-1">Be the first to leave a review!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Booking */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800">
                        {/* ... Existing Pricing Sidebar Code ... */}
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Total Price</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">₹{service.price}</span>
                                    {service.originalPrice && (
                                        <span className="text-lg text-slate-400 line-through decoration-2">₹{service.originalPrice}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {/* ... Existing List Items ... */}
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                </div>
                                Secure Payment
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                24/7 Support
                            </li>
                        </ul>

                        <Button size="lg" className="w-full justify-center py-4 text-lg" onClick={handleBookClick}>
                            Book Now
                        </Button>
                        <p className="text-center text-xs text-slate-400 mt-4">No charges until service completion</p>
                    </div>
                </div>
            </div>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                service={service}
                onConfirm={handleConfirmBooking}
            />
        </div>
    );
};

export default ServiceDetailsPage;
