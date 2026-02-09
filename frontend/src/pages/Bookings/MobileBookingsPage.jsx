import React from 'react';

import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import { ArrowLeft, Clock, Calendar, MessageSquare, Phone, Mail, Star, Eye, HelpCircle, ShieldCheck, Sparkles, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { useBookings } from '../../context/BookingContext';
import BookingDetailPanel from '../../components/mobile/BookingDetailPanel';
import ReviewModal from '../../components/ui/ReviewModal';

const MobileBookingsPage = () => {
    const { user, isAuthenticated, setIsChatOpen, isLoading } = useUser();
    const navigate = useNavigate();
    const { bookings: contextBookings, cancelBooking, updateBookingStatus } = useBookings();
    const [activeStatus, setActiveStatus] = React.useState('Pending');
    const [activeBookingId, setActiveBookingId] = React.useState(null);
    const [selectedBooking, setSelectedBooking] = React.useState(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);
    const [isReviewOpen, setIsReviewOpen] = React.useState(false);
    const [focusTechnician, setFocusTechnician] = React.useState(false);

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isLoading, isAuthenticated, navigate]);

    // Filter bookings based on status
    const filteredBookings = React.useMemo(() => contextBookings.filter(b => {
        const status = b.status?.toUpperCase() || 'PENDING';
        if (activeStatus === 'Pending') return status === 'PENDING';
        if (activeStatus === 'Assigned') return ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(status);
        if (activeStatus === 'Completed') return ['COMPLETED', 'CANCELLED'].includes(status);
        return true;
    }), [contextBookings, activeStatus]);

    // Intersection Observer for Rotating Border
    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (window.innerWidth >= 768) return;

            // Bookings-Specific: Fast-reactive capture for spaced cards
            const bestEntry = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (bestEntry && bestEntry.intersectionRatio > 0.1) {
                const newId = bestEntry.target.dataset.id; // Keep as string
                setActiveBookingId(prev => (prev === newId ? prev : newId));
            }
        }, {
            threshold: [0, 0.5, 1], // Reduced threshold density
            rootMargin: "-10% 0px -10% 0px" // Light margin to handle spacing
        });

        const cards = document.querySelectorAll('.booking-card-item');
        cards.forEach(card => observer.observe(card));

        // Sync activeBookingId: if current active is gone, or none active, set to first available
        if (filteredBookings.length > 0) {
            const isCurrentActiveStillValid = filteredBookings.some(b => b.id === activeBookingId);
            if (!isCurrentActiveStillValid) {
                setActiveBookingId(filteredBookings[0].id);
            }
        } else {
            setActiveBookingId(null);
        }

        return () => observer.disconnect();
    }, [activeStatus, filteredBookings, activeBookingId]); // Added activeBookingId to sync logic

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950"><div className="animate-spin w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full"></div></div>;

    if (!user) return null;

    // Counts for tabs
    const counts = {
        Pending: contextBookings.filter(b => (b.status?.toUpperCase() || 'PENDING') === 'PENDING').length,
        Assigned: contextBookings.filter(b => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status?.toUpperCase())).length,
        Completed: contextBookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status?.toUpperCase())).length,
    };

    const tabs = ['Pending', 'Assigned', 'Completed'];

    return (
        <div className="min-h-screen bg-transparent dark:bg-slate-950 pb-24 font-sans transition-colors duration-300 relative overflow-hidden">
            {/* ... (Header and decorations - unchanged) ... */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] opacity-20 dark:opacity-10" />
            </div>

            {/* Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-40 px-4 py-3 shadow-none flex items-center justify-between border-b border-gray-100/50 dark:border-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                    </Link>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">My Bookings</h1>
                </div>
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-500/20">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-2 h-2 bg-rose-500 rounded-full animate-ping opacity-75" />
                        <div className="w-1.5 h-1.5 bg-rose-600 dark:bg-rose-500 rounded-full relative z-10 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Live</span>
                </div>
            </div>

            {/* Header Content */}
            <div className="px-4 pt-8 pb-6 relative">
                {/* ... (Welcome text etc - unchanged) ... */}
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                    Welcome, {user.name.split(' ')[0]} <span className="inline-block animate-wave">👋</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium mb-8">Your dashboard is active and up to date.</p>

                {/* Quick Stats - Futuristic Slates */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* ... (Pending/Assigned stats - unchanged) ... */}
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-gray-100/50 dark:border-slate-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden group transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                        <p className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2 opacity-80">Ongoing</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{counts.Assigned}</p>
                            <Clock className="w-4 h-4 text-slate-200 dark:text-slate-800" />
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-gray-100/50 dark:border-slate-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden group transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 opacity-80">Upcoming</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{counts.Pending}</p>
                            <Calendar className="w-4 h-4 text-slate-200 dark:text-slate-800" />
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-gray-100/50 dark:border-slate-800/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden group transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                        <p className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-2 opacity-80">Completed</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{counts.Completed}</p>
                            <ShieldCheck className="w-4 h-4 text-slate-200 dark:text-slate-800" />
                        </div>
                    </div>
                </div>

                <Link to="/services">
                    <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Book New Service
                    </button>
                </Link>
            </div>

            {/* Tabs */}
            <div className="px-4 mb-4">
                <div className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-[1.5rem] flex items-center justify-between border border-gray-100/50 dark:border-slate-800/50 shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveStatus(tab)}
                            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeStatus === tab
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab}
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${activeStatus === tab
                                ? 'bg-rose-500/30 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}>
                                {counts[tab]}
                            </span>
                            {tab === 'Assigned' && counts.Assigned > 0 && (
                                <span className="absolute top-1 right-3 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-sm shadow-yellow-400/50" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                layout
                className="px-4 space-y-10 pb-8"
            >
                <AnimatePresence mode="popLayout">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, index) => {
                            const statusColors = {
                                Pending: { c1: '#ff0033', c2: '#330000', glow: 'rgba(255, 0, 51, 0.7)' }, // Neon Red
                                Assigned: { c1: '#fbbf24', c2: '#713f12', glow: 'rgba(251, 191, 36, 0.5)' }, // Neon Yellow
                                Completed: { c1: '#22c55e', c2: '#052e16', glow: 'rgba(34, 197, 94, 0.5)' } // Neon Green
                            };
                            const colors = statusColors[booking.status] || { c1: '#2563eb', c2: '#7c3aed', glow: 'rgba(37, 99, 235, 0.5)' };

                            return (
                                <motion.div
                                    key={booking.id}
                                    data-id={booking.id}
                                    style={{
                                        '--border-color-1': colors.c1,
                                        '--border-color-2': colors.c2,
                                        '--glow-color': colors.glow,
                                    }}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className={`booking-card-item relative rounded-[2rem] shadow-[0_2px_12px_rgb(0,0,0,0.04)] dark:shadow-black/40 ring-1 ring-transparent dark:ring-white/5 transition-all duration-300 transform rotating-border-bookings ${String(activeBookingId) === String(booking.id) ? 'active scale-[1.02] shadow-2xl' : 'scale-100'} cursor-pointer`}
                                    onClick={() => {
                                        setSelectedBooking(booking);
                                        setFocusTechnician(false);
                                        setIsDetailOpen(true);
                                    }}
                                >
                                    <div className="rounded-[2rem] overflow-hidden w-full min-h-[180px] relative z-10 bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-4 isolation-isolate">
                                        {/* Service Info */}
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden shadow-sm">
                                                <img src={booking.service?.headerImage || booking.image || booking.service?.image} alt={booking.serviceName} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 flex-1">{booking.serviceName}</h3>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0
                                                ${booking.status === 'Completed' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' :
                                                            booking.status === 'Assigned' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' :
                                                                booking.status === 'Canceled' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30' :
                                                                    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="font-bold">#{booking.id?.slice(-6) || 'N/A'}</span>
                                                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                                    </div>
                                                    <span className="truncate">{booking.date} • {booking.time}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="font-black text-rose-600 dark:text-rose-400">
                                                        ₹{booking.price}
                                                    </div>
                                                    {booking.status === 'Assigned' && booking.securityPin && (
                                                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                                                            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                            <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-tight">PIN: <span className="text-sm font-mono tracking-widest ml-1">{booking.securityPin}</span></span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Technician Info (if assigned) OR Placeholder */}
                                        {booking.technician ? (
                                            <div className="space-y-3">
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBooking(booking);
                                                        setFocusTechnician(true); // Set to true when clicking technician info
                                                        setIsDetailOpen(true);
                                                    }}
                                                    className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[1.5rem] flex justify-between items-center border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-[0.98] transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img
                                                                src={booking.technician.image}
                                                                alt={booking.technician.name}
                                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:border-indigo-500/30 transition-colors"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.technician.name) + '&background=random';
                                                                }}
                                                            />
                                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"></div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                    {booking.technician.name}
                                                                </p>
                                                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">4.9</span>
                                                                </div>
                                                                <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0" />
                                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter shrink-0">{booking.technician.experience || '8+ Years'}</span>
                                                                <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0" />
                                                                <span className="text-[10px] font-bold text-slate-400 truncate flex-1 min-w-[50px]">View Info</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 py-4 px-5 bg-slate-50/50 dark:bg-slate-800/20 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-800/50">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {booking.status === 'Completed' ? 'Service Finished Successfully' : 'Finding your expert nearby...'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {booking.status === 'Completed' ? 'Thank you for choosing Reservice' : 'Estimated assignment in 15 mins'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                                            {['Pending', 'Assigned', 'ACCEPTED', 'IN_PROGRESS'].includes(booking.status) ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Cancel this request?')) {
                                                            cancelBooking(booking.id);
                                                        }
                                                    }}
                                                    className="flex-1 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    Cancel Request
                                                </button>
                                            ) : null}

                                            {booking.status === 'Completed' ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBooking(booking);
                                                        setIsReviewOpen(true);
                                                    }}
                                                    className="flex-1 py-3 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {booking.rating ? 'Update Review' : 'Rate Service'}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24 text-center"
                        >
                            <div className="w-24 h-24 mb-6 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 relative">
                                <Sparkles className="w-12 h-12 animate-pulse" />
                                <div className="absolute -top-2 -right-2 bg-blue-500 w-4 h-4 rounded-full animate-bounce" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Clean Slate!</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[200px] mx-auto leading-relaxed">
                                No {activeStatus.toLowerCase()} bookings found. Time to relax!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <MobileBottomNav />

            {/* Futuristic Details Sheet */}
            <BookingDetailPanel
                isOpen={isDetailOpen}
                booking={selectedBooking}
                focusTechnician={focusTechnician}
                onClose={() => setIsDetailOpen(false)}
                onUpdateStatus={updateBookingStatus}
            />

            {isReviewOpen && selectedBooking && (
                <ReviewModal
                    bookingId={selectedBooking.id}
                    onClose={() => setIsReviewOpen(false)}
                    onSuccess={() => {
                        // Refresh logic handled by context or can trigger a toast
                    }}
                    initialData={{ rating: selectedBooking.rating, review: selectedBooking.review }}
                />
            )}
        </div>
    );
};

export default MobileBookingsPage;
