import React, { useState, useEffect } from 'react';
import { useTechnician } from '../../context/TechnicianContext';
import { useUser } from '../../context/UserContext';
import { Switch } from '@headlessui/react';
import {
    LayoutDashboard, ClipboardList, Wallet, User,
    Bell, Clock, X, TrendingUp, Star, Loader, Check
} from 'lucide-react';
import TechnicianServices from './TechnicianServices';
import TechnicianBookings from './TechnicianBookings';
import { toast } from 'react-hot-toast';

const TechnicianDashboard = () => {
    const {
        technicianProfile, updateStatus, loading, stats,
        updateProfileData, jobs, reviews,
        fetchTechnicianBookings, fetchTechnicianStats
    } = useTechnician();
    const { user, logout } = useUser();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchTechnicianBookings();
        }
    }, [activeTab]);

    // Profile Editing State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        bio: '',
        skills: '',
        profilePhoto: null,
        preview: null
    });

    if (loading && !technicianProfile) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

    const toggleStatus = async (checked) => {
        setIsStatusUpdating(true);
        try {
            await updateStatus(checked);
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const NAV_ITEMS = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'services', label: 'My Services', icon: ClipboardList },
        { id: 'jobs', label: 'Bookings', icon: ClipboardList }, // Reuse icon or change
        { id: 'earnings', label: 'Earnings', icon: Wallet },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed inset-y-0 z-20 transition-all ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                        T
                    </div>
                    <span className="font-extrabold text-xl text-slate-900 dark:text-white">Technician</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === item.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-2">Status</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${technicianProfile?.isOnline ? 'text-green-600' : 'text-slate-500'}`}>
                                {isStatusUpdating ? 'Updating...' : (technicianProfile?.isOnline ? 'Online' : 'Offline')}
                            </span>
                            <Switch
                                checked={technicianProfile?.isOnline || false}
                                onChange={toggleStatus}
                                disabled={isStatusUpdating}
                                className={`${technicianProfile?.isOnline ? 'bg-green-500' : 'bg-slate-300'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <span
                                    className={`${technicianProfile?.isOnline ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </Switch>
                        </div>
                    </div>
                    <button onClick={async () => {
                        await logout();
                        window.location.href = '/';
                    }} className="w-full text-left px-4 py-2 text-red-500 text-sm font-bold hover:bg-red-50 rounded-lg transition-colors">
                        Sign Out
                    </button>
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

                <div className="p-2 md:p-8 space-y-4 md:space-y-8 pb-24 md:pb-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            {/* Responsive Grid for Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                                <div className="bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase mb-1">Total Earnings</p>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">₹{stats?.totalEarnings || 0}</h3>
                                    <span className="text-xs font-bold text-green-500 flex items-center mt-2">
                                        <TrendingUp className="w-3 h-3 mr-1" /> Lifetime
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase mb-1">Completed Jobs</p>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats?.completedJobs || 0}</h3>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase mb-1">Rating</p>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1">
                                        {technicianProfile?.avgRating || 'New'} <span className="text-yellow-400 text-lg">★</span>
                                    </h3>
                                </div>
                                <div className="bg-blue-600 p-3 md:p-6 rounded-2xl md:rounded-3xl md:flex flex-col justify-between hidden text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-blue-200 text-xs font-bold uppercase mb-1">Status</p>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black">{isStatusUpdating ? 'Updating status...' : (technicianProfile?.isOnline ? 'Accepting Jobs' : 'Offline')}</h3>
                                            <Switch
                                                checked={technicianProfile?.isOnline || false}
                                                onChange={toggleStatus}
                                                disabled={isStatusUpdating}
                                                className={`${technicianProfile?.isOnline ? 'bg-green-400' : 'bg-white/20'
                                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <span
                                                    className={`${technicianProfile?.isOnline ? 'translate-x-6' : 'translate-x-1'
                                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                />
                                            </Switch>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Today's Agenda & Pending Requests */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Pending Requests */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">New Requests</h3>
                                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase rounded-lg">
                                            {jobs?.filter(j => j.status === 'PENDING').length || 0} Pending
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {jobs?.filter(j => j.status === 'PENDING').slice(0, 3).map(job => (
                                            <div key={job._id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                                                    {job.customer?.name?.[0] || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">{job.service?.title}</p>
                                                    <p className="text-xs text-slate-500 font-medium">By {job.customer?.name}</p>
                                                </div>
                                                <button
                                                    onClick={() => setActiveTab('jobs')}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-blue-500/20"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ))}
                                        {(!jobs || jobs.filter(j => j.status === 'PENDING').length === 0) && (
                                            <div className="py-8 text-center text-slate-500 italic text-sm">No new requests</div>
                                        )}
                                    </div>
                                </div>

                                {/* Today's Agenda */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Today's Agenda</h3>
                                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg">
                                            {jobs?.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length || 0} Total
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {jobs?.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).slice(0, 3).map(job => (
                                            <div key={job._id} className="flex items-center gap-4 p-3 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-900 dark:text-white">{job.service?.title}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${job.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {job.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!jobs || jobs.filter(j => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length === 0) && (
                                            <div className="py-8 text-center text-slate-500 italic text-sm">No jobs scheduled for today</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Reviews Row */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Recent Reviews</h3>
                                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-lg">
                                        {reviews?.length || 0} Total
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reviews?.slice(0, 3).map(review => (
                                        <div key={review._id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center overflow-hidden">
                                                        {review.customer?.profilePhoto ? (
                                                            <img src={review.customer.profilePhoto} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-24">{review.customer?.name || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                    <span className="text-[11px] font-black text-slate-700 dark:text-white">{review.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-3">
                                                "{review.review}"
                                            </p>
                                        </div>
                                    ))}
                                    {(!reviews || reviews.length === 0) && (
                                        <div className="col-span-full py-8 text-center text-slate-500 italic text-sm">No reviews yet. Complete your first job to get feedback!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'services' && (
                        <TechnicianServices />
                    )}

                    {activeTab === 'jobs' && (
                        <TechnicianBookings />
                    )}

                    {activeTab === 'earnings' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 min-h-25 flex flex-col items-center justify-center text-center">
                            <Wallet className="w-16 h-16 text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">Earnings Details</h3>
                            <h1 className="text-4xl font-black text-slate-900 mt-2">₹{stats?.totalEarnings || 0}</h1>
                            <p className="text-slate-500 mt-2">Total earnings from completed jobs.</p>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-8 border border-slate-100 dark:border-slate-800 transition-all duration-300">
                            {isEditingProfile ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Edit Profile</h2>
                                        <button onClick={() => setIsEditingProfile(false)} className="text-slate-500 hover:text-slate-700 font-bold text-sm">Cancel</button>
                                    </div>

                                    {/* Photo Upload */}
                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg relative cursor-pointer group">
                                            <img
                                                src={
                                                    editForm.preview ||
                                                    (user?.profilePhoto?.startsWith('http')
                                                        ? user.profilePhoto
                                                        : `/uploads/users/${user?.profilePhoto || 'default.jpg'}`)
                                                }
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'Technician') + '&background=random';
                                                }}
                                            />
                                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <span className="text-[10px] font-bold">Change</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setEditForm(prev => ({ ...prev, profilePhoto: file, preview: URL.createObjectURL(file) }));
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Profile Photo</h3>
                                            <p className="text-[10px] md:text-xs text-slate-500">Click image to upload new photo</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            rows="4"
                                            placeholder="Tell customers about your experience..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Skills (comma separated)</label>
                                        <input
                                            type="text"
                                            value={editForm.skills}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Plumbing, Wiring, Repair..."
                                        />
                                    </div>

                                    <button
                                        disabled={isSubmittingProfile}
                                        onClick={async () => {
                                            setIsSubmittingProfile(true);
                                            try {
                                                const skillsArray = editForm.skills.split(',').map(s => s.trim()).filter(Boolean);
                                                await updateProfileData({
                                                    bio: editForm.bio,
                                                    skills: skillsArray,
                                                    profilePhoto: editForm.profilePhoto
                                                });
                                                toast.success('Profile updated successfully');
                                                setIsEditingProfile(false);
                                            } catch (err) {
                                                toast.error('Failed to update profile');
                                            } finally {
                                                setIsSubmittingProfile(false);
                                            }
                                        }}
                                        className="w-full py-3 md:py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmittingProfile ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg">
                                                <img
                                                    src={
                                                        user?.profilePhoto?.startsWith('http')
                                                            ? user.profilePhoto
                                                            : `/uploads/users/${user?.profilePhoto || 'default.jpg'}`
                                                    }
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'Technician') + '&background=random';
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{user?.name}</h2>
                                                <p className="text-xs md:text-sm text-slate-500 font-medium">{user?.email}</p>
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[10px] md:text-xs font-bold rounded-full mt-2 tracking-tight">Technician</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditForm({
                                                    bio: technicianProfile?.bio || '',
                                                    skills: technicianProfile?.skills?.join(', ') || '',
                                                    profilePhoto: null,
                                                    preview: null
                                                });
                                                setIsEditingProfile(true);
                                            }}
                                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs md:text-sm"
                                        >
                                            Edit Profile
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About</h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {technicianProfile?.bio || "No bio added yet. Click edit to add details about your experience."}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {technicianProfile?.skills && technicianProfile.skills.length > 0 ? (
                                                technicianProfile.skills.map((skill, index) => (
                                                    <span key={`${skill}-${index}`} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold">
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic">No skills listed</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <button onClick={logout} className="w-full md:w-auto px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between md:hidden z-30 pb-safe">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-400'
                                }`}
                        >
                            <item.icon className="w-6 h-6" strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </main>
        </div>
    );
};

const TrendingUpIcon = () => (
    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export default TechnicianDashboard;
