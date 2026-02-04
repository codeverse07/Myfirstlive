import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, ShieldCheck, MapPin, Receipt, ChevronRight, MessageSquare, Phone, Mail, Star } from 'lucide-react';

const BookingDetailPanel = ({ booking, isOpen, onClose, onHelp, onUpdateStatus, focusTechnician }) => {
    const scrollContainerRef = React.useRef(null);
    const technicianSectionRef = React.useRef(null);

    React.useEffect(() => {
        if (isOpen && focusTechnician && scrollContainerRef.current && technicianSectionRef.current) {
            // Short delay to ensure transition is underway/layout is stable
            const timer = setTimeout(() => {
                technicianSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return () => clearTimeout(timer);
        } else if (isOpen && !focusTechnician && scrollContainerRef.current) {
            // Reset scroll to top if not focusing on technician
            scrollContainerRef.current.scrollTo(0, 0);
        }
    }, [isOpen, focusTechnician]);

    if (!booking) return null;

    const steps = [
        { label: 'Requested', time: '10:30 AM', completed: true },
        { label: 'Technician Assigned', time: '10:45 AM', completed: booking.status !== 'Pending' },
        { label: 'Started', time: '--:--', completed: booking.status === 'Completed' },
        { label: 'Finished', time: '--:--', completed: booking.status === 'Completed' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-950 rounded-t-[3rem] border-t border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white">Order Summary</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">ID: #{booking.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-90 transition-all font-bold"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto p-6 space-y-8 pb-24"
                        >
                            {/* Status Timeline */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Tracking History</h4>
                                <div className="space-y-6 relative">
                                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                                    {steps.map((step, i) => (
                                        <div key={i} className="flex gap-6 relative">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${step.completed ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
                                                {step.completed ? <ShieldCheck className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold ${step.completed ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{step.label}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{step.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Service Info */}
                            <section className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                                        <img src={booking.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-slate-900 dark:text-white">{booking.serviceName}</h5>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{booking.date} • {booking.time}</span>
                                        </div>
                                    </div>
                                </div>
                                {booking.status !== 'Completed' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm text-xs text-slate-600 dark:text-slate-400">
                                            <MapPin className="w-4 h-4 text-rose-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black uppercase text-slate-400">Pickup</p>
                                                <p className="truncate font-bold text-slate-700 dark:text-slate-300">
                                                    {booking.pickupLocation || booking.address || 'User Primary Address'}
                                                </p>
                                            </div>
                                        </div>
                                        {booking.dropLocation && (
                                            <div className="flex items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/30 shadow-sm text-xs text-slate-600 dark:text-slate-400">
                                                <MapPin className="w-4 h-4 text-indigo-600" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase text-indigo-400">Drop Location</p>
                                                    <p className="truncate font-bold text-slate-900 dark:text-white uppercase tracking-tight">{booking.dropLocation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Bill Details */}
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Payment Summary</h4>
                                <div className="space-y-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Service Fee</span>
                                        <span className="font-bold text-slate-900 dark:text-white">₹{booking.price - 50}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Convenience</span>
                                        <span className="font-bold text-slate-900 dark:text-white">₹50</span>
                                    </div>
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-black text-slate-900 dark:text-white">Total</span>
                                        <span className="font-black text-rose-600 dark:text-rose-400">₹{booking.price}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Technician (if any) */}
                            {booking.technician && (
                                <section ref={technicianSectionRef}>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Your Expert</h4>
                                    <div className="bg-indigo-50/30 dark:bg-indigo-500/5 p-5 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/10 mb-4">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="relative">
                                                <img
                                                    src={booking.technician.image}
                                                    className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-900"
                                                    alt={booking.technician.name}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.technician.name) + '&background=random';
                                                    }}
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white text-base">{booking.technician.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">4.9</span>
                                                    </div>
                                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{booking.technician.experience || '8+ Years Exp'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/50 dark:border-slate-800/50">
                                                <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Mobile Number</p>
                                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{booking.technician.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/50 dark:border-slate-800/50">
                                                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Official Email</p>
                                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{booking.technician.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sticky Actions */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={onHelp}
                                className="flex-1 py-4 px-4 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Support
                            </button>

                            {booking.status === 'Assigned' ? (
                                <button
                                    onClick={() => {
                                        onUpdateStatus(booking.id, 'Completed');
                                        onClose();
                                        alert("Service marked as completed!");
                                    }}
                                    className="flex-[1.5] py-4 px-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                                >
                                    Complete Service
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => alert("Tracking live... (Simulation)")}
                                    className="flex-[1.5] py-4 px-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                                >
                                    Track Live
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookingDetailPanel;
