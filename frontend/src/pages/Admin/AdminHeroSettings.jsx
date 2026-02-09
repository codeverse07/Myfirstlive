import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Search, Edit3, Trash2, X, Image as ImageIcon, Loader, CheckCircle2, Star, Eye, EyeOff, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminHeroSettings = () => {
    const { heroes, services, addHero, updateHero, deleteHero } = useAdmin();
    const [isAdding, setIsAdding] = React.useState(false);
    const [editingHero, setEditingHero] = React.useState(null);
    const [actionLoading, setActionLoading] = React.useState({});
    const [searchQuery, setSearchQuery] = React.useState('');

    const [formData, setFormData] = React.useState({
        title: '',
        subtitle: '',
        image: '',
        serviceId: '',
        isActive: true,
        order: 0
    });

    const filteredHeroes = (heroes || []).filter(hero =>
        hero.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(prev => ({ ...prev, submit: true }));

        try {
            if (editingHero) {
                await updateHero(editingHero._id || editingHero.id, formData);
                toast.success("Hero slide updated");
            } else {
                await addHero(formData);
                toast.success("New hero slide added");
            }
            setIsAdding(false);
            setEditingHero(null);
            setFormData({ title: '', subtitle: '', image: '', serviceId: '', isActive: true, order: 0 });
        } catch (err) {
            toast.error("Operation failed");
        } finally {
            setActionLoading(prev => ({ ...prev, submit: false }));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this hero slide?")) {
            setActionLoading(prev => ({ ...prev, [id]: true }));
            try {
                await deleteHero(id);
                toast.success("Hero removed");
            } catch (err) {
                toast.error("Failed to delete");
            } finally {
                setActionLoading(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    const startEdit = (hero) => {
        setEditingHero(hero);
        setFormData({
            title: hero.title,
            subtitle: hero.subtitle,
            image: hero.image,
            serviceId: hero.serviceId?._id || hero.serviceId || '',
            isActive: hero.isActive !== false,
            order: hero.order || 0
        });
        setIsAdding(true);
    };

    const handleToggleStatus = async (hero) => {
        const id = hero._id || hero.id;
        setActionLoading(prev => ({ ...prev, [`toggle_${id}`]: true }));
        try {
            await updateHero(id, { isActive: !hero.isActive });
            toast.success(`Slide ${!hero.isActive ? 'Activated' : 'Deactivated'}`);
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setActionLoading(prev => ({ ...prev, [`toggle_${id}`]: false }));
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Hero Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Configure primary visual slides & call-to-actions</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search slides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingHero(null); setIsAdding(true); }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Add Slide
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="min-h-[400px] relative">
                {(!heroes || heroes.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 mb-4">
                            <ImageIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">No Slides Found</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">Add your first hero banner to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredHeroes.map((hero) => (
                                <motion.div
                                    layout
                                    key={hero._id || hero.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl group relative"
                                >
                                    <div className="h-52 relative overflow-hidden">
                                        <img
                                            src={hero.image}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={hero.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                                        {/* Status Badge */}
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg border ${hero.isActive
                                                ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                                                : 'bg-rose-500/90 text-white border-rose-400/30'}`}>
                                                {hero.isActive ? '• Active' : '• Inactive'}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-6 left-6 pr-12">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Order: {hero.order}</span>
                                            </div>
                                            <h4 className="text-white font-black text-xl italic tracking-tight uppercase leading-none truncate">{hero.title}</h4>
                                            <p className="text-white/80 text-[10px] font-bold mt-1.5 truncate max-w-[200px]">{hero.subtitle}</p>
                                        </div>

                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <button
                                                onClick={() => startEdit(hero)}
                                                className="p-3 bg-white text-indigo-600 rounded-2xl shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
                                                title="Edit Slide"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(hero._id || hero.id)}
                                                disabled={actionLoading[hero._id || hero.id]}
                                                className="p-3 bg-white text-rose-600 rounded-2xl shadow-xl hover:bg-rose-50 transition-all active:scale-95"
                                                title="Delete Slide"
                                            >
                                                {actionLoading[hero._id || hero.id] ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Visibility Toggle */}
                                        <div className="absolute bottom-6 right-6">
                                            <button
                                                onClick={() => handleToggleStatus(hero)}
                                                disabled={actionLoading[`toggle_${hero._id || hero.id}`]}
                                                className={`w-12 h-12 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all shadow-2xl relative overflow-hidden group/btn ${hero.isActive
                                                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                                                    : 'bg-slate-900/80 text-slate-400 ring-4 ring-slate-900/10'}`}
                                            >
                                                {actionLoading[`toggle_${hero._id || hero.id}`] ? (
                                                    <Loader className="w-5 h-5 animate-spin" />
                                                ) : hero.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}

                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 my-8"
                        >
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 text-white">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tight">{editingHero ? 'Edit Slide' : 'New Slide'}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Hero Section Configuration</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Slide Title</label>
                                        <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-sm transition-all" placeholder="Expert AC Repair" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Subtitle</label>
                                        <input required type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-sm transition-all" placeholder="Cooling solutions in minutes" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Image URL</label>
                                        <input required type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-sm transition-all" placeholder="https://unsplash.com/..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Link to Service (Optional)</label>
                                            <select
                                                value={formData.serviceId}
                                                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                                className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-sm"
                                            >
                                                <option value="">No link</option>
                                                {services?.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Display Order</label>
                                            <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={actionLoading.submit}
                                        className="flex-1 py-6 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {actionLoading.submit ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        {editingHero ? 'Save Changes' : 'Launch Slide'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminHeroSettings;
