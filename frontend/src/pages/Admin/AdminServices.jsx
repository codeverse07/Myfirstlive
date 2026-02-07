import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Search, Trash2, Edit2, Wrench, X, Check, Image as ImageIcon, DollarSign, Loader, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminServices = () => {
    const { services, categories, addService, deleteService, updateService } = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    // Filter Logic
    const filteredServices = services.filter(service => {
        const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory || service.normalizedCategory === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        price: '',
        description: '',
        image: '',
        isActive: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const openAddModal = () => {
        setEditingService(null);
        setFormData({ title: '', category: '', price: '', description: '', image: '', isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (service) => {
        setEditingService(service);
        setFormData({
            title: service.title,
            category: service.category, // ID
            price: service.price,
            description: service.description,
            image: service.image, // URL
            isActive: service.isActive !== false
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('category', formData.category);
            data.append('price', formData.price);
            data.append('description', formData.description);
            // data.append('isActive', formData.isActive); // Often handled by separate endpoint or needs backend support in create/update

            if (formData.imageFile) {
                data.append('headerImage', formData.imageFile); // Backend expects 'headerImage'
            } else if (formData.image && !editingService) {
                // If creating and using a URL fallback (rare for File input UI but possible)
                // data.append('headerImage', formData.image); 
            }

            let res;
            if (editingService) {
                res = await updateService(editingService.id, data);
            } else {
                res = await addService(formData); // addService handles FormData construction internally if passed object with imageFile
            }

            if (res && res.success) {
                setIsModalOpen(false);
                setFormData({ title: '', category: '', price: '', description: '', image: '', isActive: true });
                setEditingService(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (service) => {
        const id = service.id;
        setActionLoading(prev => ({ ...prev, [`toggle_${id}`]: true }));
        try {
            // We use updateService for this too
            // Note: If backend expects JSON for simple updates, we should use that. 
            // Our context updateService handles both but lets try simple object first.
            const payload = { isActive: !service.isActive };
            await updateService(id, payload);
            toast.success(`Service ${!service.isActive ? 'Activated' : 'Deactivated'}`);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(prev => ({ ...prev, [`toggle_${id}`]: false }));
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Services</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage global service offerings</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Add Service
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                    />
                </div>
                <div className="md:w-64">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id || cat._id} value={cat.id || cat.name.toLowerCase()}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredServices.map((service) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            className={`bg-white dark:bg-slate-900 rounded-2xl md:rounded-4xl overflow-hidden border ${service.isActive === false ? 'border-red-500/30' : 'border-slate-100 dark:border-slate-800'} hover:shadow-xl hover:shadow-indigo-500/10 transition-all group relative`}
                        >
                            {/* Active Status Toggle on Card */}
                            <div className="absolute top-4 left-4 z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStatus(service);
                                    }}
                                    disabled={actionLoading[`toggle_${service.id}`]}
                                    className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${service.isActive !== false ? 'bg-green-500' : 'bg-slate-600/50 backdrop-blur'} shadow-lg`}
                                    title={service.isActive !== false ? "Active" : "Inactive"}
                                >
                                    {actionLoading[`toggle_${service.id}`] ? (
                                        <Loader className="w-3 h-3 text-white absolute top-1.5 left-3.5 animate-spin" />
                                    ) : (
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${service.isActive !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                                    )}
                                </button>
                            </div>

                            <div className="h-48 relative overflow-hidden">
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${service.isActive === false ? 'grayscale' : ''}`}
                                />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => openEditModal(service)}
                                        className="p-2 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
                                        title="Edit Service"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteService(service.id)}
                                        className="p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                        title="Delete Service"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                                        {service.categoryName || 'General'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{service.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 min-h-10">
                                    {service.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price</span>
                                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                            <span className="font-extrabold text-xl">₹{service.price}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add/Edit Service Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-4xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editingService ? 'Edit Service' : 'New Service'}</h2>
                                        <p className="text-slate-500 text-sm font-bold">{editingService ? 'Modify service details' : 'Add a global service offering'}</p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                        <X className="w-6 h-6 text-slate-500" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Service Title</label>
                                            <div className="relative">
                                                <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g. Deep Cleaning"
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-white"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-white appearance-none"
                                                    required
                                                >
                                                    <option value="">Select...</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id || cat.name.toLowerCase()}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Price (₹)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                        placeholder="499"
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-white"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Describe what's included..."
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-900 dark:text-white min-h-25"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Service Image</label>

                                            <div
                                                className={`relative w-full h-40 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${formData.imageFile || formData.image ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                onDrop={(e) => {
                                                    e.preventDefault(); e.stopPropagation();
                                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                        const file = e.dataTransfer.files[0];
                                                        setFormData({ ...formData, imageFile: file, image: URL.createObjectURL(file) });
                                                    }
                                                }}
                                                onClick={() => document.getElementById('service-image-input').click()}
                                            >
                                                <input
                                                    type="file"
                                                    id="service-image-input"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            const file = e.target.files[0];
                                                            setFormData({ ...formData, imageFile: file, image: URL.createObjectURL(file) });
                                                        }
                                                    }}
                                                />
                                                {formData.image ? (
                                                    <>
                                                        <img src={formData.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                            <p className="text-white font-bold text-xs uppercase tracking-widest">Change Image</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                                                            <ImageIcon className="w-5 h-5" />
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Click or Drag Image Here</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG (Max 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                {editingService ? 'Saving...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                {editingService ? 'Save Changes' : 'Create Service'}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminServices;
