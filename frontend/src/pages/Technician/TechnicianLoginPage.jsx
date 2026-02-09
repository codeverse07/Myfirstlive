import React, { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Eye, EyeOff, ShieldCheck, Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import client from '../../api/client';
import { AnimatePresence, motion } from 'framer-motion';

const TechnicianLoginPage = () => {
    const containerRef = useRef(null);
    const formRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useUser();
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isForgotLoading, setIsForgotLoading] = useState(false);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(".login-card", {
            y: 30,
            opacity: 0,
            duration: 0.8,
        })
            .from(".stagger-item", {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
            }, "-=0.4");
    }, { scope: containerRef });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Pass 'TECHNICIAN' role to enforce isolation
            const result = await login(email, password, 'bypass-token', 'TECHNICIAN');
            if (result.success) {
                if (result.user?.role === 'TECHNICIAN') {
                    toast.success('Welcome back, Captain!');
                    const from = location.state?.from?.pathname || '/technician/dashboard';
                    navigate(from, { replace: true });
                } else if (result.user?.role === 'ADMIN') {
                    toast.error('Please use the Admin Portal for administrative access.');
                } else {
                    toast.error('This login is for verified technicians only.');
                }
            } else {
                toast.error(result.message || 'Authentication failed');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail) return toast.error("Please enter your email");

        setIsForgotLoading(true);
        try {
            const res = await client.post('/auth/forgot-password-request', { email: forgotEmail });
            if (res.data.status === 'success') {
                toast.success(res.data.message, { duration: 5000 });
                setShowForgotModal(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Request failed");
        } finally {
            setIsForgotLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-outfit">
            <div className="w-full max-w-md login-card">
                {/* Logo & Brand */}
                <div className="text-center mb-8 stagger-item">
                    <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Wrench className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reservice<span className="text-blue-600">Pro</span></span>
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Expert Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">Technician Authentication</p>
                </div>

                {/* Main Auth Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-blue-500/5 border border-slate-100 dark:border-slate-800 stagger-item">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Registered Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="technician@reservice.com"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Secret Key</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotEmail(email); // Pre-fill if they typed it
                                            setShowForgotModal(true);
                                        }}
                                        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-500 tracking-widest"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 leading-tight uppercase tracking-wider">
                            Authorized personnel only. Your IP address is being logged for security purposes.
                        </p>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center stagger-item">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                        Don't have an expert account yet?
                    </p>
                    <Link to="/partner/register" className="mt-2 inline-block text-blue-600 font-black text-sm hover:underline decoration-2 underline-offset-4">
                        Become a Reservice Partner
                    </Link>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Recovery Request</h3>
                                <p className="text-slate-500 text-sm font-medium">Enter your registered email to initiate a password reset request with the administration.</p>
                            </div>

                            <form onSubmit={handleForgotSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registered Email</label>
                                    <input
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="technician@reservice.com"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-blue-500 outline-none font-bold text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isForgotLoading}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isForgotLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Send Request'}
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

export default TechnicianLoginPage;
