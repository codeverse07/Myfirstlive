import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, ArrowLeft, Star, Clock, Filter, X } from 'lucide-react';
import { services as staticServices } from '../../data/mockData';
import { useAdmin } from '../../context/AdminContext';
import { Link, useNavigate } from 'react-router-dom';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
// import MobileServiceDetail from '../Services/MobileServiceDetail';
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

    const startListening = async () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser. Please use Chrome or Safari.");
            return;
        }

        // Voice search REQUIRES a secure context (localhost or HTTPS)
        if (!window.isSecureContext) {
            alert("Security Error: Mic search only works on 'localhost' or 'HTTPS'. \n\nPlease use http://localhost:5175 in your browser.");
            return;
        }

        // Force a permission check first
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Close track immediately
        } catch (err) {
            console.error("Mic Permission Blocked:", err);
            alert("Mic Access Blocked! \n\n1. Click the 'Lock/Settings' icon in the URL bar.\n2. Set Microphone to 'Allow'.\n3. Refresh the page.");
            return;
        }

        const recognition = new SpeechRecognition();

        // Configuration for better accuracy
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log("Voice recognition started");
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            setSearchQuery(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert("Permission Error: Please ensure you have clicked 'Allow' when prompted.");
            }
        };

        recognition.onend = () => {
            console.log("Voice recognition ended");
            setIsListening(false);
        };

        try {
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        } catch (err) {
            console.error("Speech initiation error:", err);
            setIsListening(false);
        }
    };

    // Intersection observer removed to prevent shifting and dynamic shadow changes

    const activeServices = React.useMemo(() => services.filter(s => s.isActive !== false), [services]);
    const filteredServices = searchQuery.trim() === ''
        ? []
        : activeServices.filter((service) =>
            service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof service.category === 'string'
                ? service.category.toLowerCase().includes(searchQuery.toLowerCase())
                : service.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    return (
        <div className="min-h-screen bg-[#FFFBF2] dark:bg-slate-950 pb-24 font-sans transition-colors duration-300">
            {/* Header / Search Top Bar */}
            <div className="sticky top-0 z-30 bg-[#FFFBF2]/80 dark:bg-slate-950/80 backdrop-blur-lg px-5 py-4 border-b border-rose-100 dark:border-slate-800">
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-all">
                        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                    </button>

                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-4 flex items-center">
                            <Search className="h-5 w-5 text-rose-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="What are you looking for?"
                            className="w-full h-full pl-12 pr-10 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 focus:border-rose-300 dark:focus:border-rose-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 dark:focus:ring-rose-500/5 text-sm font-bold text-gray-900 dark:text-white transition-all shadow-sm shadow-rose-500/5 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <AnimatePresence>
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center px-2">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </AnimatePresence>
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
                            {filter.label || filter.name || filter.id}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-2 flex flex-col gap-12" ref={scrollContainerRef}>
                {filteredServices.map(service => {
                    const sId = service._id || service.id;
                    return (
                        <div
                            key={sId}
                            data-id={sId}
                            onClick={() => navigate(`/services/${sId}`)}
                            className="search-card search-card-isolated relative rounded-4xl ring-1 ring-transparent dark:ring-white/5 cursor-pointer shadow-sm"
                        >
                            <div className="rounded-4xl overflow-hidden w-full h-full relative z-10 bg-white dark:bg-slate-900 flex p-4 gap-4 isolation-isolate">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-800">
                                    <img
                                        src={service.headerImage || service.image || 'https://images.unsplash.com/photo-1581578731117-104f2a41d58e?auto=format&fit=crop&q=80&w=400'}
                                        alt={service.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight mb-1">{service.title}</h3>
                                            {service.rating > 0 && (
                                                <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                    {service.rating} <Star className="w-2 h-2 fill-current" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Home Services • 45 mins</div>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 line-through">₹{service.price + 200}</span>
                                            <span className="text-base font-black text-gray-900 dark:text-white">₹{service.price}</span>
                                        </div>
                                        <button
                                            className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-rose-600 hover:text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/services/${sId}`);
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
            </div >

            <MobileBottomNav />
        </div >
    );
};

export default MobileSearchPage;
