import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Clock, CheckCircle, User, Calendar, ChevronRight, Search, History, XCircle, TrendingUp, ShieldQuestion, Phone, Mail, Sparkles } from 'lucide-react';
import Button from '../../components/common/Button';
import { useBookings } from '../../context/BookingContext';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import MobileBookingsPage from './MobileBookingsPage';
import BookingDetailPanel from '../../components/mobile/BookingDetailPanel';
import ReviewModal from '../../components/ui/ReviewModal';

const StatusBadge = ({ status }) => {
    const styles = {
        Pending: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
        Assigned: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-yellow-500/20',
        'In Progress': 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
        Completed: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
        Canceled: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
    };

    const icons = {
        Pending: Clock,
        Assigned: User,
        'In Progress': TrendingUp,
        Completed: CheckCircle,
        Canceled: XCircle,
    };

    const Icon = icons[status] || Clock;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
};

const BookingCard = ({ booking, cancelBooking, onViewDetails, onReview }) => {
    return (
        <div
            onClick={() => onViewDetails(booking)}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group cursor-pointer"
        >
            <div className="flex flex-col sm:flex-row gap-5">
                {/* Service Image */}
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                    <img
                        src={booking.service?.headerImage || booking.image || booking.service?.image}
                        alt={booking.serviceName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{booking.serviceName}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        {booking.date}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        {booking.time}
                                    </div>
                                    <div className="font-bold text-rose-600 dark:text-rose-400">
                                        ₹{booking.price}
                                    </div>
                                </div>
                            </div>
                            <StatusBadge status={booking.status} />
                        </div>

                        {/* Technician Info (if assigned) */}
                        {booking.technician && (
                            <div className="mt-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 w-fit">
                                <img
                                    src={booking.technician.image}
                                    alt={booking.technician.name}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.technician.name) + '&background=random';
                                    }}
                                />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Technician</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{booking.technician.name}</p>
                                </div>
                            </div>
                        )}

                        {/* Happy Pin Display for User */}
                        {['Assigned', 'In Progress'].includes(booking.status) && booking.securityPin && (
                            <div className="mt-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800/50 w-fit">
                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Happy Pin:</span>
                                <span className="text-sm font-black text-blue-800 dark:text-blue-100 tracking-wider font-mono">{booking.securityPin}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 sm:mt-0 flex items-center justify-end gap-3">
                        {['Pending', 'Assigned'].includes(booking.status) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to cancel this request?')) {
                                        cancelBooking(booking.id);
                                    }
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                            >
                                Cancel Request
                            </button>
                        )}

                        {booking.status === 'Completed' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReview(booking);
                                }}
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-1 fill-current" />
                                {booking.rating > 0 ? 'Update Review' : 'Rate Service'}
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(booking);
                            }}
                        >
                            View Details <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsWidget = () => {
    const { bookings } = useBookings();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Activity Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{bookings.length}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                    <p className="text-blue-600 dark:text-blue-400 text-xs uppercase font-bold tracking-wider mb-1">Active</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {bookings.filter(b => ['Pending', 'Assigned'].includes(b.status)).length}
                    </p>
                </div>
            </div>
        </div>
    );
};

const SupportWidget = () => (
    <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/10">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <ShieldQuestion className="w-5 h-5 text-blue-400" />
            Need Help?
        </h3>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Having trouble with a booking? Our support team is available 24/7.
        </p>
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-300">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>support@reservice.com</span>
            </div>
        </div>
    </div>
);

const BookingsPage = () => {
    const [activeTab, setActiveTab] = useState('Pending'); // Pending, Assigned, Completed, History
    const { bookings, cancelBooking, updateBookingStatus } = useBookings();
    const { user, isAuthenticated, isLoading } = useUser();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    // Details & Review State
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isLoading, isAuthenticated, navigate]);

    useGSAP(() => {
        gsap.from(".animate-item", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
        });
    }, { scope: containerRef });

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setIsDetailOpen(true);
    };

    const handleReview = (booking) => {
        setSelectedBooking(booking);
        setIsReviewOpen(true);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

    if (!user) return null;

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'History') return ['Completed', 'Canceled'].includes(b.status);
        if (activeTab === 'Pending') return b.status === 'Pending';
        if (activeTab === 'Assigned') return ['Assigned', 'In Progress'].includes(b.status);
        if (activeTab === 'Completed') return b.status === 'Completed';
        return true;
    });

    return (
        <>
            <div className="block md:hidden">
                <MobileBookingsPage />
            </div>
            <div ref={containerRef} className="hidden md:block relative min-h-screen bg-transparent dark:bg-slate-950 selection:bg-blue-100 dark:selection:bg-blue-900/30 overflow-hidden transition-colors duration-300">
                {/* Background Decorations */}
                <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] opacity-20 dark:opacity-10" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/[0.02] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-300/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    {/* Dashboard Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-end animate-item">
                        <div className="lg:col-span-2">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">
                                Welcome, {user.name.split(' ')[0]} <Sparkles className="inline-block w-8 h-8 text-yellow-400 ml-2 fill-yellow-400" />
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">Here's the status of your service requests.</p>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="grid grid-cols-2 w-full gap-3 md:flex md:w-auto lg:w-full">
                                <Button
                                    variant="outline"
                                    className={`w-full h-full md:w-auto lg:flex-1 justify-center gap-2 ${activeTab === 'History' ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' : 'bg-white dark:bg-slate-900'}`}
                                    onClick={() => setActiveTab('History')}
                                >
                                    <History className="w-4 h-4" />
                                    <span>History</span>
                                </Button>
                                <Link to="/services" className="w-full h-full md:w-auto lg:flex-1">
                                    <Button className="w-full h-full md:w-auto md:px-6 lg:w-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
                                        + Book  Service
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-8 animate-item">
                            {/* Tabs */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="flex border-b border-slate-100 dark:border-slate-800">
                                    {['Pending', 'Assigned', 'Completed'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                                ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-500/10'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* List Content */}
                            <div className="space-y-4">
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map(booking => (
                                        <BookingCard
                                            key={booking.id}
                                            booking={booking}
                                            cancelBooking={cancelBooking}
                                            onViewDetails={handleViewDetails}
                                            onReview={handleReview}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 mb-4 text-slate-400 dark:text-slate-500">
                                            <Search className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-slate-900 dark:text-white font-medium mb-1">No {activeTab.toLowerCase()} requests</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">You don't have any requests in this category.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Area */}
                        <div className="space-y-6 animate-item">
                            <StatsWidget />
                            <SupportWidget />
                        </div>
                    </div>
                </div>

                {/* Integration of Desktop Modals */}
                <BookingDetailPanel
                    isOpen={isDetailOpen}
                    booking={selectedBooking}
                    onClose={() => setIsDetailOpen(false)}
                    onUpdateStatus={updateBookingStatus}
                />

                {isReviewOpen && selectedBooking && (
                    <ReviewModal
                        bookingId={selectedBooking.id}
                        onClose={() => setIsReviewOpen(false)}
                        onSuccess={() => {
                            // Optionally refresh bookings or show success message
                            // Bookings are auto-updated by context if real-time or regular fetch
                        }}
                        initialData={{ rating: selectedBooking.rating, review: selectedBooking.review }}
                    />
                )}
            </div>
        </>
    );
};

export default BookingsPage;
