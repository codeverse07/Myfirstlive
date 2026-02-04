import React, { useState } from 'react';
import { useTechnician } from '../../context/TechnicianContext';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Play, CheckSquare, Loader, Star, Bell } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/common/Button';

const TechnicianBookings = () => {
    const { jobs, loading, updateBookingStatus } = useTechnician();
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('requests');

    const handleAction = async (bookingId, status) => {
        setActionLoading(bookingId);
        await updateBookingStatus(bookingId, status);
        setActionLoading(null);
    };

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-blue-600" /></div>;

    // Filter jobs based on active tab
    const filteredJobs = jobs.filter(booking => {
        if (activeTab === 'requests') return booking.status === 'PENDING';
        if (activeTab === 'active') return ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
        if (activeTab === 'history') return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status);
        return false;
    });

    const counts = {
        requests: jobs.filter(j => j.status === 'PENDING').length,
        active: jobs.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length,
        history: jobs.filter(j => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(j.status)).length
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
            IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            COMPLETED: 'bg-green-100 text-green-700 border-green-200',
            CANCELLED: 'bg-red-100 text-red-700 border-red-200',
            REJECTED: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const tabs = [
        { id: 'requests', label: 'New Requests', count: counts.requests, icon: Bell, color: 'blue' },
        { id: 'active', label: 'Ongoing Jobs', count: counts.active, icon: Play, color: 'indigo' },
        { id: 'history', label: 'Past History', count: counts.history, icon: CheckCircle, color: 'slate' }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-slate-900 md:p-8 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Bookings Manager</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Monitor and manage your service requests and active jobs.</p>
                </div>

                {/* Modern & High-Visibility Tab Navigation */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-black tracking-wide whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-full text-[10px] font-black ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {filteredJobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] py-24 px-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <Calendar className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                        {activeTab === 'requests' ? 'All caught up!' : activeTab === 'active' ? 'No active work' : 'History is empty'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-base font-medium leading-relaxed">
                        {activeTab === 'requests'
                            ? "There are no new service requests at the moment. We'll alert you when a customer needs your help."
                            : activeTab === 'active'
                                ? "You don't have any jobs currently in progress or accepted. Check 'New Requests' to find work."
                                : "Your past completed, cancelled, or rejected bookings will appear here for your records."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 pb-16">
                    {filteredJobs.map(booking => (
                        <div key={booking._id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800/80 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/40 transition-all group overflow-hidden relative">
                            {/* Color-Coded Status Strip */}
                            <div className={`absolute top-0 left-0 w-2 h-full ${booking.status === 'PENDING' ? 'bg-amber-400 animate-pulse' :
                                booking.status === 'ACCEPTED' ? 'bg-blue-500' :
                                    booking.status === 'IN_PROGRESS' ? 'bg-indigo-600' :
                                        booking.status === 'COMPLETED' ? 'bg-green-500' : 'bg-slate-300'
                                }`} />

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                {/* Left Section: Core Job Info */}
                                <div className="flex-1 space-y-8">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{booking.service?.title}</h3>
                                        <div className="transform scale-110 origin-left">
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Customer Name</span>
                                                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                                                    {booking.customer?.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Scheduled Date</span>
                                                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                                                    {format(new Date(booking.scheduledAt), 'EEEE, MMM do')}
                                                </div>
                                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3" /> {format(new Date(booking.scheduledAt), 'p')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 md:col-span-2 lg:col-span-1">
                                            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Service Location</span>
                                                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-base truncate">
                                                    {booking.status === 'PENDING'
                                                        ? 'Address sent upon acceptance'
                                                        : (booking.userLocation?.address || booking.customer?.location?.address || 'Location Hidden')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.notes && (
                                        <div className="relative pl-6 py-1">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                            <p className="text-sm italic text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                "{booking.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions & Price */}
                                <div className="flex flex-col md:items-end justify-between md:min-w-[200px] py-1">
                                    <div className="text-right mb-6 md:mb-0">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Payout</span>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">₹{booking.price}</div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="w-full space-y-3">
                                        {booking.status === 'PENDING' && (
                                            <div className="flex gap-3">
                                                <Button
                                                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 border-0 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                                    onClick={() => handleAction(booking._id, 'REJECTED')}
                                                    disabled={actionLoading === booking._id}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                                    onClick={() => handleAction(booking._id, 'ACCEPTED')}
                                                    disabled={actionLoading === booking._id}
                                                >
                                                    {actionLoading === booking._id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Accept Job'}
                                                </Button>
                                            </div>
                                        )}

                                        {booking.status === 'ACCEPTED' && (
                                            <Button
                                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-[1.25rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                                onClick={() => handleAction(booking._id, 'IN_PROGRESS')}
                                                disabled={actionLoading === booking._id}
                                            >
                                                {actionLoading === booking._id ? <Loader className="w-4 h-4 animate-spin" /> : <><Play className="w-5 h-5" /> Start Service</>}
                                            </Button>
                                        )}

                                        {booking.status === 'IN_PROGRESS' && (
                                            <Button
                                                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 rounded-[1.25rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                                onClick={() => handleAction(booking._id, 'COMPLETED')}
                                                disabled={actionLoading === booking._id}
                                            >
                                                {actionLoading === booking._id ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckSquare className="w-5 h-5" /> Mark Completed</>}
                                            </Button>
                                        )}

                                        {booking.status === 'COMPLETED' && booking.review && (
                                            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-[1.5rem] border border-amber-100 dark:border-amber-900/30">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-wider">Review Recieved</span>
                                                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full shadow-sm">
                                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">{booking.review.rating}</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed">
                                                    "{booking.review.review}"
                                                </p>
                                            </div>
                                        )}

                                        {['CANCELLED', 'REJECTED'].includes(booking.status) && (
                                            <div className="text-center py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                Booking {booking.status.toLowerCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TechnicianBookings;
