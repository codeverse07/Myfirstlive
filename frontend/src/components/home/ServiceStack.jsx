import React, { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WorkerCharacter from './WorkerCharacter';
import { Hammer, Zap, Refrigerator, Droplets, Truck, Home, Sparkles, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
    Hammer,
    Zap,
    Refrigerator,
    Droplets,
    Truck,
    Home,
    Sparkles,
    ShieldCheck
};

const ServiceStack = ({ categories = [] }) => {
    const containerRef = useRef(null);
    const workerRef = useRef(null);
    // Safety check for empty categories
    const safeCategories = categories.length > 0 ? categories : [];
    const [activeCardId, setActiveCardId] = useState(safeCategories[0]?.id || null);


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
                    onEnter: () => setActiveCardId(safeCategories[index].id),
                    onEnterBack: () => setActiveCardId(safeCategories[index].id),
                });
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full min-h-screen bg-slate-50 py-20 px-4 md:px-10">

            {/* Header */}
            <div className="text-center mb-40 relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Our Services</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">Expert solutions for every corner of your home.</p>
            </div>

            {/* Stack Container */}
            <div className="max-w-4xl mx-auto relative pb-10">
                {/* Worker Sticky Container */}
                {/* 
                    Cards are sticky top-60 (240px). 
                    Worker was -top-[174px] relative to card.
                    So Worker top should be 240px - 174px = 66px.
                    We use a zero-height container so it doesn't affect flow, 
                    but allows the worker to 'sit' there.
                */}
                <div className="sticky top-[68px] z-0 h-0 w-full pointer-events-none mb-0">
                    <div ref={workerRef} className="absolute left-1/2 -translate-x-1/2 -top-24 w-[400px] transform">
                        <WorkerCharacter pose="holding" mood="happy" className="drop-shadow-2xl" />
                    </div>
                </div>

                {safeCategories.map((cat, index) => {
                    const isActive = activeCardId === cat.id;
                    const Icon = iconMap[cat.icon];

                    // Parsing color for custom styling
                    // cat.color usually looks like 'bg-orange-100 text-orange-600'
                    // We'll extract the base color name (e.g., 'orange') for dynamic classes
                    const colorName = cat.color.includes('orange') ? 'orange' :
                        cat.color.includes('blue') ? 'blue' :
                            cat.color.includes('cyan') ? 'cyan' :
                                cat.color.includes('yellow') ? 'yellow' :
                                    cat.color.includes('green') ? 'emerald' :
                                        cat.color.includes('purple') ? 'violet' : 'slate';

                    return (
                        <div
                            key={cat.id}
                            className={`service-card sticky top-60 mb-20 w-full rounded-[2.5rem] shadow-2xl transition-all duration-500 z-40 group overflow-hidden bg-white ring-1 ring-slate-200/50 hover:ring-4 hover:ring-${colorName}-100`}
                        >
                            <div className="flex flex-col md:flex-row h-full">
                                {/* Left Content Section */}
                                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                                    {/* Ambient Gradient Background */}
                                    <div className={`absolute -top-20 -left-20 w-64 h-64 bg-${colorName}-50 rounded-full blur-3xl opacity-60 pointer-events-none`}></div>
                                    <div className={`absolute bottom-0 right-0 w-64 h-64 bg-${colorName}-50 rounded-full blur-3xl opacity-30 pointer-events-none`}></div>

                                    <div className="relative z-10">
                                        {/* Icon Badge */}
                                        <div className={`w-16 h-16 rounded-2xl bg-${colorName}-50 flex items-center justify-center mb-6 shadow-sm`}>
                                            {Icon && <Icon className={`w-8 h-8 text-${colorName}-600`} strokeWidth={1.5} />}
                                        </div>

                                        <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
                                            {cat.name}
                                        </h3>
                                        <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
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
                                    {/* Overlay Gradient for Text readability if needed, or just style */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent md:bg-linear-to-l md:from-transparent md:to-black/5"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* "Curtain" to physically cover the worker if he lingers */}
            <div className="relative w-full h-80 rounded-4xl bg-slate-800 z-10 -mt-40 pointer-events-none"></div>
        </div>
    );
};

export default ServiceStack;
