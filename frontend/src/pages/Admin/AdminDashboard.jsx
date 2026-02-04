import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Layout, Wallet, Share2, LogOut, Settings, ChevronRight, Zap, Wrench, Users, Plus, Edit2, Check, X, Search, Star, Phone, Mail, Sparkles, Tag, PlusCircle, FolderPlus, MessageSquarePlus, Clock, User as UserIcon, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const { isAdminAuthenticated, appSettings, categories, services, technicians, users, feedbacks, reviews, allBookings, dashboardStats, logout, toggleSetting, updateServicePrice, updateSubServicePrice, toggleSubService, updateTechnician, addTechnician, addCategory, addService, approveTechnician, rejectTechnician, toggleUserStatus, deleteReview, cancelBooking } = useAdmin();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState('overview');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [editingTech, setEditingTech] = React.useState(null);
    const [isAddingTech, setIsAddingTech] = React.useState(false);

    // New Creation States
    const [isAddingCategory, setIsAddingCategory] = React.useState(false);
    const [isAddingService, setIsAddingService] = React.useState(false);

    const [newCategory, setNewCategory] = React.useState({ name: '', description: '', image: '', icon: 'Hammer', color: 'bg-indigo-100 text-indigo-600' });
    const [newService, setNewService] = React.useState({ title: '', category: '', price: '', image: '', description: '' });

    // Document Viewing State
    const [viewingDocsBy, setViewingDocsBy] = React.useState(null);
    const [filteringTech, setFilteringTech] = React.useState(null);

    React.useEffect(() => {
        if (!isAdminAuthenticated) {
            navigate('/admin/login');
        }
    }, [isAdminAuthenticated, navigate]);

    if (!isAdminAuthenticated) return null;

    const sections = [
        {
            id: 'showWallet',
            label: 'User Wallet System',
            desc: 'Enable/Disable the My Wallet card in user profile',
            icon: Wallet,
            color: 'bg-emerald-500'
        },
        {
            id: 'showReferralBanner',
            label: 'Refer & Earn Program',
            desc: 'Toggle visibility of referral banner on main pages',
            icon: Share2,
            color: 'bg-rose-500'
        }
    ];

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: Layout },
        { id: 'features', label: 'Toggles', icon: Settings },
        { id: 'services', label: 'Pricing', icon: Wrench },
        { id: 'experts', label: 'Experts', icon: Users },
        { id: 'bookings', label: 'Bookings', icon: Clock },
        { id: 'users', label: 'Users', icon: UserIcon },
        { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus },
    ];

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (!newCategory.name) return;
        addCategory(newCategory);
        setIsAddingCategory(false);
        setNewCategory({ name: '', description: '', image: '', icon: 'Hammer', color: 'bg-indigo-100 text-indigo-600' });
    };

    const handleAddService = (e) => {
        e.preventDefault();
        if (!newService.title || !newService.category) return;
        addService(newService);
        setIsAddingService(false);
        setNewService({ title: '', category: '', price: '', image: '', description: '' });
    };

    const handleApproveCategoryRequest = (fb) => {
        setNewCategory({
            name: fb.requestedCategoryName || '',
            description: `Auto-generated from request by ${fb.user?.name || 'Technician'}`,
            image: '',
            icon: 'Hammer',
            color: 'bg-indigo-100 text-indigo-600'
        });
        setActiveTab('services');
        setIsAddingCategory(true);
        // Scroll to top to ensure modal is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-outfit">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-8">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
                            <Shield className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Management Console</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-sm">System-wide Configuration</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                        <div className="bg-white dark:bg-slate-900 p-1 md:p-1.5 rounded-2xl flex border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto hide-scrollbar flex-1 md:flex-none">
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/admin/login');
                            }}
                            className="p-3 md:p-3.5 bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm shrink-0"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content Sections */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Users', value: dashboardStats?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Technicians', value: dashboardStats?.totalTechnicians || 0, icon: Wrench, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { label: 'Active Tasks', value: dashboardStats?.totalBookings || 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { label: 'New Requests', value: dashboardStats?.pendingApprovals || 0, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h4>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Sparkles className="w-32 h-32 text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Welcome Back, Admin</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">System is running normally. You have {dashboardStats?.pendingApprovals || 0} technicians waiting for document verification.</p>
                                <button
                                    onClick={() => setActiveTab('experts')}
                                    className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                >
                                    Review Now
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'features' && (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {sections.map((section) => (
                                <div
                                    key={section.id}
                                    className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 md:w-14 md:h-14 ${section.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                            <section.icon className="w-6 h-6 md:w-7 md:h-7" />
                                        </div>
                                        <button
                                            onClick={() => toggleSetting(section.id)}
                                            className={`w-14 h-8 md:w-16 md:h-9 rounded-full relative transition-all duration-500 ${appSettings[section.id] ? section.color : 'bg-slate-200 dark:bg-slate-800'}`}
                                        >
                                            <div className={`absolute top-1 md:top-1.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${appSettings[section.id] ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5'}`} />
                                        </button>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-2">{section.label}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed mb-6 font-medium">{section.desc}</p>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest ${appSettings[section.id] ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <Zap className="w-3 h-3" />
                                        {appSettings[section.id] ? 'Active' : 'Disabled'}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'services' && (
                        <motion.div
                            key="services"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                                <div className="p-5 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                                    <div>
                                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">Service & Plan Management</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Configure offerings and dynamic pricing</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full md:w-auto">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsAddingCategory(true)}
                                                className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-2 hover:bg-indigo-100 transition-all whitespace-nowrap"
                                            >
                                                <FolderPlus className="h-4 w-4" /> Category
                                            </button>
                                            <button
                                                onClick={() => setIsAddingService(true)}
                                                className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 md:gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all whitespace-nowrap"
                                            >
                                                <PlusCircle className="h-4 w-4" /> Service Card
                                            </button>
                                        </div>
                                        <div className="relative flex-1 md:flex-none">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search services..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full md:w-48 pl-9 md:pl-10 pr-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs md:text-sm border-none focus:ring-2 ring-indigo-500/20 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {filteringTech && (
                                    <div className="mx-5 md:mx-8 mb-4 md:mb-6 p-4 md:p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden bg-white shadow-sm ring-2 ring-amber-100 shrink-0">
                                                <img
                                                    src={filteringTech.profilePhoto || filteringTech.user?.profilePhoto || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100' }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Currently Viewing</p>
                                                <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white mt-0.5">Services by {filteringTech.user?.name || 'Expert'}</h4>
                                                <p className="text-[10px] text-amber-600/80 font-bold uppercase mt-0.5">{filteringTech.user?.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFilteringTech(null)}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <X className="w-3.5 h-3.5" /> Clear Filter
                                        </button>
                                    </div>
                                )}

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Service</th>
                                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</th>
                                                <th className="text-right p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Pricing (Basic / Premium / Consult)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {services
                                                .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .filter(s => !filteringTech || String(s.technician) === String(filteringTech._id || filteringTech.id))
                                                .map((service) => (
                                                    <tr key={service.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="p-6 min-w-50">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 bg-slate-100 dark:bg-slate-800">
                                                                    <img src={service.image} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?q=80&w=200&auto=format&fit=crop'} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{service.title}</p>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{service.category}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex gap-1.5">
                                                                {(service.subServices || []).map(ss => (
                                                                    <button
                                                                        key={ss.id}
                                                                        onClick={() => toggleSubService(service.id, ss.id)}
                                                                        title={`Toggle ${ss.name}`}
                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${ss.isActive
                                                                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                                            }`}
                                                                    >
                                                                        {ss.id === 'basic' ? <Tag className="w-4 h-4" /> : (ss.id === 'premium' ? <Sparkles className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                {(service.subServices || []).map(ss => (
                                                                    <div key={ss.id} className="relative group">
                                                                        <span className="absolute -top-3 left-0 text-[7px] font-black text-slate-400 uppercase opacity-0 group-focus-within:opacity-100 transition-opacity">{ss.name}</span>
                                                                        <input
                                                                            type="number"
                                                                            value={ss.price}
                                                                            onChange={(e) => updateSubServicePrice(service.id, ss.id, e.target.value)}
                                                                            className={`w-20 text-right bg-slate-50 dark:bg-slate-800/50 px-2 py-2 rounded-lg font-black text-xs focus:ring-2 ring-indigo-500/20 outline-none transition-all ${ss.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 opacity-50'}`}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                    {services
                                        .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .filter(s => !filteringTech || String(s.technician) === String(filteringTech._id || filteringTech.id))
                                        .map((service) => (
                                            <div key={service.id} className="p-5 flex flex-col gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-slate-100 dark:bg-slate-800">
                                                        <img src={service.image} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?q=80&w=200&auto=format&fit=crop'} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-black text-slate-900 dark:text-white text-base leading-tight">{service.title}</p>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{service.category}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    {(service.subServices || []).map(ss => (
                                                        <div key={ss.id} className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${ss.isActive ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                                                            <div className="flex justify-between items-center">
                                                                <span className={`text-[8px] font-black uppercase tracking-tighter ${ss.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                                                    {ss.name.split(' ')[0]}
                                                                </span>
                                                                <button
                                                                    onClick={() => toggleSubService(service.id, ss.id)}
                                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${ss.isActive
                                                                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                                                        }`}
                                                                >
                                                                    {ss.isActive ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                                </button>
                                                            </div>
                                                            <div className="relative">
                                                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">₹</span>
                                                                <input
                                                                    type="number"
                                                                    value={ss.price}
                                                                    onChange={(e) => updateSubServicePrice(service.id, ss.id, e.target.value)}
                                                                    className={`w-full text-right bg-white dark:bg-slate-950 pl-4 pr-1 py-1.5 rounded-lg font-black text-xs outline-none focus:ring-1 ring-indigo-500/20 transition-all ${ss.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 opacity-50'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'experts' && (
                        <motion.div
                            key="experts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Professional Network</h3>
                                <button
                                    onClick={() => setIsAddingTech(true)}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Expert
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {technicians.map((tech) => (
                                    <div key={tech._id || tech.id} className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none group relative overflow-hidden">
                                        <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
                                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-md shrink-0 bg-slate-100">
                                                <img
                                                    src={tech.profilePhoto || tech.user?.profilePhoto || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm md:text-base leading-tight">{tech.user?.name || 'Expert'}</h4>
                                                <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase mt-1">
                                                    <Star className="w-3.5 h-3.5 fill-current" /> {tech.avgRating || 0} • Partner
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:space-y-3 mb-5 md:mb-6">
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                <Phone className="w-4 h-4 text-slate-300 shrink-0" /> <span className="truncate">{tech.user?.phone || 'No Phone'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                <Mail className="w-4 h-4 text-slate-300 shrink-0" /> <span className="truncate">{tech.user?.email || 'No Email'}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Partner</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setFilteringTech(tech);
                                                        setActiveTab('services');
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-lg hover:bg-amber-100 transition-colors"
                                                >
                                                    Services
                                                </button>
                                                <button
                                                    onClick={() => setViewingDocsBy(tech)}
                                                    className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-100 transition-colors"
                                                >
                                                    Docs
                                                </button>
                                                {tech.documents?.verificationStatus !== 'VERIFIED' && (
                                                    <button
                                                        onClick={() => approveTechnician(tech._id || tech.id)}
                                                        className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-lg hover:bg-green-200 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {tech.documents?.verificationStatus !== 'REJECTED' && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Reject this technician?')) rejectTechnician(tech._id || tech.id)
                                                        }}
                                                        className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-lg hover:bg-red-200 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'bookings' && (
                        <motion.div
                            key="bookings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">System Bookings</h3>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Total: {allBookings.length}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                <th className="text-left p-5 text-[10px] font-black uppercase text-slate-400">Order</th>
                                                <th className="text-left p-5 text-[10px] font-black uppercase text-slate-400">Customer</th>
                                                <th className="text-left p-5 text-[10px] font-black uppercase text-slate-400">Expert</th>
                                                <th className="text-left p-5 text-[10px] font-black uppercase text-slate-400">Status</th>
                                                <th className="text-right p-5 text-[10px] font-black uppercase text-slate-400">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {allBookings.map((booking) => (
                                                <tr key={booking._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-5">
                                                        <p className="font-bold text-xs text-slate-900 dark:text-white">{booking.service?.title || 'Unknown Service'}</p>
                                                        <span className="text-[9px] font-black text-slate-400">#{booking._id.substring(0, 8).toUpperCase()}</span>
                                                    </td>
                                                    <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{booking.customer?.name}</td>
                                                    <td className="p-5 text-sm font-medium text-slate-600 dark:text-slate-400">{booking.technician?.name}</td>
                                                    <td className="p-5">
                                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : (booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700')}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                                                            <button
                                                                onClick={() => { if (window.confirm('Force cancel this booking?')) cancelBooking(booking._id) }}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Force Cancel"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {allBookings.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No bookings found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Community Members</h3>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Total: {users.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {users.filter(u => u.role !== 'ADMIN').map((user) => (
                                    <div key={user._id || user.id} className="bg-white dark:bg-slate-900 p-5 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                                {user.profilePhoto ? (
                                                    <img src={user.profilePhoto} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm">{user.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${user.role === 'TECHNICIAN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {user.role}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {user.isActive ? 'Active' : 'Blocked'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to ${user.isActive ? 'BLOCK' : 'ACTIVATE'} this user?`)) {
                                                    toggleUserStatus(user._id || user.id, user.isActive);
                                                }
                                            }}
                                            className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${user.isActive
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-100'
                                                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20'
                                                }`}
                                        >
                                            {user.isActive ? 'Block Access' : 'Restore Access'}
                                        </button>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        No users found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'feedback' && (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {/* General Feedback Section */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                        <MessageSquarePlus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">General Feedback</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">User messages from profile section</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {feedbacks.length === 0 ? (
                                        <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No feedback received yet</p>
                                        </div>
                                    ) : feedbacks.map((fb) => (
                                        <div key={fb._id} className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm">{fb.user?.name || 'Anonymous'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{fb.user?.email || fb.user?.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                                                    {fb.category}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6 italic">"{fb.message}"</p>

                                            {fb.category === 'Category Request' && (
                                                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Requested Category</p>
                                                        <p className="font-bold text-slate-900 dark:text-white capitalize">{fb.requestedCategoryName}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleApproveCategoryRequest(fb)}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                                    >
                                                        <FolderPlus className="w-4 h-4" /> Approve
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {new Date(fb.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Service Reviews Section */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                                        <Star className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Service Reviews</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ratings for completed bookings</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.length === 0 ? (
                                        <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No reviews found</p>
                                        </div>
                                    ) : reviews.map((review) => (
                                        <div key={review._id} className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                        <Star className="w-5 h-5 fill-current" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm">{review.customer?.name || 'Anonymous'}</p>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { if (window.confirm('Delete this review permanently?')) deleteReview(review._id) }}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6 italic">"{review.review}"</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                <div className="flex items-center gap-2">
                                                    <Wrench className="w-3.5 h-3.5 text-slate-300" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Expert: {review.technician?.name || 'N/A'}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/10 px-2 py-0.5 rounded tracking-tighter">
                                                    Ref: {review.booking?.substring(0, 8).toUpperCase() || 'MANUAL'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modals */}
                <AnimatePresence>
                    {isAddingCategory && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingCategory(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-4xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Create New Category</h3>
                                    <button onClick={() => setIsAddingCategory(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleAddCategory} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category Name</label>
                                        <input required type="text" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white" placeholder="e.g. Garden Care" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Icon Name (Lucide)</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white" placeholder="Hammer, Zap, Droplets..." />
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                {/* Preview icon if possible or just show current icon text */}
                                                <span className="text-[10px] font-bold">{newCategory.icon}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Theme Color</label>
                                        <select
                                            value={newCategory.color}
                                            onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white appearance-none"
                                        >
                                            <option value="bg-indigo-100 text-indigo-600">Indigo (Default)</option>
                                            <option value="bg-orange-100 text-orange-600">Orange (Energy)</option>
                                            <option value="bg-blue-100 text-blue-600">Blue (Relativity)</option>
                                            <option value="bg-cyan-100 text-cyan-600">Cyan (Tech)</option>
                                            <option value="bg-rose-100 text-rose-600">Rose (Premium)</option>
                                            <option value="bg-emerald-100 text-emerald-600">Emerald (Cleaning)</option>
                                            <option value="bg-violet-100 text-violet-600">Violet (Creative)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cover Image URL</label>
                                        <input required type="url" value={newCategory.image} onChange={e => setNewCategory({ ...newCategory, image: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white" placeholder="https://unsplash..." />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                                        <textarea required value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white min-h-25" placeholder="Brief summary of category services..." />
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">Create Category</button>
                                </form>
                            </motion.div>
                        </div>
                    )}

                    {isAddingService && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingService(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-4xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">New Service Card</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Will be visible at top of chosen category</p>
                                    </div>
                                    <button onClick={() => setIsAddingService(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleAddService} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Service Title</label>
                                            <input required type="text" value={newService.title} onChange={e => setNewService({ ...newService, title: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white" placeholder="e.g. Lawn Mowing" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Category</label>
                                            <select required value={newService.category} onChange={e => setNewService({ ...newService, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white appearance-none">
                                                <option value="">Select Category</option>
                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Base Price (₹)</label>
                                            <input required type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white" placeholder="299" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Service Image URL</label>
                                            <input required type="url" value={newService.image} onChange={e => setNewService({ ...newService, image: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white" placeholder="https://unsplash..." />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Short Description</label>
                                        <textarea required value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 ring-indigo-500/20 text-sm dark:text-white min-h-20" placeholder="What's included in this service?" />
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200/50 flex gap-3">
                                        <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-tight">By creating this service card, we will automatically generate **Basic**, **Premium**, and **Consultation** plans based on your base price.</p>
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2">Publish Service Card</button>
                                </form>
                            </motion.div>
                        </div>
                    )}

                    {viewingDocsBy && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingDocsBy(null)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-4xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[95vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Verification Documents</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Technician: {viewingDocsBy.user?.name}</p>
                                    </div>
                                    <button onClick={() => setViewingDocsBy(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Aadhaar Card</label>
                                            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                {viewingDocsBy.documents?.aadharCard ? (
                                                    <img
                                                        src={viewingDocsBy.documents.aadharCard}
                                                        className="w-full h-full object-contain cursor-zoom-in"
                                                        onClick={() => window.open(viewingDocsBy.documents.aadharCard)}
                                                        onError={(e) => { e.target.style.display = 'none' }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 italic text-xs">Not Uploaded</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">PAN Card</label>
                                            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                {viewingDocsBy.documents?.panCard ? (
                                                    <img
                                                        src={viewingDocsBy.documents.panCard}
                                                        className="w-full h-full object-contain cursor-zoom-in"
                                                        onClick={() => window.open(viewingDocsBy.documents.panCard)}
                                                        onError={(e) => { e.target.style.display = 'none' }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 italic text-xs">Not Uploaded</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Resume / CV</label>
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {viewingDocsBy.documents?.resume ? 'Document Attached' : 'No CV Uploaded (Optional)'}
                                            </span>
                                            {viewingDocsBy.documents?.resume && (
                                                <a href={viewingDocsBy.documents.resume} target="_blank" rel="noreferrer" className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Download CV</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => { approveTechnician(viewingDocsBy._id || viewingDocsBy.id); setViewingDocsBy(null); }}
                                            className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all"
                                        >
                                            Confirm & Approve
                                        </button>
                                        <button
                                            onClick={() => { if (window.confirm('Reject?')) { rejectTechnician(viewingDocsBy._id || viewingDocsBy.id); setViewingDocsBy(null); } }}
                                            className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl text-sm font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all"
                                        >
                                            Reject Expert
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
};

export default AdminDashboard;
