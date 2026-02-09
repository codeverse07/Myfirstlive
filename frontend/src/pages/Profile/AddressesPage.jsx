import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, MapIcon } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import Button from '../../components/common/Button';

const AddressesPage = () => {
    const navigate = useNavigate();
    const { addresses, addAddress, removeAddress } = useUser();
    const [isAdding, setIsAdding] = useState(false);
    const [newAddr, setNewAddr] = useState({ type: 'Home', address: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newAddr.address.trim()) return;
        addAddress(newAddr);
        setNewAddr({ type: 'Home', address: '' });
        setIsAdding(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Home': return Home;
            case 'Office': return Briefcase;
            default: return MapPin;
        }
    };

    return (
        <div className="min-h-screen bg-transparent dark:bg-slate-950 pb-20">
            {/* Mobile Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 md:hidden">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">My Addresses</h1>
                </div>
            </div>

            <main className="p-5 max-w-2xl mx-auto">
                {/* Add New Button */}
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 font-bold hover:border-rose-500 hover:text-rose-500 transition-all mb-6"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Address
                    </button>
                )}

                {/* Add Form */}
                {isAdding && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-rose-100 dark:border-slate-800 mb-6 animate-in slide-in-from-top-4 duration-300">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4">New Address</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Address Type</label>
                                <div className="flex gap-2">
                                    {['Home', 'Office', 'Other'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewAddr(p => ({ ...p, type }))}
                                            className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${newAddr.type === type ? 'border-rose-600 bg-rose-50 text-rose-600' : 'border-slate-100 dark:border-slate-800 text-slate-500'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Full Address</label>
                                <textarea
                                    placeholder="Enter your complete address..."
                                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-medium resize-none h-24"
                                    value={newAddr.address}
                                    onChange={e => setNewAddr(p => ({ ...p, address: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => setIsAdding(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-rose-600 hover:bg-rose-700"
                                >
                                    Save Address
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Address List */}
                <div className="space-y-4">
                    {addresses.length > 0 ? (
                        addresses.map(addr => {
                            const Icon = getIcon(addr.type);
                            return (
                                <div
                                    key={addr.id}
                                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900 dark:text-white">{addr.type}</span>
                                            {addr.isDefault && (
                                                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Default</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed truncate-2-lines">
                                            {addr.address}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => removeAddress(addr.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <MapIcon className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white">No addresses saved</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                                Add your service addresses for a faster booking experience.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
};

export default AddressesPage;
