import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Hash, Save, Loader2 } from 'lucide-react';
import Button from '../common/Button';

const EditProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        pincode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                address: user.address || '',
                pincode: user.pincode || ''
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!formData.name.trim()) {
                throw new Error('Name is required');
            }

            // Exclude pincode from update payload to prevent backend validation errors
            // as pincode updates are disabled here.
            const { pincode, ...updateData } = formData;

            await onUpdate(updateData);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Edit Profile</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium resize-none min-h-20"
                                    placeholder="Enter your address"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 opacity-50 cursor-not-allowed">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pincode</label>
                                <span className="text-[10px] items-center flex gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    Cannot be changed
                                </span>
                            </div>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    readOnly
                                    disabled
                                    className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border-none text-slate-500 focus:ring-0 cursor-not-allowed font-medium"
                                    placeholder="845438"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1">To change pincode, please contact support or register a new account.</p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full justify-center py-3.5 text-sm font-bold shadow-lg shadow-blue-500/20"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</>
                            ) : (
                                <><Save className="w-5 h-5 mr-2" /> Save Changes</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
