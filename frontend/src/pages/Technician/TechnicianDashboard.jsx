import React, { useState, useEffect } from 'react';
import { useTechnician } from '../../context/TechnicianContext';
import { useUser } from '../../context/UserContext';
import { Switch } from '@headlessui/react';
import {
    LayoutDashboard, ClipboardList, Wallet, User,
    Bell, Clock, X, TrendingUp, Star, Loader, Check, Sun, Moon, ShieldCheck, ExternalLink, LogOut
} from 'lucide-react';
import TechnicianBookings from './TechnicianBookings';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const TechnicianDashboard = () => {
    const {
        technicianProfile, updateStatus, loading, stats,
        updateProfileData, jobs, reviews,
        fetchTechnicianBookings, fetchTechnicianStats, requestPasswordReset
    } = useTechnician();
    const { user, logout, isLoading: authLoading } = useUser();
    const { theme, toggleTheme } = useTheme();

    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        bio: '',
        skills: '',
        profilePhoto: null,
        preview: null
    });

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchTechnicianBookings();
        }
    }, [activeTab]);

    // Combined loading check
    // Wait for BOTH auth and profile to settle
    const isPageLoading = authLoading || loading;

    if (isPageLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

    // Enforce Verification Logic
    // 1. If no profile -> Redirect to Onboarding to create one
    // Only redirect if explicitly NOT loading and profile is null
    if (!loading && !technicianProfile) {
        window.location.href = '/technician/onboarding';
        return null;
    }

    // 2. If profile exists but NOT VERIFIED -> Show Pending Screen
    if (technicianProfile.documents?.verificationStatus !== 'VERIFIED') {
        const isRejected = technicianProfile.documents?.verificationStatus === 'REJECTED';

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4">
                    {isRejected ? 'Application Rejected' : 'Verification Pending'}
                </h1>

                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-lg leading-relaxed mb-8">
                    {isRejected ? (
                        "Your application has been reviewed but unfortunately could not be approved at this time. Please contact support."
                    ) : (
                        "You are not verified yet. Please wait until an admin reviews your profile."
                    )}
                </p>

                {!isRejected && (
                    <p className="text-slate-500 font-medium italic">
                        See you soon!
                    </p>
                )}

                <button
                    onClick={logout}
                    className="mt-8 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    const toggleStatus = async (checked) => {
        // NEW RULE: Prevent going offline if there are active IN_PROGRESS jobs
        if (checked === false) {
            const hasActiveJobs = jobs?.some(job => job.status === 'IN_PROGRESS');
            if (hasActiveJobs) {
                toast.error("Finish your active jobs before going offline!");
                return;
            }
        }

        setIsStatusUpdating(true);
        try {
            await updateStatus(checked);
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const NAV_ITEMS = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs', label: 'Bookings', icon: ClipboardList },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'earnings', label: 'Earnings', icon: Wallet },
        { id: 'profile', label: 'Profile', icon: User },
    ];


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex font-sans selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
            {/* Desktop Sidebar - Premium Glassmorphism */}
            <aside className={`hidden md:flex flex-col w-72 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 fixed inset-y-0 z-20 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="block font-black text-xl text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Reservice</span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Expert Portal</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar pt-2">
                    <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Main Navigation</p>
                    {NAV_ITEMS.map(item => {
                        const IsActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 relative group ${IsActive
                                    ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 ${IsActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                {item.label}
                                {IsActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto space-y-4">
                    <div className="bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl p-5 border border-indigo-100/50 dark:border-indigo-500/10 transition-all hover:border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Expert Presence</p>
                                <span className={`text-xs font-black uppercase tracking-tight ${technicianProfile?.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {isStatusUpdating ? 'Syncing...' : (technicianProfile?.isOnline ? 'Ready for Jobs' : 'Off Duty')}
                                </span>
                            </div>
                            <Switch
                                checked={technicianProfile?.isOnline || false}
                                onChange={toggleStatus}
                                disabled={isStatusUpdating}
                                className={`${technicianProfile?.isOnline ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700'
                                    } relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none shadow-lg disabled:opacity-50`}
                            >
                                <span
                                    className={`${technicianProfile?.isOnline ? 'translate-x-6' : 'translate-x-1.5'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-500 shadow-md`}
                                />
                            </Switch>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                            {theme === 'dark' ? 'Daylight Mode' : 'Eclipse Mode'}
                        </button>
                        <button
                            onClick={async () => {
                                await logout();
                                window.location.href = '/';
                            }}
                            className="flex items-center gap-3 px-4 py-3 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all group"
                        >
                            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 md:p-4 sticky top-0 z-10 flex items-center justify-between md:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
                        <h1 className="font-bold text-lg text-slate-900 dark:text-white">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-6 h-6 text-slate-600 dark:text-slate-400" /> : <Moon className="w-6 h-6 text-slate-600 dark:text-slate-400" />}
                        </button>
                        <button
                            onClick={() => {
                                fetchTechnicianBookings();
                                fetchTechnicianStats();
                                toast.success("Refreshed");
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <Clock className="w-5 h-5 text-slate-600" />
                        </button>
                        <button className="relative p-2">
                            <Bell className="w-6 h-6 text-slate-600" />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                <div className="p-4 md:p-10 space-y-10 md:space-y-12 pb-32 md:pb-12 max-w-7xl mx-auto w-full">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-12"
                        >
                            {/* Premium Grid for Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {[
                                    { label: 'Total Revenue', value: stats?.totalEarnings, prefix: '₹', icon: Wallet, color: 'indigo', trend: 'Lifetime' },
                                    { label: 'Success Jobs', value: stats?.completedJobs, icon: Check, color: 'emerald' },
                                    { label: 'Rating', value: technicianProfile?.avgRating && technicianProfile.avgRating > 0 ? technicianProfile.avgRating : 'New', icon: Star, color: 'amber', suffix: technicianProfile?.avgRating > 0 ? ' ★' : '' },
                                    { label: 'Work Status', value: technicianProfile?.isOnline ? 'Active' : 'Offline', icon: technicianProfile?.isOnline ? Sun : Moon, color: technicianProfile?.isOnline ? 'emerald' : 'slate' }
                                ].map((s, idx) => (
                                    <motion.div
                                        key={s.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`relative overflow-hidden group p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:shadow-indigo-500/10 transition-all duration-500`}
                                    >
                                        <div className={`absolute -top-4 -right-4 w-24 h-24 bg-${s.color}-500/5 rounded-full blur-2xl group-hover:bg-${s.color}-500/10 transition-colors capitalize`} />
                                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className={`p-3 rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-500/10 text-${s.color}-600 dark:text-${s.color}-400`}>
                                                    <s.icon className="w-5 h-5" />
                                                </div>
                                                {s.trend && (
                                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-widest">{s.trend}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                                    {s.prefix}{s.value}{s.suffix}
                                                </h3>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Today's Agenda & Pending Requests */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
                                {/* Pending Requests - Ultra Premium */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-linear-to-r from-amber-500 to-orange-600 rounded-[3rem] blur opacity-5 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 h-full">
                                        <div className="flex items-center justify-between mb-10">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">New Arrivals</h3>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Incoming opportunities</p>
                                            </div>
                                            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-2xl border border-amber-100 dark:border-amber-500/20">
                                                {jobs?.filter(j => ['PENDING', 'ASSIGNED'].includes(j.status)).length || 0} Open
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            {jobs?.filter(j => ['PENDING', 'ASSIGNED'].includes(j.status)).slice(0, 3).map(job => (
                                                <div key={job._id} className="group/item flex items-center gap-6 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-3xl transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
                                                            {job.customer?.name?.[0] || 'U'}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-slate-900 dark:text-white truncate text-base">{job.service?.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight italic">Customer: {job.customer?.name}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('jobs')}
                                                        className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300 shadow-xl shadow-slate-900/10 dark:shadow-white/10"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!jobs || jobs.filter(j => ['PENDING', 'ASSIGNED'].includes(j.status)).length === 0) && (
                                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                                    <Bell className="w-12 h-12 mb-4 text-slate-300" />
                                                    <p className="font-black text-sm uppercase tracking-widest text-slate-400">Quiet Zone</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Updates will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Today's Agenda - Ultra Premium */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-violet-600 rounded-[3rem] blur opacity-5 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800 h-full">
                                        <div className="flex items-center justify-between mb-10">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Strategic Agenda</h3>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Confirmed engagements</p>
                                            </div>
                                            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                                {jobs?.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length || 0} Active
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            {jobs?.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).slice(0, 3).map(job => (
                                                <div key={job._id} className="group/item flex items-center gap-6 p-4 border border-slate-100 dark:border-slate-800/50 rounded-3xl hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all duration-300">
                                                    <div className="flex-1">
                                                        <p className="font-black text-slate-900 dark:text-white text-base">{job.service?.title}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-[10px] font-black text-indigo-500 flex items-center gap-1.5 uppercase tracking-widest">
                                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                                                Scheduled: {new Date(job.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${job.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                                {job.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setActiveTab('jobs')} className="hidden group-hover/item:flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                        Manage
                                                    </button>
                                                </div>
                                            ))}
                                            {(!jobs || jobs.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length === 0) && (
                                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                                                        <Clock className="w-6 h-6" />
                                                    </div>
                                                    <p className="font-black text-sm uppercase tracking-widest text-slate-400">Zero Schedule</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Ready for new missions</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Reviews Row - Premium Overhaul */}
                            <div className="relative group mt-8">
                                <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-violet-600 rounded-[3.5rem] blur opacity-[0.02] group-hover:opacity-10 transition duration-1000"></div>
                                <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-500">
                                    <div className="flex items-center justify-between mb-12">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Client Testimony</h3>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Evidence of excellence</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-3xl font-black text-slate-900 dark:text-white">{technicianProfile?.avgRating && technicianProfile.avgRating > 0 ? technicianProfile.avgRating + ' ★' : 'New'}</span>
                                            <button
                                                onClick={() => setActiveTab('reviews')}
                                                className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-colors mt-1"
                                            >
                                                {reviews?.length || 0} verified reviews →
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                                        {reviews?.slice(0, 3).map((review, idx) => (
                                            <motion.div
                                                key={review._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + (idx * 0.1) }}
                                                className="p-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative transition-all duration-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none"
                                            >
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                                                        {review.customer?.profilePhoto ? (
                                                            <img src={review.customer.profilePhoto} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950 text-indigo-500 font-black text-lg">
                                                                {review.customer?.name?.[0] || 'A'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{review.customer?.name || 'Anonymous Client'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                        <span className="text-[11px] font-black text-slate-700 dark:text-white">{review.rating}</span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute -top-4 -left-2 text-4xl text-indigo-500/20 italic font-black text-serif opacity-30">“</span>
                                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 italic leading-relaxed line-clamp-4 pl-4 border-l-2 border-indigo-500/10">
                                                        {review.review}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {(!reviews || reviews.length === 0) && (
                                            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
                                                <Star className="w-12 h-12 mb-4 text-slate-200 dark:text-slate-800" />
                                                <p className="font-black text-sm uppercase tracking-widest text-slate-400">Reputation Pending</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Complete your first mission to ignite your profile</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}



                    {activeTab === 'reviews' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Identity Reputation</h2>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Full historical testimony record</p>
                                </div>
                                <div className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{technicianProfile?.avgRating && technicianProfile.avgRating > 0 ? technicianProfile.avgRating + ' ★' : 'New'}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{reviews?.length || 0} Total Reviews</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reviews?.map((review) => (
                                    <motion.div
                                        key={review._id}
                                        layout
                                        className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-900/10">
                                                {review.customer?.profilePhoto ? (
                                                    <img src={review.customer.profilePhoto} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-lg">
                                                        {review.customer?.name?.[0] || 'C'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-900 dark:text-white truncate uppercase tracking-tight text-sm">{review.customer?.name || 'Client'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                <span className="text-xs font-black text-amber-700 dark:text-amber-400">{review.rating}</span>
                                            </div>
                                        </div>
                                        <div className="relative pt-2">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/10 pl-4">
                                                "{review.review}"
                                            </p>
                                        </div>
                                        {review.booking?.status === 'COMPLETED' && (
                                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Job Completed: {new Date(review.booking.scheduledAt).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {(!reviews || reviews.length === 0) && (
                                <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-200 dark:text-slate-700 mb-6">
                                        <Star className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Zero Reputation Data</h3>
                                    <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Finish your active assignments to receive testimony from your clients.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'jobs' && (
                        <TechnicianBookings />
                    )}

                    {activeTab === 'earnings' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 md:p-16 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center justify-center text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                            <div className="w-24 h-24 bg-linear-to-tr from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-500/30">
                                <Wallet className="w-10 h-10" />
                            </div>

                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-4">Financial Overview</p>
                            <h3 className="text-xl md:text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tight">Net Accumulated Earnings</h3>
                            <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter leading-none">
                                <span className="text-indigo-600 dark:text-indigo-400 mr-2 text-4xl md:text-5xl">₹</span>
                                {stats?.totalEarnings || 0}
                            </h1>

                            <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-md">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Payouts</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">₹{stats?.totalEarnings || 0}</p>
                                </div>
                                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100/50 dark:border-emerald-500/10">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">Settled</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/[0.02] rounded-full blur-3xl -mr-48 -mt-48"></div>

                            {isEditingProfile ? (
                                <div className="space-y-10 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Edit Identity</h2>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Personnel Information System</p>
                                        </div>
                                        <button onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                                    </div>

                                    {/* Photo Upload - Premium */}
                                    <div className="flex items-center gap-10 p-8 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-28 h-28 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden border-4 border-white dark:border-slate-700 shadow-2xl relative">
                                                <img
                                                    src={editForm.preview || (user?.profilePhoto?.startsWith('http') ? user.profilePhoto : `/uploads/users/${user?.profilePhoto || 'default.jpg'}`) + `?t=${Date.now()}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'Technician') + '&background=random'; }}
                                                />
                                                <div className="absolute inset-0 bg-indigo-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                    <User className="w-8 h-8 text-white" />
                                                </div>
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) setEditForm(prev => ({ ...prev, profilePhoto: file, preview: URL.createObjectURL(file) }));
                                                }} />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-900">
                                                <ClipboardList className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">Identity Visual</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Update your professional portrait</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-2">Professional Bio</label>
                                            <textarea
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                                className="w-full p-6 pb-20 rounded-[2rem] border-2 border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-indigo-500/50 outline-none transition-all font-bold text-sm resize-none"
                                                placeholder="Articulate your expertise and experience..."
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-2">Operational Capabilities</label>
                                            <input
                                                type="text"
                                                value={editForm.skills}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                                                className="w-full p-6 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-indigo-500/50 outline-none transition-all font-black text-[13px] uppercase tracking-widest"
                                                placeholder="Plumbing, Wiring, System Diagnostics..."
                                            />
                                        </div>
                                    </div>

                                    <button
                                        disabled={isSubmittingProfile}
                                        onClick={async () => {
                                            setIsSubmittingProfile(true);
                                            try {
                                                const skillsArray = editForm.skills.split(',').map(s => s.trim()).filter(Boolean);
                                                await updateProfileData({ bio: editForm.bio, skills: skillsArray, profilePhoto: editForm.profilePhoto });
                                                toast.success('System synchronized');
                                                setIsEditingProfile(false);
                                            } catch (err) { toast.error('Synchronization failed'); } finally { setIsSubmittingProfile(false); }
                                        }}
                                        className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmittingProfile ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                        Commit Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-12 relative z-10">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                        <div className="flex flex-col md:flex-row items-center gap-8">
                                            <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/20 overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative">
                                                <img
                                                    src={user?.profilePhoto?.startsWith('http') ? user.profilePhoto : `/uploads/users/${user?.profilePhoto || 'default.jpg'}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'Technician') + '&background=random'; }}
                                                />
                                            </div>
                                            <div className="text-center md:text-left">
                                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">{user?.name}</h2>
                                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">{user?.email}</p>
                                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                                    <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Verified Expert</span>
                                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg">Active Status</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => {
                                                    setEditForm({ bio: technicianProfile?.bio || '', skills: technicianProfile?.skills?.join(', ') || '', profilePhoto: null, preview: null });
                                                    setIsEditingProfile(true);
                                                }}
                                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-xl"
                                            >
                                                Modify Profile
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("Are you sure you want to request a password reset? Administration will be notified to assist you.")) {
                                                        const result = await requestPasswordReset();
                                                        if (result?.success) {
                                                            // Optional: add some local UI state if needed
                                                        }
                                                    }
                                                }}
                                                className="px-8 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                            >
                                                Request Password Reset
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        <div className="md:col-span-2 space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Personnel Narrative</p>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                                "{technicianProfile?.bio || "Identity narrative not established. Update profile to add expertise details."}"
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Core Capabilities</p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {technicianProfile?.skills && technicianProfile.skills.length > 0 ? (
                                                    technicianProfile.skills.map((skill, index) => (
                                                        <span key={`${skill}-${index}`} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-xl text-[10px] font-black border border-slate-100 dark:border-slate-700 uppercase tracking-widest">
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic font-bold">No data recorded</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Assigned Expertise</p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {technicianProfile?.categories && technicianProfile.categories.length > 0 ? (
                                                    technicianProfile.categories.map((cat, index) => (
                                                        <span key={cat._id || index} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none">
                                                            {cat.name || 'Category'}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic font-[10px] uppercase tracking-widest">No official categories assigned yet</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Legal Agreement Section */}
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Legal Framework</p>
                                            <div className="pt-2">
                                                {technicianProfile?.documents?.agreement ? (
                                                    <a
                                                        href={technicianProfile.documents.agreement}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl group transition-all"
                                                    >
                                                        <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Signed Agreement</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Reservice Partner Document.pdf</p>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 opacity-60">
                                                        <ShieldCheck className="w-5 h-5 text-slate-300" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No agreement uploaded yet</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                                        <button
                                            onClick={async () => {
                                                await logout();
                                                window.location.href = '/';
                                            }}
                                            className="md:hidden flex items-center gap-2 px-4 py-2 text-rose-500 font-black text-[10px] uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/20"
                                        >
                                            <LogOut className="w-3 h-3" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden z-30 shadow-lg">
                    {/* Status Toggle Bar */}
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${technicianProfile?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {isStatusUpdating ? 'Updating...' : (technicianProfile?.isOnline ? 'Online' : 'Offline')}
                                </span>
                            </div>
                            <Switch
                                checked={technicianProfile?.isOnline || false}
                                onChange={toggleStatus}
                                disabled={isStatusUpdating}
                                className={`${technicianProfile?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50`}
                            >
                                <span
                                    className={`${technicianProfile?.isOnline ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="px-4 py-2 flex justify-around">
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex flex-col items-center gap-1 transition-colors py-2 px-3 rounded-xl ${activeTab === item.id
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                                    : 'text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" strokeWidth={activeTab === item.id ? 2.5 : 2} />
                                <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>
            </main >
        </div >
    );
};


export default TechnicianDashboard;
