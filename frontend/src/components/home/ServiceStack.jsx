import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCategories } from '../../hooks/useServices';
import { useNavigate } from 'react-router-dom';
import WorkerCharacter from './WorkerCharacter';
import { Hammer, Zap, Refrigerator, Droplets, Truck, Home } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
    Hammer,
    Zap,
    Refrigerator,
    Droplets,
    Truck,
    Home
};

const TypingEffect = ({ phrases }) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(100);

    useEffect(() => {
        const handleTyping = () => {
            const currentPhrase = phrases[currentPhraseIndex];
            const shouldDelete = isDeleting;

            if (!shouldDelete && displayedText !== currentPhrase) {
                // Typing
                setDisplayedText(currentPhrase.substring(0, displayedText.length + 1));
                setTypingSpeed(50 + Math.random() * 50);
            } else if (shouldDelete && displayedText !== '') {
                // Deleting
                setDisplayedText(currentPhrase.substring(0, displayedText.length - 1));
                setTypingSpeed(30);
            } else if (!shouldDelete && displayedText === currentPhrase) {
                // Wait before deleting
                setTimeout(() => setIsDeleting(true), 2500);
            } else if (shouldDelete && displayedText === '') {
                // Move to next phrase
                setIsDeleting(false);
                setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, currentPhraseIndex, phrases, typingSpeed]);

    return (
        <div className="flex items-center gap-2">
            <span className="text-xl md:text-3xl font-bold text-slate-100/90 leading-tight">
                {displayedText}
            </span>
            <span className="w-1.5 h-8 md:h-10 bg-indigo-500 animate-pulse rounded-full shrink-0"></span>
        </div>
    );
};

const ServiceStack = () => {
    const containerRef = useRef(null);
    const workerRef = useRef(null);
    const { data: categories = [] } = useCategories();
    const [activeCardId, setActiveCardId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (categories && categories.length > 0) {
            setActiveCardId(categories[0].id || categories[0]._id);
        }
    }, [categories]);

    const promises = [
        "we assure you the 30 day guarantee of our services performed",
        "only background-verified and expert technicians at your doorstep",
        "quality service at transparent and upfront pricing"
    ];

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.service-card');

            // Initial Worker State: Hidden and pushed down
            gsap.set(workerRef.current, { y: 100, opacity: 0 });

            // Worker Entrance Animation
            // Trigger when the first card hits the sticky position (top-60 = 240px)
            ScrollTrigger.create({
                trigger: cards[0], // Monitor the first card
                start: "top 240px", // When card top hits 240px from viewport top
                end: "bottom center", // Keep it active (or manage exit separately)
                onEnter: () => {
                    gsap.to(workerRef.current, {
                        y: 0,
                        opacity: 1,
                        duration: 0.6,
                        ease: "back.out(1.7)",
                        overwrite: true
                    });
                },
                onLeaveBack: () => {
                    gsap.to(workerRef.current, {
                        y: 100,
                        opacity: 0,
                        duration: 0.4,
                        ease: "power2.in",
                        overwrite: true
                    });
                }
            });

            // Worker Exit Animation
            // Trigger start descent specifically from the 4th card (index 3) as requested
            if (cards.length > 3) {
                ScrollTrigger.create({
                    trigger: cards[3], // The 4th card
                    start: "top 75%", // Start EARLIER (as card enters bottom of screen)
                    end: "bottom top",
                    scrub: 0.5, // Slight smoothing for physics feel
                    animation: gsap.to(workerRef.current, {
                        y: 1200, // Faster/Deeper drop
                        scale: 0.8, // Fall "away" slightly
                        opacity: 0,
                        ease: "none"
                    })
                });
            } else {
                // Fallback if fewer cards
                ScrollTrigger.create({
                    trigger: containerRef.current,
                    start: "bottom 85%",
                    end: "bottom 50%",
                    scrub: 1,
                    animation: gsap.to(workerRef.current, {
                        y: 150,
                        opacity: 0,
                        ease: "power1.in"
                    })
                });
            }

            cards.forEach((card, index) => {
                ScrollTrigger.create({
                    trigger: card,
                    start: "top center", // When card hits center
                    end: "bottom center",
                    onEnter: () => setActiveCardId(categories[index].id || categories[index]._id),
                    onEnterBack: () => setActiveCardId(categories[index].id || categories[index]._id),
                });
            });

        }, containerRef);

        return () => ctx.revert();
    }, [categories]); // Re-run if categories change

    return (
        <div ref={containerRef} className="relative w-full min-h-screen bg-slate-50 dark:bg-slate-950 py-20 px-4 md:px-10 transition-colors duration-300">

            {/* Header */}
            <div className="text-center mb-40 relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">Our Services</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors">Expert solutions for every corner of your home.</p>
            </div>

            {/* Stack Container */}
            <div className="max-w-4xl mx-auto relative pb-10">
                <div className="sticky top-[68px] z-0 h-0 w-full pointer-events-none mb-0">
                    <div ref={workerRef} className="absolute left-1/2 -translate-x-1/2 -top-24 w-[400px] transform">
                        <WorkerCharacter pose="holding" mood="happy" className="drop-shadow-2xl" />
                    </div>
                </div>

                {categories.map((cat, index) => {
                    const isActive = activeCardId === (cat.id || cat._id);
                    const Icon = iconMap[cat.icon] || Home;

                    const colorName = cat.color?.includes('orange') ? 'orange' :
                        cat.color?.includes('blue') ? 'blue' :
                            cat.color?.includes('cyan') ? 'cyan' :
                                cat.color?.includes('yellow') ? 'yellow' :
                                    cat.color?.includes('green') ? 'emerald' :
                                        cat.color?.includes('purple') ? 'violet' : 'slate';

                    return (
                        <div
                            key={cat.id || cat._id}
                            onClick={() => navigate('/services', { state: { category: cat.name } })}
                            className={`service-card sticky top-60 mb-20 w-full rounded-[2.5rem] shadow-2xl transition-all duration-500 z-40 group overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200/50 dark:ring-slate-800/50 hover:ring-4 hover:ring-${colorName}-100 dark:hover:ring-${colorName}-900/30 cursor-pointer`}
                        >
                            <div className="flex flex-col md:flex-row h-full">
                                {/* Left Content Section */}
                                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                                    {/* Ambient Gradient Background */}
                                    <div className={`absolute -top-20 -left-20 w-64 h-64 bg-${colorName}-50 dark:bg-${colorName}-900/10 rounded-full blur-3xl opacity-60 pointer-events-none`}></div>
                                    <div className={`absolute bottom-0 right-0 w-64 h-64 bg-${colorName}-50 dark:bg-${colorName}-900/10 rounded-full blur-3xl opacity-30 pointer-events-none`}></div>

                                    <div className="relative z-10">
                                        {/* Icon Badge */}
                                        <div className={`w-16 h-16 rounded-2xl bg-${colorName}-50 dark:bg-${colorName}-900/20 flex items-center justify-center mb-6 shadow-sm`}>
                                            {Icon && <Icon className={`w-8 h-8 text-${colorName}-600 dark:text-${colorName}-400`} strokeWidth={1.5} />}
                                        </div>

                                        <h3 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight leading-tight transition-colors">
                                            {cat.name}
                                        </h3>
                                        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-md transition-colors">
                                            {cat.description}
                                        </p>

                                        <button className={`group/btn flex items-center gap-3 px-8 py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-${colorName}-600 transition-all duration-300 w-fit drop-shadow-lg`}>
                                            <span>Book Now</span>
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Right Image Section */}
                                <div className="relative h-64 md:h-auto md:w-5/12 overflow-hidden">
                                    <div className="absolute inset-0 bg-slate-200">
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent md:bg-linear-to-l md:from-transparent md:to-black/5"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* "Curtain" to physically cover the worker if he lingers */}
            <div className="relative w-full h-[400px] md:h-[500px] rounded-[3rem] md:rounded-[4rem] bg-slate-900 z-10 -mt-20 md:-mt-40 pointer-events-none overflow-hidden shadow-2xl flex items-center justify-center px-10 border border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),transparent)]"></div>
                <div className="max-w-3xl text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Our Promise</span>
                    </div>
                    <TypingEffect phrases={promises} />
                </div>
            </div>
        </div>
    );
};

export default ServiceStack;
