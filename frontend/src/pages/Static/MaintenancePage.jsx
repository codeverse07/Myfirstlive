import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

const MaintenancePage = ({ message, endTime }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        if (!endTime) return null;
        const difference = +new Date(endTime) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60))),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            return null;
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #333 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"
                style={{ animationDelay: '1s' }} />

            {/* Content Wrapper */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 max-w-2xl w-full text-center"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tight italic uppercase">Reservice</span>
                </div>

                {/* Animated Icon */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                >
                    <Clock className="w-10 h-10 text-blue-500" />
                    <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full animate-pulse" />
                </motion.div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic line-height-[0.9]">
                    Under <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Maintenance</span>
                </h1>

                {/* Message */}
                <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 max-w-lg mx-auto leading-relaxed">
                    {message || "Our server is currently undergoing maintenance. We'll be back online in a few moments with a smoother experience!"}
                </p>

                {/* Timer Grid */}
                {timeLeft && (
                    <div className="grid grid-cols-3 gap-4 mb-12 max-w-md mx-auto">
                        {['hours', 'minutes', 'seconds'].map((unit) => (
                            <div key={unit} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                <span className="block text-3xl font-black tracking-tighter text-white">
                                    {String(timeLeft[unit]).padStart(2, '0')}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{unit}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {[
                        { icon: ShieldCheck, label: "Verified Security", color: "text-emerald-500" },
                        { icon: Clock, label: "90% Complete", color: "text-blue-500" },
                        { icon: Mail, label: "Support Open", color: "text-pink-500" }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 group transition-all duration-300 hover:bg-white/10 hover:border-white/20">
                            <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{feature.label}</span>
                        </div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                    Expected uptime in {timeLeft ? `${timeLeft.hours}h ${timeLeft.minutes}m` : "approximately 45 minutes"}
                    <span className="block mt-2 text-slate-700 tracking-[0.3em]">Reservice Infrastructure Team</span>
                </div>
            </motion.div>
        </div>
    );
};

export default MaintenancePage;
