import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, ShieldCheck, CheckCircle, Sparkles, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useBookings } from '../../context/BookingContext';
// import { useAdmin } from '../../context/AdminContext';
import { useUser } from '../../context/UserContext'; // Added useUser import
import { services as staticServices } from '../../data/mockData';

// Local Assets (Gemini Generated)
import basicImg from '../../assets/services/basic.png';
import premiumImg from '../../assets/services/premium.png';
import consultationImg from '../../assets/services/consultation.png';

const MobileServiceDetail = ({ service, onClose }) => {
    const navigate = useNavigate();
    const { addBooking } = useBookings();
    // const { services } = useAdmin(); // REMOVED
    const { isAuthenticated, user } = useUser();

    // Prevent background scrolling when modal is open
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // const service = services.find(s => s.id === (serviceId || 1)) || services[0]; // REMOVED: Using passed prop
    if (!service) return null; // Safety check
    const [selectedSubService, setSelectedSubService] = React.useState(null);
    const [pickupLocation, setPickupLocation] = React.useState(user?.address || '');
    const [dropLocation, setDropLocation] = React.useState('');
    const { updateProfile } = useUser();

    const isShiftingOrTransport = service.category === 'houseshifting' || service.category === 'transport';

    // Get active subservices from AdminContext or fallback to defaults
    const activeSubServicesByAdmin = (service.subServices || []).filter(ss => ss.isActive);

    // Map the admin settings to the UI structure (with images)
    const subServices = activeSubServicesByAdmin
        .filter(ss => isShiftingOrTransport ? ss.id === 'consultation' : true)
        .map(ss => ({
            ...ss,
            image: ss.id === 'basic' ? basicImg : (ss.id === 'premium' ? premiumImg : consultationImg)
        }));

    // Auto-select first available subservice
    React.useEffect(() => {
        if (subServices.length > 0 && !selectedSubService) {
            setSelectedSubService(subServices[0].id);
        }
    }, [subServices, selectedSubService]);

    const activeSubService = subServices.find(s => s.id === selectedSubService) || subServices[0];

    const handleBooking = async () => {
        if (!activeSubService) return;

        if (!isAuthenticated) {
            onClose();
            navigate('/login');
            return;
        }

        // Mandatory address check
        if (!pickupLocation) {
            toast.error('Please provide a service address');
            return;
        }
        const targetAddress = pickupLocation;

        // Sync to profile if missing
        if (!user?.address) {
            await updateProfile({ address: targetAddress });
        }

        addBooking({
            serviceId: service.id || service._id,
            serviceName: service.title,
            subServiceName: activeSubService.name,
            price: activeSubService.price,
            image: service.image,
            address: targetAddress,
            pickupLocation: isShiftingOrTransport ? pickupLocation : targetAddress,
            dropLocation: isShiftingOrTransport ? dropLocation : undefined
        });
        onClose();
        navigate('/bookings');
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-60 bg-[#FCFAF2] dark:bg-slate-950 flex flex-col"
        >
            {/* Header */}
            <div className="relative h-64 overflow-hidden">
                <img src={service.image} className="w-full h-full object-cover" alt={service.title} />
                <div className="absolute inset-0 bg-linear-to-t from-white dark:from-slate-950 via-transparent to-transparent" />
                <button
                    onClick={onClose}
                    className="absolute top-6 left-4 p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-lg active:scale-95 transition-all text-slate-900 dark:text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 -mt-12 relative z-10 pb-32">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                {service.title}
                            </h2>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-black">{service.rating}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5 mb-2">
                            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">About this service</p>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed transition-colors">
                                {service.description || "High-quality professional service tailored to your specific needs. Our verified experts ensure the best results with a 30-day warranty."}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Service Plan</h3>
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Popular choice
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {subServices.length > 0 ? subServices.map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => setSelectedSubService(sub.id)}
                                    className={`relative p-5 rounded-4xl border-2 transition-all duration-300 text-left group flex items-center gap-4 ${selectedSubService === sub.id
                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10'
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                                        }`}
                                >
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md">
                                        <img src={sub.image} className="w-full h-full object-cover" alt={sub.name} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{sub.name}</span>
                                            <span className="font-black text-indigo-600 dark:text-indigo-400">₹{sub.price}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">{sub.description}</p>
                                    </div>
                                    <div className={`absolute top-4 right-4 transition-all duration-300 ${selectedSubService === sub.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                        <CheckCircle className="w-6 h-6 text-indigo-600 fill-white dark:fill-slate-900" />
                                    </div>
                                </button>
                            )) : (
                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-slate-400 font-bold text-sm">No service plans currently available.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] shadow-sm space-y-4">
                        <div className="space-y-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <MapPin className={`w-5 h-5 ${isShiftingOrTransport ? 'text-rose-500' : 'text-indigo-600'}`} />
                                {isShiftingOrTransport ? 'Pickup Location' : 'Service Address'}
                            </h4>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={isShiftingOrTransport ? "Enter origin address" : "Where should we come?"}
                                    value={pickupLocation}
                                    onChange={(e) => setPickupLocation(e.target.value)}
                                    className="w-full pl-0 pr-4 py-2 bg-transparent border-b-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                />
                            </div>
                        </div>

                        {isShiftingOrTransport && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-600" /> Drop Location
                                </h4>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter destination address"
                                        value={dropLocation}
                                        onChange={(e) => setDropLocation(e.target.value)}
                                        className="w-full pl-0 pr-4 py-2 bg-transparent border-b-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white font-bold transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    />
                                </div>
                            </div>
                        )}

                        {!isShiftingOrTransport && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Enter the location where you need this service</p>
                        )}
                        {isShiftingOrTransport && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Required for accurate distance-based pricing</p>
                        )}
                    </div>

                    {isShiftingOrTransport && (
                        <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                            <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4" /> Pricing Verification
                            </h4>
                            <p className="text-[11px] text-amber-600 dark:text-amber-500 font-bold leading-relaxed">
                                House shifting prices depend on distance and load. The initial booking is for a consultation and verification visit. A fixed, final price will be provided and fixed once the details are verified on-site.
                            </p>
                        </div>
                    )}

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-4">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" /> Reservice Protect
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                30-day warranty on all services
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                Verified and background-checked experts
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                Transparent pricing with no hidden costs
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-20">
                <button
                    onClick={handleBooking}
                    disabled={!activeSubService}
                    className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-4xl font-black text-lg shadow-xl shadow-slate-900/10 dark:shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                >
                    Book {activeSubService?.name || 'Service'} • ₹{activeSubService?.price || service.price}
                </button>
            </div>
        </motion.div>
    );
};

export default MobileServiceDetail;
