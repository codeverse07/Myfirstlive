import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Users, Plus, Star, Phone, Mail, X, Check, Loader, Shield, Image as ImageIcon, Search, Filter, Ban, CheckCircle2, MoreVertical, ExternalLink, AlertCircle, ChevronLeft, ChevronRight, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import client from '../../api/client';

const AdminTechnicians = () => {
    const { technicians: allTechnicians, toggleUserStatus, addTechnician, categories, services, deleteTechnician, isLoading, refreshData, updateTechnicianProfile, approveTechnician, resetTechnicianPassword } = useAdmin();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = React.useState('verified'); // 'verified' or 'pending'
    const [page, setPage] = React.useState(1);
    const [selectedCategory, setSelectedCategory] = React.useState('');
    const [isAddingTech, setIsAddingTech] = React.useState(false);
    const [viewingDocsBy, setViewingDocsBy] = React.useState(null);
    const [actionLoading, setActionLoading] = React.useState({});
    const [searchQuery, setSearchQuery] = React.useState('');
    const [newTech, setNewTech] = React.useState({ name: '', email: '', phone: '', bio: '', skills: '', password: '', agreementFile: null });

    // Profile Editing State
    const [isEditingProfile, setIsEditingProfile] = React.useState(false);
    const [editData, setEditData] = React.useState({ bio: '', skills: '', employeeId: '', name: '', phone: '', categories: [], services: [] });

    // Password Reset Modal State
    const [resetModalOpen, setResetModalOpen] = React.useState(false);
    const [resetData, setResetData] = React.useState({ techId: null, techName: '', newPassword: '', confirmPassword: '' });

    const handleSaveProfile = async () => {
        if (!viewingDocsBy) return;
        setActionLoading(prev => ({ ...prev, saveProfile: true }));
        try {
            const formData = new FormData();
            formData.append('bio', editData.bio);
            formData.append('skills', editData.skills);
            formData.append('employeeId', editData.employeeId);
            formData.append('name', editData.name);
            formData.append('phone', editData.phone);
            formData.append('address', editData.address);

            if (editData.categories && editData.categories.length > 0) {
                editData.categories.forEach(catId => {
                    formData.append('categories', catId);
                });
            }

            if (editData.services && editData.services.length > 0) {
                editData.services.forEach(serviceId => {
                    formData.append('services', serviceId);
                });
            }

            if (editData.profilePhotoFile) {
                formData.append('profilePhoto', editData.profilePhotoFile);
            }

            const res = await updateTechnicianProfile(viewingDocsBy._id || viewingDocsBy.id, formData);
            if (res.success) {
                setViewingDocsBy(res.data);
                setIsEditingProfile(false);
                toast.success("Expert profile updated successfully");
            }
        } catch (err) {
            toast.error("Failed to update profile");
        } finally {
            setActionLoading(prev => ({ ...prev, saveProfile: false }));
        }
    };

    // Approval State
    const [approvalCategories, setApprovalCategories] = React.useState([]);
    const [filterOnline, setFilterOnline] = React.useState('all'); // 'all', 'online', 'offline'

    // Derived State: Filtering
    const filteredTechnicians = React.useMemo(() => {
        if (!allTechnicians) return [];
        return allTechnicians.filter(tech => {
            const status = tech.documents?.verificationStatus || 'PENDING';

            // Tab Filter
            if (activeTab === 'verified') {
                if (status !== 'VERIFIED') return false;
            } else if (activeTab === 'pending') {
                if (status !== 'PENDING') return false;
            } else if (activeTab === 'resets') {
                if (!tech.user?.passwordResetRequested) return false;
            }

            // Search Filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const name = tech.user?.name?.toLowerCase() || '';
                const email = tech.user?.email?.toLowerCase() || '';
                const phone = tech.user?.phone || '';
                if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
            }

            // Category Filter (only for verified)
            if (activeTab === 'verified' && selectedCategory && selectedCategory !== 'all') {
                const hasCat = tech.categories?.some(c => (c._id || c.id) === selectedCategory);
                if (!hasCat) return false;
            }

            // Online Status Filter (only for verified)
            if (activeTab === 'verified' && filterOnline !== 'all') {
                const isOnline = !!tech.isOnline;
                if (filterOnline === 'online' && !isOnline) return false;
                if (filterOnline === 'offline' && isOnline) return false;
            }

            return true;
        });
    }, [allTechnicians, activeTab, searchQuery, selectedCategory, filterOnline]);

    // Derived State: Pagination
    const ITEMS_PER_PAGE = 9;
    const totalPages = Math.ceil(filteredTechnicians.length / ITEMS_PER_PAGE) || 1;
    const displayTechnicians = filteredTechnicians.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // Reset page when filters change
    React.useEffect(() => {
        setPage(1);
    }, [activeTab, selectedCategory, filterOnline, searchQuery]);

    const handleAddTech = async (e) => {
        e.preventDefault();
        setActionLoading(prev => ({ ...prev, addTech: true }));
        try {
            await addTechnician(newTech);
            setIsAddingTech(false);
            setNewTech({ name: '', email: '', phone: '', bio: '', skills: '', password: '', agreementFile: null });
            toast.success("Expert profile created");
        } catch (err) {
            toast.error("Failed to create profile");
        } finally {
            setActionLoading(prev => ({ ...prev, addTech: false }));
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        setActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await toggleUserStatus(userId, !currentStatus);
            // No need to update local state, context updates global state
        } catch (err) {
            // Error handled in context
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const toggleApprovalCategory = (catId) => {
        setApprovalCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleApprove = async (techId) => {
        if (approvalCategories.length === 0) {
            toast.error("Please assign at least one category/skill.");
            return;
        }

        setActionLoading(prev => ({ ...prev, [techId]: true }));
        try {
            await client.patch(`/admin/technicians/${techId}/approve`, { categoryIds: approvalCategories });
            toast.success("Expert verified & onboarded");
            setViewingDocsBy(null);
            setApprovalCategories([]);
            await refreshData();
        } catch (err) {
            console.error(err);
            toast.error("Verification failed");
        } finally {
            setActionLoading(prev => ({ ...prev, [techId]: false }));
        }
    };
    const handleOpenResetModal = (tech) => {
        setResetData({
            techId: tech.user?._id || tech.user?.id,
            techName: tech.user?.name,
            newPassword: '',
            confirmPassword: ''
        });
        setResetModalOpen(true);
    };

    const handleSubmitReset = async () => {
        if (!resetData.newPassword || !resetData.confirmPassword) {
            toast.error("Please fill in both password fields");
            return;
        }
        if (resetData.newPassword !== resetData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (resetData.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setActionLoading(prev => ({ ...prev, resetPass: true }));
        try {
            await resetTechnicianPassword(resetData.techId, resetData.newPassword);
            setResetModalOpen(false);
            toast.success("Password reset successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to reset password");
        } finally {
            setActionLoading(prev => ({ ...prev, resetPass: false }));
        }
    };

    const handleReject = async (techId) => {
        if (!window.confirm("Reject this application?")) return;
        setActionLoading(prev => ({ ...prev, [techId]: true }));
        try {
            await client.patch(`/admin/technicians/${techId}/reject`);
            toast.success("Application rejected");
            setViewingDocsBy(null);
            await refreshData();
        } catch (err) {
            toast.error("Action failed");
        } finally {
            setActionLoading(prev => ({ ...prev, [techId]: false }));
        }
    };

    const StatusBadge = ({ tech }) => {
        const isVerified = tech.documents?.verificationStatus === 'VERIFIED';
        const isBlocked = tech.user?.isActive === false;

        if (isBlocked) return <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest">Blocked</span>;
        if (isVerified) return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Verified</span>;
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">Pending</span>;
    };

    const OnlineBadge = ({ isOnline }) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isOnline ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
        </span>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Expert Network</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Verified professionals and partnership management</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search professionals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 w-full md:w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddingTech(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> New Expert
                    </button>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit shadow-sm">
                    {[
                        { id: 'verified', label: 'Verified Partners', icon: CheckCircle2 },
                        { id: 'pending', label: 'Pending Approval', icon: AlertCircle },
                        { id: 'resets', label: 'Reset Requests', icon: Key }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setPage(1); }}
                            className={`relative px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {tab.id === 'resets' && allTechnicians?.filter(t => t.user?.passwordResetRequested).length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white shadow-sm">
                                    {allTechnicians?.filter(t => t.user?.passwordResetRequested).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Category & Online Filter */}
                {activeTab === 'verified' && (
                    <div className="flex items-center gap-3">
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={filterOnline}
                                onChange={(e) => { setFilterOnline(e.target.value); setPage(1); }}
                                className="pl-4 pr-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="online">Online Only</option>
                                <option value="offline">Offline Only</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                                className="pl-10 pr-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                            >
                                <option value="">Filter by Role</option>
                                <option value="all">All Roles</option>
                                {categories.map(cat => (
                                    <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Experts List (Horizontal Cards) */}
            <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : displayTechnicians.map((tech) => (
                        <motion.div
                            layout
                            key={tech._id || tech.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className={`group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 ${!tech.isOnline && activeTab === 'verified' ? 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100' : ''}`}
                        >
                            {/* Avatar & Basic Info */}
                            <div className="flex items-center gap-5 w-full md:w-auto flex-1">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-slate-100 dark:border-slate-800">
                                        <img
                                            src={tech.profilePhoto || tech.user?.profilePhoto || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d'}
                                            className="w-full h-full object-cover"
                                            alt={tech.user?.name}
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1">
                                        <StatusBadge tech={tech} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{tech.user?.name || 'Partner'}</h4>
                                        {activeTab === 'verified' && <OnlineBadge isOnline={tech.isOnline} />}
                                        {tech.user?.passwordResetRequested && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-tighter rounded-md animate-pulse">
                                                Reset Requested
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {tech.user?.phone || 'No Phone'}
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star className="w-3 h-3 fill-current" />
                                            {tech.avgRating || 0} ({tech.totalJobs || 0} Jobs)
                                        </div>
                                    </div>

                                    {/* Skills/Categories */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {(tech.categories && tech.categories.length > 0) ? (
                                            tech.categories.slice(0, 3).map((cat, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                    {cat.name || cat}
                                                </span>
                                            ))
                                        ) : (
                                            tech.skills && tech.skills.slice(0, 3).map((skill, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                    {skill}
                                                </span>
                                            ))
                                        )}
                                        {((tech.categories?.length > 3) || (tech.skills?.length > 3)) && (
                                            <span className="text-[9px] text-slate-400 font-bold self-center">+{Math.max((tech.categories?.length || 0) - 3, (tech.skills?.length || 0) - 3)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                                {tech.user?.passwordResetRequested && activeTab === 'resets' && (
                                    <button
                                        onClick={() => handleOpenResetModal(tech)}
                                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-200 hover:bg-red-700"
                                    >
                                        Fulfill Reset
                                    </button>
                                )}
                                <button
                                    onClick={() => setViewingDocsBy(tech)}
                                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-white border border-transparent hover:border-indigo-200 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <Shield className="w-3.5 h-3.5" /> Creds
                                </button>

                                {activeTab === 'verified' ? (
                                    <>
                                        <button
                                            disabled={actionLoading[tech.user?._id]}
                                            onClick={() => handleToggleStatus(tech.user?._id, tech.user?.isActive)}
                                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-w-[100px] flex items-center justify-center gap-2 ${tech.user?.isActive === false
                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                }`}
                                        >
                                            {actionLoading[tech.user?._id] ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                            {tech.user?.isActive === false ? 'Unblock' : 'Block'}
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to PERMANENTLY delete this technician? This cannot be undone.')) {
                                                    await deleteTechnician(tech._id || tech.id);
                                                }
                                            }}
                                            className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-red-100 hover:border-red-200"
                                            title="Permanently Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                            Pending Review
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to PERMANENTLY delete this application?')) {
                                                    await deleteTechnician(tech._id || tech.id);
                                                }
                                            }}
                                            className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-red-100 hover:border-red-200"
                                            title="Delete Application"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!isLoading && displayTechnicians.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300 mb-6">
                            <Users className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">Expert Network is Empty</h4>
                        <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">No professionals found matching your current tab or search filters.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <span className="text-xs font-bold text-slate-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
            )}

            {/* Password Reset Modal */}
            <AnimatePresence>
                {resetModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Key className="w-5 h-5 text-indigo-500" />
                                    Reset Password
                                </h3>
                                <button
                                    onClick={() => setResetModalOpen(false)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">RESETTING PASSWORD FOR</p>
                                        <p className="text-base font-black text-slate-900 dark:text-white">{resetData.techName}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-500 tracking-wider">New Password</label>
                                        <input
                                            type="text"
                                            placeholder="Enter new password"
                                            value={resetData.newPassword}
                                            onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Confirm Password</label>
                                        <input
                                            type="text"
                                            placeholder="Confirm new password"
                                            value={resetData.confirmPassword}
                                            onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all font-medium ${resetData.confirmPassword && resetData.newPassword !== resetData.confirmPassword
                                                ? 'border-red-300 focus:ring-red-500/20'
                                                : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'
                                                }`}
                                        />
                                        {resetData.confirmPassword && resetData.newPassword !== resetData.confirmPassword && (
                                            <p className="text-[10px] font-bold text-red-500">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setResetModalOpen(false)}
                                        className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitReset}
                                        disabled={actionLoading.resetPass || !resetData.newPassword || !resetData.confirmPassword || resetData.newPassword !== resetData.confirmPassword}
                                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        {actionLoading.resetPass ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {viewingDocsBy && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="flex items-center gap-6">
                                    <div className="relative group/avatar">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl ring-4 ring-indigo-500/20">
                                            <img
                                                src={editData.profilePhotoPreview || viewingDocsBy.profilePhoto || viewingDocsBy.user?.profilePhoto || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {isEditingProfile && (
                                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                                <Plus className="w-5 h-5 text-white" />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setEditData({
                                                                ...editData,
                                                                profilePhotoFile: file,
                                                                profilePhotoPreview: URL.createObjectURL(file)
                                                            });
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Expert Profile & Credentials</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {viewingDocsBy.employeeId || 'N/A'} • {viewingDocsBy.user?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isEditingProfile ? (
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={actionLoading.saveProfile}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all"
                                        >
                                            {actionLoading.saveProfile ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            Save Changes
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsEditingProfile(true);
                                                setEditData({
                                                    bio: viewingDocsBy.bio || '',
                                                    skills: (viewingDocsBy.skills || []).join(', '),
                                                    employeeId: viewingDocsBy.employeeId || '',
                                                    name: viewingDocsBy.user?.name || '',
                                                    phone: viewingDocsBy.user?.phone || '',
                                                    address: viewingDocsBy.location?.address || '',
                                                    categories: viewingDocsBy.categories?.map(c => c._id || c.id) || [],
                                                    services: viewingDocsBy.services?.map(s => s._id || s.id) || []
                                                });
                                            }}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all"
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                    <button onClick={() => { setViewingDocsBy(null); setIsEditingProfile(false); }} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-400 hover:text-red-500 transition-all"><X /></button>
                                </div>
                            </div>

                            <div className="p-10 space-y-10">
                                {/* Core Identity Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-800/20 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</p>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={editData.name}
                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            ) : (
                                                <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{viewingDocsBy.user?.name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile Number</p>
                                            {isEditingProfile ? (
                                                <input
                                                    type="tel"
                                                    value={editData.phone}
                                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            ) : (
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{viewingDocsBy.user?.phone || 'Not Provided'}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company / Employee ID</p>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={editData.employeeId}
                                                    onChange={(e) => setEditData({ ...editData, employeeId: e.target.value })}
                                                    placeholder="RES-XXX"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            ) : (
                                                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{viewingDocsBy.employeeId || 'NOT ASSIGNED'}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Address</p>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={editData.address}
                                                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                                    placeholder="123 Street, City"
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-tight">
                                                    {viewingDocsBy.location?.address || 'Profile incomplete'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bio & Skills Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-3">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Professional Summary</p>
                                        {isEditingProfile ? (
                                            <textarea
                                                value={editData.bio}
                                                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 h-32"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                                "{viewingDocsBy.bio || "No summary provided. Partner should update their profile."}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Technical Skills</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                placeholder="Plumbing, Electrical..."
                                                value={editData.skills}
                                                onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {viewingDocsBy.skills && viewingDocsBy.skills.length > 0 ? (
                                                    viewingDocsBy.skills.map((skill, idx) => (
                                                        <span key={idx} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No skills listed</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Categories Section */}
                                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/10 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Assigned Expert Categories</p>
                                    {isEditingProfile ? (
                                        <div className="flex flex-wrap gap-2">
                                            {categories?.map(cat => (
                                                <button
                                                    key={cat._id}
                                                    onClick={() => {
                                                        const current = editData.categories || [];
                                                        if (current.includes(cat._id)) {
                                                            setEditData({ ...editData, categories: current.filter(id => id !== cat._id) });
                                                        } else {
                                                            setEditData({ ...editData, categories: [...current, cat._id] });
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${editData.categories?.includes(cat._id)
                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                                                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                                                        }`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {viewingDocsBy.categories?.length > 0 ? (
                                                viewingDocsBy.categories.map(cat => (
                                                    <span key={cat._id} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                        {cat.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic font-bold">No official categories assigned.</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Services Section */}
                                <div className="p-8 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10">
                                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4">Official Professional Roles (Services)</p>
                                    {isEditingProfile ? (
                                        <div className="flex flex-wrap gap-2">
                                            {services?.map(service => (
                                                <button
                                                    key={service._id}
                                                    onClick={() => {
                                                        const current = editData.services || [];
                                                        if (current.includes(service._id)) {
                                                            setEditData({ ...editData, services: current.filter(id => id !== service._id) });
                                                        } else {
                                                            setEditData({ ...editData, services: [...current, service._id] });
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${editData.services?.includes(service._id)
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none'
                                                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                                                        }`}
                                                >
                                                    {service.title}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {viewingDocsBy.services?.length > 0 ? (
                                                viewingDocsBy.services.map(s => (
                                                    <span key={s._id} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none">
                                                        {s.title}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-indigo-400 italic font-bold text-[10px] uppercase tracking-widest">No service roles assigned yet.</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Documents Section */}
                                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em]">Verification Documents</p>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aadhar Card</p>
                                                {viewingDocsBy.documents?.aadharCard && (
                                                    <a href={viewingDocsBy.documents?.aadharCard} target="_blank" className="text-indigo-500 hover:underline flex items-center gap-1 text-[9px] font-black uppercase"><ExternalLink className="w-3 h-3" /> View</a>
                                                )}
                                            </div>
                                            <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 relative group">
                                                {viewingDocsBy.documents?.aadharCard ? (
                                                    <img src={viewingDocsBy.documents.aadharCard} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2"><ImageIcon className="w-10 h-10" /><span className="text-[10px] font-black uppercase italic">Missing Doc</span></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Legal Agreement</p>
                                                {viewingDocsBy.documents?.agreement && (
                                                    <a href={viewingDocsBy.documents?.agreement} target="_blank" className="text-indigo-500 hover:underline flex items-center gap-1 text-[9px] font-black uppercase"><ExternalLink className="w-3 h-3" /> View PDF</a>
                                                )}
                                            </div>
                                            <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 relative group flex items-center justify-center">
                                                {viewingDocsBy.documents?.agreement ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Shield className="w-8 h-8 text-indigo-500" />
                                                        <span className="text-[10px] font-black uppercase text-indigo-500">Agreement Uploaded</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2 font-black uppercase italic text-[10px]">
                                                        <AlertCircle className="w-8 h-8" />
                                                        No Agreement
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Category Assignment Section (Only for Pending) */}
                            {viewingDocsBy.documents?.verificationStatus === 'PENDING' && (
                                <div className="px-10 pb-4">
                                    <p className="text-xs font-black uppercase text-slate-900 dark:text-white mb-4">Select Professional Roles</p>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat._id || cat.id}
                                                onClick={() => toggleApprovalCategory(cat._id || cat.id)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${approvalCategories.includes(cat._id || cat.id)
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                                                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-10 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
                                {viewingDocsBy.documents?.verificationStatus === 'PENDING' ? (
                                    <>
                                        <button
                                            disabled={actionLoading[viewingDocsBy._id || viewingDocsBy.id] || approvalCategories.length === 0}
                                            onClick={() => handleApprove(viewingDocsBy._id || viewingDocsBy.id)}
                                            className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {actionLoading[viewingDocsBy._id || viewingDocsBy.id] ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                            Authorize & Onboard
                                        </button>
                                        <button
                                            onClick={() => handleReject(viewingDocsBy._id || viewingDocsBy.id)}
                                            className="px-10 py-5 bg-white dark:bg-slate-800 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-50 transition-all hover:bg-red-50"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => { setViewingDocsBy(null); setIsEditingProfile(false); }}
                                        className="w-full py-5 bg-white dark:bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 transition-all"
                                    >
                                        Close Management
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Registration Overlay */}
            <AnimatePresence>
                {isAddingTech && (
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 text-white">
                                <h3 className="text-2xl font-black italic tracking-tight">Rapid Onboarding</h3>
                                <button onClick={() => setIsAddingTech(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X /></button>
                            </div>
                            <form className="p-8 space-y-4" onSubmit={handleAddTech}>
                                <div className="space-y-4">
                                    <input required type="text" value={newTech.name} onChange={(e) => setNewTech({ ...newTech, name: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-xs text-slate-900 dark:text-white transition-all shadow-inner" placeholder="Full Professional Name" />
                                    <input required type="email" value={newTech.email} onChange={(e) => setNewTech({ ...newTech, email: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-xs text-slate-900 dark:text-white transition-all shadow-inner" placeholder="Email Contact" />
                                    <input required type="tel" value={newTech.phone} onChange={(e) => setNewTech({ ...newTech, phone: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-xs text-slate-900 dark:text-white transition-all shadow-inner" placeholder="Phone Number" />

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Primary Category</label>
                                        <select
                                            value={newTech.skills}
                                            onChange={(e) => setNewTech({ ...newTech, skills: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-xs text-slate-900 dark:text-white transition-all shadow-inner appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select a Category</option>
                                            {categories.map(cat => (
                                                <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <input required type="password" value={newTech.password} onChange={(e) => setNewTech({ ...newTech, password: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-xs text-slate-900 dark:text-white transition-all shadow-inner" placeholder="Assign Secure Password" />

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Professional Agreement (PDF)</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setNewTech({ ...newTech, agreementFile: e.target.files[0] })}
                                                className="hidden"
                                                id="agreement-upload"
                                            />
                                            <label
                                                htmlFor="agreement-upload"
                                                className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all ${newTech.agreementFile ? 'border-indigo-500 text-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {newTech.agreementFile ? newTech.agreementFile.name : 'Choose Agreement PDF'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <textarea value={newTech.bio} onChange={(e) => setNewTech({ ...newTech, bio: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-xs text-slate-900 dark:text-white transition-all shadow-inner" placeholder="Brief Professional Summary" rows={2} />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading.addTech}
                                    className="relative w-full py-5 bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all mt-6 active:scale-95 group overflow-hidden"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        {actionLoading.addTech ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Initiate Partnership
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTechnicians;
