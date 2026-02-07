import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, ArrowLeft, Star, Clock, Filter, X } from 'lucide-react';
import { services as staticServices } from '../../data/mockData';
import { useAdmin } from '../../context/AdminContext';
import { Link, useNavigate } from 'react-router-dom';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import MobileServiceDetail from '../Services/MobileServiceDetail';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../../api/client';

const MobileSearchPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCardId, setActiveCardId] = useState(null);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                const [servicesRes, categoriesRes] = await Promise.all([
                    client.get('/services'),
                    client.get('/categories')
                ]);

                if (servicesRes.data.data) {
                    const rawServices = servicesRes.data.data.services || servicesRes.data.data.docs || [];
                    setServices(rawServices);
                }

                if (categoriesRes.data.data) {
                    setCategories(categoriesRes.data.data.categories || []);
                }
            } catch (err) {
                console.error("Failed to fetch search data:", err);
                setServices(staticServices);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicData();
    }, []);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser. Please use Chrome or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSearchQuery(transcript);
        };

        try {
            recognition.start();
        } catch (err) {
            setIsListening(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (window.innerWidth >= 768) return;
                const bestEntry = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (bestEntry && bestEntry.intersectionRatio > 0.55) {
                    const newId = bestEntry.target.dataset.id;
                    setActiveCardId(prev => (prev === newId ? prev : newId));
                }
            },
            {
                threshold: [0, 0.5, 1],
                rootMargin: "-25% 0px -25% 0px"
            }
        );

        const cards = document.querySelectorAll('.search-card');
        cards.forEach((card) => observer.observe(card));
        return () => observer.disconnect();
    }, [searchQuery, services]);

    const activeServices = React.useMemo(() => services.filter(s => s.isActive !== false), [services]);
    const filteredServices = searchQuery.trim() === ''
        ? activeServices.slice(0, 5)
        : activeServices.filter((service) =>
            service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof service.category === 'string'
                ? service.category.toLowerCase().includes(searchQuery.toLowerCase())
                : service.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    return (
        <div className="min-h-screen bg-[#FFFBF2] dark:bg-slate-950 pb-24 font-sans transition-colors duration-300">
            <AnimatePresence>
                {selectedServiceId && (
                    <MobileServiceDetail
                        service={services.find(s => (s._id || s.id) === selectedServiceId) || staticServices.find(s => (s._id || s.id) === selectedServiceId)}
                        onClose={() => setSelectedServiceId(null)}
                    />
                )}
            </AnimatePresence>

            <div className="sticky top-0 z-30 bg-[#FFFBF2] dark:bg-slate-950 p-4 pb-2 transition-shadow md:hidden">
                <div className="flex gap-2 items-center">
                    <div className="flex-1 relative shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-none rounded-2xl bg-white dark:bg-slate-900 border border-rose-50/50 dark:border-slate-800">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-rose-500" />
                        </div>
                        <input
                            type="text"
                            autoFocus
                            className="block w-full pl-10 pr-10 py-3.5 border-none rounded-2xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-900 transition-all text-sm font-medium"
                            placeholder="Try 'Sofa Cleaning'..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center px-2">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={startListening}
                        className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-none flex items-center justify-center active:scale-95 transition-all duration-300
                        ${isListening ? 'border-rose-500 ring-4 ring-rose-500/20 animate-pulse' : 'border-rose-50/50 dark:border-slate-800'}`}
                    >
                        <Mic className={`h-5 w-5 transition-colors duration-300 ${isListening ? 'text-rose-600 fill-rose-100' : 'text-rose-500'}`} />
                    </button>
                </div>

                <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-2">
                    {[{ label: 'All', id: 'All' }, ...categories].map((filter, i) => (
                        <button
                            key={i}
                            onClick={() => navigate('/services', { state: { category: filter.id } })}
                            className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full text-xs font-bold text-gray-600 dark:text-slate-300 whitespace-nowrap shadow-sm hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 transition-all"
                        >
                            {filter.label || filter.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-2 flex flex-col gap-12" ref={scrollContainerRef}>
                <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 pl-1">
                    {filteredServices.length} Results Found
                </div>

                {filteredServices.map(service => {
                    const sId = service._id || service.id;
                    return (
                        <div
                            key={sId}
                            data-id={sId}
                            onClick={() => setSelectedServiceId(sId)}
                            className={`search-card search-card-isolated relative rounded-4xl ring-1 ring-transparent dark:ring-white/5 cursor-pointer active:scale-[0.98] ${String(activeCardId) === String(sId) ? 'scale-[1.02] shadow-2xl' : 'scale-100 shadow-md'}`}
                        >
                            <div className="rounded-4xl overflow-hidden w-full h-full relative z-10 bg-white dark:bg-slate-900 flex p-4 gap-4 isolation-isolate">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-800">
                                    <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight mb-1">{service.title}</h3>
                                            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                {service.rating} <Star className="w-2 h-2 fill-current" />
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Home Services • 45 mins</div>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 line-through">₹{service.price + 200}</span>
                                            <span className="text-base font-black text-gray-900 dark:text-white">₹{service.price}</span>
                                        </div>
                                        <button
                                            className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-rose-600 hover:text-white transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedServiceId(sId);
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <MobileBottomNav />
        </div>
    );
};

export default MobileSearchPage;
