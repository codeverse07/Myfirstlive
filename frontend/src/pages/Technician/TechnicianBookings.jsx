import React, { useState, useEffect } from 'react';
import { useTechnician } from '../../context/TechnicianContext';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Play, CheckSquare, Loader, Star, Bell, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';

const TechnicianBookings = () => {
    const { jobs, loading, updateBookingStatus, reasons, fetchReasons } = useTechnician();
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('requests');
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [completionForm, setCompletionForm] = useState({
        securityPin: '',
        finalAmount: '',
        extraReason: '',
        technicianNote: '',
        partImages: [],
        previews: []
    });
    const [selectedReason, setSelectedReason] = useState('');

    const handleAction = async (bookingId, status) => {
        if (status === 'COMPLETED') {
            const booking = jobs.find(j => j._id === bookingId);
            setCurrentBooking(booking);
            setCompletionForm(prev => ({ ...prev, finalAmount: booking.price }));
            setShowCompletionModal(true);
            return;
        }

        setActionLoading(bookingId);
        try {
            await updateBookingStatus(bookingId, status);
            toast.success(`Booking ${status.toLowerCase()}ed`);
        } catch (err) {
            toast.error("Process failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompleteSubmit = async (e) => {
        e.preventDefault();
        if (!completionForm.securityPin) return toast.error("Happy Pin is required");
        if (completionForm.partImages.length === 0) return toast.error("At least one photo of the work is required");

        setActionLoading(currentBooking._id);
        try {
            const success = await updateBookingStatus(currentBooking._id, 'COMPLETED', completionForm);

            if (success) {
                toast.success("Job completed successfully!");
                setShowCompletionModal(false);
                setCompletionForm({
                    securityPin: '',
                    finalAmount: '',
                    extraReason: '',
                    technicianNote: '',
                    partImages: [],
                    previews: []
                });
                setSelectedReason('');
            }
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-100 gap-4">
            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Syncing your schedule...</p>
        </div>
    );

    const counts = {
        requests: jobs.filter(j => ['PENDING', 'ASSIGNED'].includes(j.status)).length,
        active: jobs.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length,
        history: jobs.filter(j => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(j.status)).length
    };

    const filteredJobs = jobs.filter(booking => {
        if (activeTab === 'requests') return ['PENDING', 'ASSIGNED'].includes(booking.status);
        if (activeTab === 'active') return ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
        if (activeTab === 'history') return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status);
        return false;
    });

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
            ASSIGNED: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
            ACCEPTED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
            IN_PROGRESS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
            COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
            CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
            REJECTED: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
                {status}
            </span>
        );
    };

    const tabs = [
        { id: 'requests', label: 'New Requests', count: counts.requests, icon: Bell },
        { id: 'active', label: 'In Progress', count: counts.active, icon: Play },
        { id: 'history', label: 'Completed', count: counts.history, icon: CheckCircle }
    ];

    return (
        <div className="space-y-6 md:space-y-10">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
                        Expert Workspace
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mt-1">
                        High-performance dashboard to manage your service availability and active operations.
                    </p>
                </div>

                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start xl:self-auto overflow-x-auto no-scrollbar max-w-full">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-wider whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                : 'text-slate-400 hover:text-indigo-600'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Section */}
            <div className="grid grid-cols-1 gap-6 md:gap-8 pb-12">
                <AnimatePresence mode="popLayout text-left">
                    {filteredJobs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-6xl py-24 px-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800"
                        >
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-4xl flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase">
                                {activeTab === 'requests' ? 'Awaiting Requests' : activeTab === 'active' ? 'Workspace Clear' : 'No History Yet'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                                {activeTab === 'requests'
                                    ? "We'll notify you the moment a new service request matches your expertise."
                                    : activeTab === 'active'
                                        ? "You don't have any jobs currently in progress. Great time to review your tools!"
                                        : "Your completed earnings and past performance data will appear here once you finish a job."}
                            </p>
                        </motion.div>
                    ) : (
                        filteredJobs.map(booking => (
                            <motion.div
                                key={booking._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all overflow-hidden relative active:scale-[0.99]"
                            >
                                <div className="flex flex-col lg:flex-row justify-between gap-8 md:gap-12 relative z-10">
                                    {/* Left: Metadata */}
                                    <div className="flex-1 space-y-8">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 shadow-inner">
                                                <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-1.5">
                                                    {booking.category?.name || 'Service Request'}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800 pr-3">#{booking._id.slice(-8)}</span>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <User className="w-3 h-3" /> Customer Info
                                                </p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{booking.customer?.name}</p>
                                                <p className="text-xs text-slate-400 font-bold tracking-tighter uppercase">{booking.customer?.phone}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> Scheduled Date
                                                </p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                                    {format(new Date(booking.scheduledAt), 'MMM do')}
                                                </p>
                                                <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">Awaiting Attendance</p>
                                            </div>

                                            <div className="space-y-1 md:col-span-2 lg:col-span-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3" /> Precise Location
                                                </p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-60">
                                                    {booking.location?.address || 'Standard Location'}
                                                </p>
                                                <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Get Directions</button>
                                            </div>
                                        </div>

                                        {booking.notes && (
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed italic">
                                                    Note: "{booking.notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Revenue & Actions */}
                                    <div className="flex flex-col justify-between items-start lg:items-end gap-8 min-w-50">
                                        <div className="text-left lg:text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Revenue</p>
                                            <p className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">₹{booking.finalAmount || booking.price}</p>
                                        </div>

                                        <div className="w-full space-y-3">
                                            {['PENDING', 'ASSIGNED'].includes(booking.status) && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleAction(booking._id, 'REJECTED')}
                                                        className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(booking._id, 'ACCEPTED')}
                                                        className="flex-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                                    >
                                                        Accept Fast
                                                    </button>
                                                </div>
                                            )}

                                            {booking.status === 'ACCEPTED' && (
                                                <button
                                                    onClick={() => handleAction(booking._id, 'IN_PROGRESS')}
                                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                                >
                                                    <Play className="w-5 h-5 fill-current" /> Start Operations
                                                </button>
                                            )}

                                            {booking.status === 'IN_PROGRESS' && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleAction(booking._id, 'COMPLETED')}
                                                        className="flex-2 w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                                    >
                                                        <CheckSquare className="w-5 h-5" /> Mark Completed
                                                    </button>
                                                </div>
                                            )}

                                            {booking.status === 'COMPLETED' && booking.review && (
                                                <div className="bg-amber-50 dark:bg-amber-500/5 p-5 rounded-3xl border border-amber-100 dark:border-amber-500/10">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Happy Customer Feedback</span>
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-3 h-3 ${i < booking.review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold italic">"{booking.review.review}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Modal - Modernized */}
            <AnimatePresence>
                {showCompletionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md px-4 py-8"
                    >
                        <div className="flex min-h-full items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-8 md:p-12 shadow-2xl border border-indigo-50 dark:border-slate-800"
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-1">Finish Order</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {currentBooking?._id}</p>
                                    </div>
                                    <button onClick={() => setShowCompletionModal(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleCompleteSubmit} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center px-1">
                                            Final Billed Amount <span>(Current: ₹{currentBooking?.price})</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₹</span>
                                            <input
                                                type="number"
                                                required
                                                value={completionForm.finalAmount}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCompletionForm(prev => {
                                                        const newState = { ...prev, finalAmount: val };
                                                        // Reset reason if price is not increased
                                                        if (Number(val) <= Number(currentBooking?.price || 0)) {
                                                            newState.extraReason = '';
                                                            setSelectedReason('');
                                                        }
                                                        return newState;
                                                    });
                                                }}
                                                className="w-full pl-12 pr-6 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 text-3xl font-black text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {Number(completionForm.finalAmount) > Number(currentBooking?.price) && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3">
                                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">Reason for Adjustment</label>
                                            <select
                                                required
                                                value={selectedReason}
                                                onChange={(e) => {
                                                    setSelectedReason(e.target.value);
                                                    if (e.target.value !== 'Custom') setCompletionForm(prev => ({ ...prev, extraReason: e.target.value }));
                                                }}
                                                className="w-full p-5 bg-white dark:bg-slate-950 rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 text-slate-900 dark:text-white font-bold outline-none appearance-none"
                                            >
                                                <option value="">Select Reason...</option>
                                                <option value="Added Spare Parts">Added Spare Parts</option>
                                                <option value="Extended Service Scope">Extended Scope</option>
                                                <option value="Heavy Duty Requirement">Complex Environment</option>
                                                <option value="Custom">Other (Specify Below)</option>
                                            </select>
                                            {selectedReason === 'Custom' && (
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Detail the reason..."
                                                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-0 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                    value={completionForm.extraReason}
                                                    onChange={(e) => setCompletionForm(prev => ({ ...prev, extraReason: e.target.value }))}
                                                />
                                            )}
                                        </motion.div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] px-1 text-center block">
                                            Happy Pin (Verify with Customer)
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={completionForm.securityPin}
                                                onChange={(e) => setCompletionForm(prev => ({ ...prev, securityPin: e.target.value }))}
                                                className="w-full p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/40 text-center text-5xl font-black tracking-[0.5em] text-indigo-600 dark:text-indigo-500 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/10 outline-none transition-all placeholder:opacity-20"
                                                placeholder="000000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div
                                            className="relative border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 hover:border-indigo-400 transition-all group overflow-hidden"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const files = Array.from(e.dataTransfer.files);
                                                if (files.length > 0) {
                                                    const newPreviews = files.map(f => URL.createObjectURL(f));
                                                    setCompletionForm(prev => ({
                                                        ...prev,
                                                        partImages: [...prev.partImages, ...files],
                                                        previews: [...prev.previews, ...newPreviews]
                                                    }));
                                                }
                                            }}
                                        >
                                            <input
                                                type="file" multiple accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files);
                                                    if (files.length > 0) {
                                                        const newPreviews = files.map(f => URL.createObjectURL(f));
                                                        setCompletionForm(prev => ({
                                                            ...prev,
                                                            partImages: [...prev.partImages, ...files],
                                                            previews: [...prev.previews, ...newPreviews]
                                                        }));
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">Upload Work Photos</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Tap or drop images here</p>
                                                </div>
                                            </div>
                                        </div>

                                        {completionForm.previews.length > 0 && (
                                            <div className="grid grid-cols-4 gap-4">
                                                {completionForm.previews.map((src, i) => (
                                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden relative border-2 border-white dark:border-slate-800 shadow-sm transition-all hover:scale-105">
                                                        <img src={src} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setCompletionForm(prev => {
                                                                const ni = [...prev.partImages]; ni.splice(i, 1);
                                                                const np = [...prev.previews]; np.splice(i, 1);
                                                                return { ...prev, partImages: ni, previews: np };
                                                            })}
                                                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-rose-500 shadow-sm"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader className="w-6 h-6 animate-spin" /> : 'Finalize Service Execution'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TechnicianBookings;
