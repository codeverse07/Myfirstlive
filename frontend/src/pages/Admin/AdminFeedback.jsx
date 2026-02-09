import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MessageSquarePlus, User as UserIcon, Clock, Star, X, Wrench, FolderPlus, AlertCircle, Quote, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AdminFeedback = () => {
    const { feedbacks, reviews, deleteReview, addCategory } = useAdmin();
    const [activeTab, setActiveTab] = React.useState('feedback'); // 'feedback' or 'reviews'

    const handleApproveCategoryRequest = async (fb) => {
        if (window.confirm(`Approve requested category: ${fb.requestedCategoryName}?`)) {
            try {
                await addCategory({
                    name: fb.requestedCategoryName,
                    description: `Created from user request: ${fb.message}`,
                    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?q=80&w=400',
                    icon: 'Plus',
                    color: 'bg-indigo-100 text-indigo-600'
                });
                toast.success("New category added to system");
            } catch (err) {
                toast.error("Failed to approve request");
            }
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Voice of Customers</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Monitor sentiment and manage service category requests</p>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {[
                        { id: 'feedback', label: 'Direct Feedback', icon: MessageSquarePlus, count: feedbacks.length },
                        { id: 'reviews', label: 'Service Reviews', icon: Star, count: reviews.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {activeTab === 'feedback' ? (
                        <>
                            {feedbacks.map((fb) => (
                                <motion.div
                                    layout
                                    key={fb._id}
                                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none relative group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Quote className="w-20 h-20 rotate-12" />
                                    </div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                                                <UserIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white leading-none">{fb.user?.name || 'Anonymous User'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{fb.user?.email || fb.user?.phone || 'Guest Access'}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${fb.category === 'Category Request' ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                                            {fb.category}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 italic relative z-10">"{fb.message}"</p>

                                    {fb.category === 'Category Request' && (
                                        <div className="mb-8 p-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Impact Request</p>
                                                <p className="text-base font-black text-slate-900 dark:text-white capitalize">{fb.requestedCategoryName}</p>
                                            </div>
                                            <button
                                                onClick={() => handleApproveCategoryRequest(fb)}
                                                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <FolderPlus className="w-4 h-4" /> Finalize Addition
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(fb.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {feedbacks.length === 0 && (
                                <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 mb-4">
                                        <MessageSquarePlus className="w-8 h-8" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Silence is Golden</p>
                                    <p className="text-slate-500 text-xs mt-2">No direct messages have been received yet.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {reviews.map((review) => (
                                <motion.div
                                    layout
                                    key={review._id}
                                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 relative group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
                                                <Star className="w-6 h-6 fill-current" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white leading-none">{review.customer?.name || 'Anonymous Patron'}</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { if (window.confirm('Erase this review?')) deleteReview(review._id) }}
                                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 italic">"{review.review}"</p>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Wrench className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Technician</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{review.technician?.name || 'System Expert'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-white uppercase bg-indigo-600 px-3 py-1 rounded-full tracking-widest shadow-md shadow-indigo-500/20">
                                            ID: {(review.booking?._id || (typeof review.booking === 'string' ? review.booking : '')).substring(0, 6).toUpperCase() || 'MANUAL'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {reviews.length === 0 && (
                                <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 mb-4">
                                        <Star className="w-8 h-8" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Quality is Quiet</p>
                                    <p className="text-slate-500 text-xs mt-2">No service reviews have been posted yet.</p>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AdminFeedback;
