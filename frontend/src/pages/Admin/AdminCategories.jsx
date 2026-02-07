import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Tag, Plus, Search, Edit3, Trash2, X, Image as ImageIcon, Check, Loader, LayoutGrid, Info, ExternalLink, Star, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminCategories = () => {
    const { categories, addCategory, updateCategory, deleteCategory } = useAdmin();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isAdding, setIsAdding] = React.useState(false);
    const [editingCat, setEditingCat] = React.useState(null);
    const [actionLoading, setActionLoading] = React.useState({});

    const [formData, setFormData] = React.useState({
        name: '',
        description: '',
        image: '',
        icon: 'Hammer',
        color: 'bg-indigo-100 text-indigo-600',
        price: '',
        rating: '0',
        isActive: true
    });

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(prev => ({ ...prev, submit: true }));

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('rating', formData.rating);
        data.append('icon', formData.icon);
        data.append('color', formData.color);
        data.append('isActive', formData.isActive);

        if (formData.image instanceof File) {
            data.append('image', formData.image);
        } else if (typeof formData.image === 'string' && formData.image.startsWith('http')) {
            data.append('image', formData.image);
        }

        try {
            if (editingCat) {
                await updateCategory(editingCat._id || editingCat.id, data);
                toast.success("Category updated");
            } else {
                await addCategory(data);
                toast.success("New category launched");
            }
            setIsAdding(false);
            setEditingCat(null);
            setFormData({ name: '', description: '', image: '', icon: 'Hammer', color: 'bg-indigo-100 text-indigo-600', price: '', rating: '4.8' });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message || "Operation failed");
        } finally {
            setActionLoading(prev => ({ ...prev, submit: false }));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this category? This will affect all associated services.")) {
            setActionLoading(prev => ({ ...prev, [id]: true }));
            try {
                await deleteCategory(id);
                toast.success("Category removed");
            } catch (err) {
                toast.error("Failed to delete");
            } finally {
                setActionLoading(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    const startEdit = (cat) => {
        setEditingCat(cat);
        setFormData({
            name: cat.name,
            description: cat.description,
            image: cat.image,
            icon: cat.icon || 'Hammer',
            color: cat.color || 'bg-indigo-100 text-indigo-600',
            price: cat.price || '',
            rating: cat.rating || '4.8',
            isActive: cat.isActive !== false // Default to true if undefined
        });
        setIsAdding(true);
    };

    const handleToggleStatus = async (cat) => {
        const id = cat._id || cat.id;
        setActionLoading(prev => ({ ...prev, [`toggle_${id}`]: true }));
        try {
            const formData = new FormData();
            // Important: We need to send other required fields if backend validation requires them, 
            // but typical PATCH only updates sent fields. Assuming PATCH implementation in backend.
            formData.append('isActive', !cat.isActive);

            await updateCategory(id, formData);
            toast.success(`Category ${!cat.isActive ? 'Activated' : 'Deactivated'}`);
        } catch (err) {
            console.error(err);
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
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Category Catalog</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage service verticals and visual identity</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingCat(null); setIsAdding(true); }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Create Vertical
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredCategories.map((cat) => (
                        <motion.div
                            layout
                            key={cat._id || cat.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none group relative"
                        >
                            <div className="h-40 relative overflow-hidden">
                                <img
                                    src={cat.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6958'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={cat.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-6">
                                    <h4 className="text-white font-black text-xl italic tracking-tight uppercase leading-none">{cat.name}</h4>
                                    {!cat.isActive && (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded">Inactive</span>
                                    )}
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => startEdit(cat)}
                                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat._id || cat.id)}
                                        disabled={actionLoading[cat._id || cat.id]}
                                        className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-xl text-red-100 hover:bg-red-500/40 transition-all"
                                    >
                                        {actionLoading[cat._id || cat.id] ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                                {/* Active Status Toggle on Card */}
                                <div className="absolute bottom-4 right-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStatus(cat);
                                        }}
                                        disabled={actionLoading[`toggle_${cat._id || cat.id}`]}
                                        className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${cat.isActive ? 'bg-green-500' : 'bg-slate-600/50 backdrop-blur'} shadow-lg`}
                                    >
                                        {actionLoading[`toggle_${cat._id || cat.id}`] ? (
                                            <Loader className="w-3 h-3 text-white absolute top-1.5 left-3.5 animate-spin" />
                                        ) : (
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${cat.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {cat.description || "No description provided for this business vertical."}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Payout</span>
                                        <span className="text-lg font-black text-indigo-600 tracking-tight">₹{cat.price || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Score</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                                            <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                                {(!cat.rating || cat.rating == 0) ? 'New' : cat.rating}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10"
                        >
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 text-white">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tight">{editingCat ? 'Edit Category' : 'Create Category'}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Service Category Configuration</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="col-span-2 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600"><Info className="w-4 h-4" /></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Information</p>
                                    </div>
                                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-sm transition-all" placeholder="Category Name (e.g. Plumbing)" />
                                    <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-sm transition-all" placeholder="Description & Purpose" rows={3} />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Economics</p>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full pl-10 pr-5 py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm" placeholder="Base Service Payout" />
                                    </div>
                                    <input type="number" step="0.1" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm" placeholder="Rating (0 for 'New')" />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Style</p>
                                    {/* Image Preview */}
                                    {(formData.imagePreview || (typeof formData.image === 'string' && formData.image)) && (
                                        <div className="mb-3 w-full h-32 rounded-2xl overflow-hidden relative group border border-slate-100 dark:border-slate-800">
                                            <img
                                                src={formData.imagePreview || formData.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-bold">Change Image</span>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setFormData({ ...formData, image: file, imagePreview: URL.createObjectURL(file) });
                                            }
                                        }}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                                    />
                                    {/* Status Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Active Status</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Visible to users</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${formData.isActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-2 pt-10 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={actionLoading.submit}
                                        className="flex-1 py-6 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {actionLoading.submit ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        {editingCat ? 'Save Changes' : 'Create Category'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="px-8 py-6 bg-white dark:bg-slate-800 text-slate-400 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 transition-all"
                                    >
                                        Abort
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

export default AdminCategories;
