import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Search, Star } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useAdmin } from '../../context/AdminContext';
import { useBookings } from '../../context/BookingContext';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import Button from '../../components/common/Button';
import BookingModal from '../../components/bookings/BookingModal';
// import MobileServiceDetail from '../../pages/Services/MobileServiceDetail';

const SavedServicesPage = () => {
    const navigate = useNavigate();
    const { savedServices, toggleSavedService } = useUser();
    // const { services } = useAdmin(); // REMOVED
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addBooking } = useBookings();

    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await client.get('/services');
                if (res.data.data) {
                    setServices(res.data.data.services || res.data.data.docs || []);
                }
            } catch (err) {
                console.error("Failed to fetch services for saved list:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const savedList = services.filter(service => savedServices.includes(service.id));

    const handleBookClick = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCardClick = (service) => {
        navigate(`/services/${service._id || service.id}`);
    };

    const handleConfirmBooking = async (bookingData) => {
        try {
            return await addBooking(bookingData);
        } catch (err) {
            console.error("Booking error:", err);
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-transparent dark:bg-slate-950 pb-20">
            {/* Mobile Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 md:hidden">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Saved Services</h1>
                </div>
            </div>

            <main className="p-5">
                {savedList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedList.map(service => (
                            <div
                                key={service.id}
                                onClick={() => handleCardClick(service)}
                                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 group relative cursor-pointer"
                            >
                                <div className="h-44 relative overflow-hidden">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSavedService(service.id);
                                        }}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                    >
                                        <Heart className="w-5 h-5 fill-current" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{service.title}</h3>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="text-xs font-bold">{service.rating}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-4">
                                        {typeof service.category === 'string' ? service.category : service.category?.name}
                                    </p>
                                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                                        <span className="text-lg font-black text-slate-900 dark:text-white">₹{service.price}</span>
                                        <Button
                                            size="sm"
                                            className="bg-rose-600 hover:bg-rose-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBookClick(service);
                                            }}
                                        >
                                            Book Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6 text-rose-500">
                            <Heart className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No saved services yet</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">
                            Bookmark your favorite services to quickly find them later.
                        </p>
                        <Button
                            onClick={() => navigate('/services')}
                            className="bg-rose-600 hover:bg-rose-700 px-8 py-3 rounded-2xl shadow-lg shadow-rose-500/25"
                        >
                            Browse Services
                        </Button>
                    </div>
                )}
            </main>

            <MobileBottomNav />

            {/* Booking Integration */}
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                service={selectedService}
                onConfirm={handleConfirmBooking}
            />

            {isMobileDetailOpen && selectedService && (
                /* MobileServiceDetail removed */
                null
            )}
        </div>
    );
};

export default SavedServicesPage;
