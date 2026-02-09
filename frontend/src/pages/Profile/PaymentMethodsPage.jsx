import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, CheckCircle } from 'lucide-react';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import Button from '../../components/common/Button';
import { toast } from 'react-hot-toast';

const PaymentMethodsPage = () => {
    const navigate = useNavigate();

    // Initialize state from localStorage or default to 'cod'
    const [selectedMethod, setSelectedMethod] = useState(() => {
        return localStorage.getItem('default_payment_method') || 'cod';
    });

    const handleSelect = (methodId) => {
        if (methodId === 'online') {
            toast('Online payments are coming soon!', { icon: '🚧' });
            return;
        }
        setSelectedMethod(methodId);
        localStorage.setItem('default_payment_method', methodId);
        toast.success("Payment method updated");
    };

    const methods = [
        {
            id: 'cod',
            title: 'Pay on Delivery',
            description: 'Cash or UPI upon service completion',
            icon: Banknote,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
            disabled: false
        },
        {
            id: 'online',
            title: 'Online Payment',
            description: 'Credit/Debit Card, Netbanking',
            icon: CreditCard,
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
            disabled: true,
            badge: 'Starting Soon'
        }
    ];

    return (
        <div className="min-h-screen bg-transparent dark:bg-slate-950 pb-20">
            {/* Mobile Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 md:hidden">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Payment Methods</h1>
                </div>
            </div>

            <main className="p-5 max-w-2xl mx-auto">
                <div className="mb-8 hidden md:block">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Payment Preferences</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Select your preferred way to pay for services.</p>
                </div>

                <div className="space-y-4">
                    {methods.map((method) => {
                        const isSelected = selectedMethod === method.id;
                        const Icon = method.icon;

                        return (
                            <div
                                key={method.id}
                                onClick={() => !method.disabled && handleSelect(method.id)}
                                className={`relative p-5 rounded-[2rem] border-2 transition-all duration-300 flex items-start gap-5 group
                                    ${method.disabled
                                        ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-80 cursor-not-allowed'
                                        : isSelected
                                            ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-xl shadow-indigo-600/10 scale-[1.02]'
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer shadow-sm hover:shadow-md'
                                    }
                                `}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${method.color} shadow-sm shrink-0`}>
                                    <Icon className="w-7 h-7" />
                                </div>

                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className={`font-black text-lg ${method.disabled ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                            {method.title}
                                        </h3>
                                        {method.badge && (
                                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                {method.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{method.description}</p>
                                </div>

                                {isSelected && !method.disabled && (
                                    <div className="absolute top-5 right-5 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 p-1 rounded-full">
                                        <CheckCircle className="w-5 h-5 fill-current" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Secure Payments</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            All your transactions are safe and encrypted. We never store your full card details.
                        </p>
                    </div>
                </div>
            </main>

            <MobileBottomNav />
        </div>
    );
};

export default PaymentMethodsPage;
