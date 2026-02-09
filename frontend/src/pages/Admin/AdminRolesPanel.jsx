import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Shield, Tag, Users, Search, Filter, ChevronRight, Layout, Briefcase, Activity, CheckCircle, Clock, Trash2, UserPlus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminRolesPanel = () => {
    const { services, technicians, allBookings, updateTechnicianProfile } = useAdmin();
    const [selectedRole, setSelectedRole] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // techId

    // Calculate Role Stats (where Role == Service)
    const roleStats = useMemo(() => {
        return services.map(service => {
            const techsInRole = technicians.filter(t =>
                t.services?.some(ts => (ts._id || ts) === (service._id || service.id))
            );

            const bookingsInRole = allBookings.filter(b =>
                (b.service?._id || b.service) === (service._id || service.id)
            );

            const activeJobCount = bookingsInRole.filter(b => b.status === 'IN_PROGRESS').length;
            const completionRate = bookingsInRole.length > 0
                ? Math.round((bookingsInRole.filter(b => b.status === 'COMPLETED').length / bookingsInRole.length) * 100)
                : 0;

            return {
                ...service,
                name: service.title, // Map title to name for UI consistency
                techCount: techsInRole.length,
                totalBookings: bookingsInRole.length,
                activeJobs: activeJobCount,
                completionRate
            };
        });
    }, [services, technicians, allBookings]);

    const filteredRoles = roleStats.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeRole = selectedRole ? roleStats.find(r => (r._id || r.id) === selectedRole) : null;

    const assignedTechs = useMemo(() => {
        if (!selectedRole) return [];
        return technicians.filter(t =>
            t.services?.some(ts => (ts._id || ts) === selectedRole)
        );
    }, [selectedRole, technicians]);

    const unassignedTechs = useMemo(() => {
        if (!selectedRole || !activeRole) return [];

        // Extract the category ID from the active role (service)
        const roleCategoryId = activeRole.category?._id || activeRole.category;

        return technicians.filter(t => {
            // 1. Must be verified
            if (t.documents?.verificationStatus !== 'VERIFIED') return false;

            // 2. Must NOT already have this service role
            const alreadyHasRole = t.services?.some(ts => (ts._id || ts) === selectedRole);
            if (alreadyHasRole) return false;

            // 3. CATEGORY LOCK: Must be an expert in the role's category
            // This prevents a plumber from getting an AC role.
            const hasExpertCategory = t.categories?.some(cat => {
                const catId = cat._id || cat.id || cat;
                return String(catId) === String(roleCategoryId);
            });

            return hasExpertCategory;
        });
    }, [selectedRole, activeRole, technicians]);

    const handleUnassign = async (techId) => {
        if (!window.confirm("Remove this technician from this professional role? They will no longer be eligible for these bookings.")) return;

        setActionLoading(techId);
        try {
            const tech = technicians.find(t => (t._id || t.id) === techId);
            const currentServices = tech.services?.map(s => s._id || s) || [];
            const updatedServices = currentServices.filter(id => String(id) !== String(selectedRole));

            await updateTechnicianProfile(techId, { services: updatedServices });
            toast.success("Technician unassigned from role");
        } catch (err) {
            toast.error("Failed to unassign technician");
        } finally {
            setActionLoading(null);
        }
    };

    const handleAssign = async (techId) => {
        setActionLoading(techId);
        try {
            const tech = technicians.find(t => (t._id || t.id) === techId);
            const currentServices = tech.services?.map(s => s._id || s) || [];
            const updatedServices = [...currentServices, selectedRole];

            await updateTechnicianProfile(techId, { services: updatedServices });
            toast.success("Technician assigned to role");
        } catch (err) {
            toast.error("Failed to assign technician");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Briefcase className="w-5 h-5 text-indigo-500" />
                        </div>
                        <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Resource Management</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Professional Roles</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-lg">
                        Manage technician skill mapping and monitor performance across different service categories.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-auto">
                    <Search className="w-5 h-5 text-slate-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 w-full md:w-64"
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Roles List */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                            Available Roles <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">{filteredRoles.length}</span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredRoles.map((role) => (
                            <motion.button
                                key={role._id || role.id}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedRole(role._id || role.id)}
                                className={`p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${selectedRole === (role._id || role.id)
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                                    : 'border-transparent bg-white dark:bg-slate-900 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${selectedRole === (role._id || role.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                                        }`}>
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                            {role.techCount}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Technicians</div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{role.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-4">{role.description || 'No description provided'}</p>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <Activity className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">{role.completionRate}% Efficiency</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">{role.activeJobs} Active</span>
                                    </div>
                                </div>

                                <div className={`absolute bottom-0 right-0 p-2 transition-transform duration-300 ${selectedRole === (role._id || role.id) ? 'translate-x-0' : 'translate-x-full'
                                    }`}>
                                    <ChevronRight className="w-5 h-5 text-indigo-500" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Role Details / Tech List */}
                <div className="lg:col-span-5 h-full">
                    <AnimatePresence mode="wait">
                        {activeRole ? (
                            <motion.div
                                key={selectedRole}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-8"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Role Details</span>
                                        <div className="flex items-center gap-1 text-emerald-500">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase">Optimized</span>
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize mb-2">{activeRole.name}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{activeRole.description || 'Global coverage for ' + activeRole.name + ' services.'}</p>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assigned Professionals</h4>
                                        <div className="space-y-3">
                                            {assignedTechs.length > 0 ? assignedTechs.map(tech => (
                                                <div key={tech._id || tech.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm uppercase">
                                                            {tech.user?.name?.charAt(0) || 'T'}
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-black text-slate-900 dark:text-white">{tech.user?.name || 'Anonymous'}</h5>
                                                            <p className="text-[10px] font-bold text-slate-400">{tech.isOnline ? '🟢 Online' : '⚪ Offline'}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnassign(tech._id || tech.id)}
                                                        disabled={actionLoading === (tech._id || tech.id)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                        title="Unassign Role"
                                                    >
                                                        {actionLoading === (tech._id || tech.id) ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="text-center py-8">
                                                    <Users className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                                                    <p className="text-sm font-bold text-slate-400">No technicians assigned yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => setShowAssignModal(true)}
                                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Assign More Techs
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-800 mb-6">
                                    <Layout className="w-8 h-8 text-indigo-500" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Select a Role</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                    Click on any role card to view detailed performance metrics and assigned personnel.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* Assign Technicians Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAssignModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Assign Technician</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Available for {activeRole.name}</p>
                                </div>
                                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {unassignedTechs.length > 0 ? unassignedTechs.map(tech => (
                                    <div key={tech._id || tech.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-2 border-transparent hover:border-indigo-500/20 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-500">
                                                {tech.user?.name?.charAt(0) || 'T'}
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-black text-slate-900 dark:text-white">{tech.user?.name}</h5>
                                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Verified Expert</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAssign(tech._id || tech.id)}
                                            disabled={actionLoading === (tech._id || tech.id)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                                        >
                                            {actionLoading === (tech._id || tech.id) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Assign'
                                            )}
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-500">No more technicians available to assign</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminRolesPanel;
