import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, Heart, ChevronDown, ChevronUp, Grid, Hammer, Zap, Refrigerator, Droplets, Truck, Home, Sparkles, ShieldCheck, Paintbrush, Lock, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceCard from '../../components/common/ServiceCard';
import Button from '../../components/common/Button';
import { useBookings } from '../../context/BookingContext';
// import { useAdmin } from '../../context/AdminContext';
import { useUser } from '../../context/UserContext';
import MobileHeader from '../../components/mobile/MobileHeader';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import MobileServiceDetail from '../../pages/Services/MobileServiceDetail';
import BookingModal from '../../components/bookings/BookingModal';
import { useServices, useCategories, usePrefetchService, useOptimisticSaveService } from '../../hooks/useServices';





const ServicesPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addBooking } = useBookings();
    // const { services, categories } = useAdmin(); // REMOVED: AdminContext is now protected
    const { isAuthenticated, savedServices, toggleSavedService } = useUser();

    // Initialize category from state if available
    const [selectedCategory, setSelectedCategory] = useState(location.state?.category || 'All');
    const [searchQuery, setSearchQuery] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000); // Default max price

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const servicesPerPage = 12;

    // Use React Query for data fetching with caching
    const { data: servicesData = {}, isLoading: servicesLoading, error: servicesError } = useServices({
        page: currentPage,
        limit: servicesPerPage,
        search: searchQuery,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        minRating,
        maxPrice
    });
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const prefetchService = usePrefetchService();
    const optimisticSaveService = useOptimisticSaveService();

    const { services = [], pagination = {} } = servicesData;
    const { totalPages = 1, total = 0 } = pagination;

    const isLoading = servicesLoading || categoriesLoading;

    const activeCategories = React.useMemo(() => {
        // 1. Get categories from API
        const apiCats = categories.filter(c => c.isActive !== false);

        // 2. Extract unique categories from actual services
        const serviceCategoryNames = [...new Set(services.map(s => s.category))].filter(Boolean);

        // 3. Create placeholder objects for categories found in services but missing from API
        const additionalCats = serviceCategoryNames
            .filter(name => !apiCats.some(ac =>
                (ac.name && ac.name.toLowerCase() === name.toLowerCase()) ||
                (ac.id && ac.id.toLowerCase() === name.toLowerCase()) ||
                (ac.slug && ac.slug.toLowerCase() === name.toLowerCase())
            ))
            .map(name => ({
                id: name, // Use the name as ID to match service.category precisely
                name: name,
                isActive: true
            }));

        return [...apiCats, ...additionalCats];
    }, [categories, services]);

    const activeServices = React.useMemo(() => services.filter(s => s.isActive !== false), [services]);

    // Update state if location changes
    useEffect(() => {
        if (location.state?.category) {
            setSelectedCategory(location.state.category);
        }
    }, [location.state]);

    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
    const containerRef = useRef(null);
    const [activeCardId, setActiveCardId] = useState(null);
    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
    const [userCoords, setUserCoords] = useState(null);

    // Get User Location for ETA
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserCoords([position.coords.longitude, position.coords.latitude]);
                },
                (error) => console.log("Location access denied or error:", error)
            );
        }
    }, []);

    // Intersection Observer for Mobile Rotating Border
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // Only apply scroll-driven active class on mobile
                if (window.innerWidth >= 768) return;

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveCardId(entry.target.dataset.id); // Keep as string
                        entry.target.classList.add('active');
                    } else {
                        entry.target.classList.remove('active');
                    }
                });
            },
            { threshold: 0.6, rootMargin: "-20% 0px -20% 0px" }
        );

        const cards = document.querySelectorAll('.service-card-item');
        cards.forEach((card) => observer.observe(card));

        return () => observer.disconnect();
    }, [selectedCategory, searchQuery]); // Re-run when list changes

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchQuery, minRating, maxPrice]);

    // Handle back logic
    const handleBack = () => {
        navigate(-1);
    };

    const handleBookClick = (service) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setSelectedService(service);
        // On mobile we might want to go straight to booking or details? 
        // User asked for "cards like this" implying the detail view.
        // Let's open the Mobile Detail view for mobile, and Modal for desktop maybe?
        // Or simpler: Open Mobile Detail view everywhere since it's responsive? 
        // Actually MobileServiceDetail has a "Add to Cart" that could lead to booking.
        // Let's assume on Mobile we open MobileServiceDetail.
        if (window.innerWidth < 768) {
            setIsMobileDetailOpen(true);
        } else {
            setIsModalOpen(true);
        }
    };

    // Prefetch service details on hover
    const handleServiceHover = (service) => {
        const serviceId = service.id || service._id;
        if (serviceId) {
            prefetchService(serviceId);
        }
    };

    // Handle errors gracefully
    if (servicesError) {
        console.error("Failed to fetch services:", servicesError);
    }

    // Optimistic save service handler
    const handleToggleSaveService = (serviceId) => {
        const isCurrentlySaved = savedServices.includes(serviceId);

        // Optimistically update the UI
        optimisticSaveService(serviceId, !isCurrentlySaved);

        // Call the actual toggle function
        toggleSavedService(serviceId);
    };

    const handleConfirmBooking = async (bookingData) => {
        try {
            await addBooking(bookingData);
            setIsModalOpen(false);
            navigate('/bookings');
        } catch (err) {
            // Error handled by context toast
        }
    };

    const getCategoryIcon = (catOrId) => {
        // If passed a category object, check for its icon field first
        const iconName = typeof catOrId === 'object' ? (catOrId.icon || catOrId.name) : catOrId;

        const icons = {
            carpentry: <Hammer className="w-5 h-5" />,
            plumbing: <Droplets className="w-5 h-5" />,
            plumber: <Droplets className="w-5 h-5" />,
            electrical: <Zap className="w-5 h-5" />,
            electrician: <Zap className="w-5 h-5" />,
            homeappliance: <Refrigerator className="w-5 h-5" />,
            appliances: <Refrigerator className="w-5 h-5" />,
            transport: <Truck className="w-5 h-5" />,
            houseshifting: <Home className="w-5 h-5" />,
            cleaning: <Sparkles className="w-5 h-5" />,
            pestcontrol: <ShieldCheck className="w-5 h-5" />,
            gardening: <Droplets className="w-5 h-5" />,
            painting: <Paintbrush className="w-5 h-5" />,
            smarthome: <Lightbulb className="w-5 h-5" />,
            security: <Lock className="w-5 h-5" />,
            carwash: <Droplets className="w-5 h-5" />
        };

        const Icon = iconName ? (icons[iconName.toLowerCase().replace(/\s+/g, '')] || icons[iconName.toLowerCase()] || icons[iconName]) : null;
        return Icon || <Grid className="w-5 h-5" />;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.04,
                delayChildren: 0.02
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                damping: 30,
                stiffness: 500
            }
        }
    };

    const sortedCategories = selectedCategory === 'All'
        ? activeCategories
        : [
            activeCategories.find(c => c.name === selectedCategory),
            ...activeCategories.filter(c => c.name !== selectedCategory)
        ].filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-100 dark:selection:bg-rose-900 overflow-x-hidden pb-24 md:pb-0 transition-colors duration-300 relative">

            {/* Background Decorations - Fixed to cover full viewport including behind header/footer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] bg-size-[24px_24px] opacity-100 dark:opacity-50" />
                <div className="absolute top-0 right-0 w-150 h-150 bg-rose-500/10 dark:bg-rose-500/5 md:bg-blue-500/10 md:dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-150 h-150 bg-slate-300/20 dark:bg-slate-800/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
            </div>

            {/* Mobile Header Removed for cleaner browse experience */}
            {/* <div className="md:hidden relative z-50">
                <MobileHeader className="bg-transparent" />
            </div> */}

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 md:mb-10 animate-item">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Browse Services</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-lg">Connect with {total} top-rated professionals in your area.</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative group w-full md:w-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-500 md:group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search for 'Electrician'..."
                                className="pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 md:focus:ring-blue-500/20 focus:border-rose-500 md:focus:border-blue-500 transition-all w-full md:w-80 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Sidebar Filters (Sticky) */}
                    <div className="lg:col-span-3 space-y-8 h-fit lg:sticky lg:top-24 animate-item hidden lg:block">
                        {/* Categories */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-5">Categories</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCategory === 'All' ? 'border-rose-600 md:border-blue-600' : 'border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-500'}`}>
                                        {selectedCategory === 'All' && <div className="w-2.5 h-2.5 rounded-full bg-rose-600 md:bg-blue-600" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="category"
                                        className="hidden"
                                        checked={selectedCategory === 'All'}
                                        onChange={() => setSelectedCategory('All')}
                                    />
                                    <span className={`text-sm font-medium ${selectedCategory === 'All' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>All Services</span>
                                </label>
                                {sortedCategories.map((cat) => (
                                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCategory === cat.name ? 'border-rose-600 md:border-blue-600' : 'border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-500'}`}>
                                            {selectedCategory === cat.name && <div className="w-2.5 h-2.5 rounded-full bg-rose-600 md:bg-blue-600" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="category"
                                            className="hidden"
                                            checked={selectedCategory === cat.name}
                                            onChange={() => setSelectedCategory(cat.name)}
                                        />
                                        <div className="flex items-center gap-2.5">
                                            <div className={`transition-colors ${selectedCategory === cat.name ? 'text-rose-600 md:text-blue-600' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`}>
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <span className={`text-sm font-medium ${selectedCategory === cat.name ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>{cat.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hidden lg:block">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-5">Price Range</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span>₹0</span>
                                    <span>₹{maxPrice}+</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="5000"
                                    step="100"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                                />
                                <div className="text-center font-bold text-slate-900 dark:text-white">
                                    Up to ₹{maxPrice}
                                </div>
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hidden lg:block">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-5">Rating</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:border-slate-400 dark:group-hover:border-slate-500 ${minRating === 0 ? 'bg-rose-500 border-rose-500 text-white' : ''}`}>
                                        {minRating === 0 && <span className="text-[10px]">✓</span>}
                                    </div>
                                    <input
                                        type="radio"
                                        name="rating"
                                        className="hidden"
                                        checked={minRating === 0}
                                        onChange={() => setMinRating(0)}
                                    />
                                    <span className="font-medium text-slate-600 dark:text-slate-400">All Ratings</span>
                                </label>
                                {[4, 3, 2].map((stars) => (
                                    <label key={stars} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:border-slate-400 dark:group-hover:border-slate-500 ${minRating === stars ? 'bg-rose-500 border-rose-500 text-white' : ''}`}>
                                            {minRating === stars && <span className="text-[10px]">✓</span>}
                                        </div>
                                        <input
                                            type="radio"
                                            name="rating"
                                            className="hidden"
                                            checked={minRating === stars}
                                            onChange={() => setMinRating(stars)}
                                        />
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < stars ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                                                ))}
                                            </div>
                                            <span className="font-medium text-slate-400 dark:text-slate-600">& Up</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Category Pills / Grid Toggle */}
                    <div className="lg:hidden animate-item mb-4 sticky top-0 z-40 -mx-4 px-4 py-3 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Categories</span>
                            <button
                                onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-full active:scale-95 transition-all outline-none"
                            >
                                {isCategoriesExpanded ? (
                                    <><ChevronUp className="w-3 h-3" /> Collapse</>
                                ) : (
                                    <><ChevronDown className="w-3 h-3" /> View All</>
                                )}
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {!isCategoriesExpanded ? (
                                <motion.div
                                    key="pills"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-x-auto pb-4 -mx-4 px-4 flex gap-2 hide-scrollbar"
                                >
                                    <button
                                        onClick={() => setSelectedCategory('All')}
                                        className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'All' ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                    >
                                        All ({activeServices.length})
                                    </button>
                                    {sortedCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.name)}
                                            className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 ${selectedCategory === cat.name ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                                        >
                                            <span className={selectedCategory === cat.name ? 'text-white' : 'text-rose-600'}>
                                                {getCategoryIcon(cat)}
                                            </span>
                                            {cat.name}
                                        </button>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    layout
                                    key="grid"
                                    initial={{ opacity: 0, scale: 0.98, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                                    transition={{ type: 'spring', damping: 30, stiffness: 450 }}
                                    className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-100/40 dark:bg-slate-900/40 rounded-4xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md shadow-inner overflow-hidden mb-6"
                                >
                                    <button
                                        onClick={() => { setSelectedCategory('All'); setIsCategoriesExpanded(false); }}
                                        className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border ${selectedCategory === 'All' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:shadow-md'}`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedCategory === 'All' ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800 text-rose-600'}`}>
                                            <Grid className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-tight">All Services</span>
                                    </button>
                                    {activeCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { setSelectedCategory(cat.name); setIsCategoriesExpanded(false); }}
                                            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border ${selectedCategory === cat.name ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:shadow-md'}`}
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedCategory === cat.name ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800 text-rose-600'}`}>
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">{cat.name}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Grid */}
                    <motion.div
                        layout
                        key={selectedCategory + searchQuery}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="lg:col-span-9"
                    >
                        {isLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                            </div>
                        ) : activeServices.length > 0 ? (
                            <>
                                <div className="filter-services-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                    {activeServices.map((service, idx) => {
                                        const uniqueKey = service.id || service._id || idx;
                                        return (
                                            <motion.div
                                                key={uniqueKey}
                                                variants={itemVariants}
                                                layout
                                                data-id={service.id}
                                                className={`service-card-item relative rounded-4xl shadow-md dark:shadow-black/40 ring-1 ring-transparent dark:ring-white/5 transition-all duration-300 transform scale-100 rotating-border group ${String(activeCardId) === String(service.id) ? 'active' : ''}`}
                                                onMouseEnter={() => handleServiceHover(service)}
                                            >
                                                <div className="rounded-4xl overflow-hidden w-full h-full relative z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 transition-colors isolation-isolate">
                                                    {/* Image Section */}
                                                    <div className="h-56 relative overflow-hidden rounded-t-4xl">
                                                        <img
                                                            src={service.image || service.headerImage}
                                                            alt={service.title}
                                                            crossOrigin="anonymous"
                                                            referrerPolicy="no-referrer"
                                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                        <div className="absolute top-0 inset-x-0 h-16 bg-linear-to-b from-black/50 to-transparent"></div>

                                                        <div className="absolute top-5 left-5">
                                                            <span className="bg-white/90 dark:bg-black/80 backdrop-blur text-black dark:text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                                                                Best Seller
                                                            </span>
                                                        </div>
                                                        <div className="absolute top-5 right-5 flex flex-col gap-2">

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleSaveService(service.id || service._id);
                                                                }}
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${savedServices.includes(service.id || service._id) ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white/20 backdrop-blur text-white hover:bg-white/40'}`}
                                                            >
                                                                <Heart className={`w-4 h-4 ${savedServices.includes(service.id || service._id) ? 'fill-current' : ''}`} />
                                                            </button>
                                                        </div>

                                                        {/* ETA Badge */}
                                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white flex items-center gap-1 z-20">
                                                            {(() => {
                                                                const techCoords = service.technician?.technicianProfile?.location?.coordinates;
                                                                if (!userCoords || !techCoords) return <span className="text-gray-300">Enable Location for ETA</span>;

                                                                const toRad = (value) => (value * Math.PI) / 180;
                                                                const R = 6371; // km
                                                                const [lon1, lat1] = userCoords;
                                                                const [lon2, lat2] = techCoords;

                                                                const dLat = toRad(lat2 - lat1);
                                                                const dLon = toRad(lon2 - lon1);
                                                                const a =
                                                                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                                                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                                                                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                                                const distance = parseFloat((R * c).toFixed(1));
                                                                const eta = Math.ceil((distance / 30) * 60 + 10);

                                                                return (
                                                                    <>
                                                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                                                        <span>{eta} min ({distance} km)</span>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Text Content */}
                                                    <div className="p-5">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">{service.title}</h3>
                                                            <div className="bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                                                                {service.rating > 0 ? (
                                                                    <>
                                                                        {service.rating} <Star className="w-2.5 h-2.5 fill-current" />
                                                                    </>
                                                                ) : (
                                                                    "New"
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-1.5 text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
                                                            <SlidersHorizontal className="w-3.5 h-3.5" />
                                                            <span>{service.category}</span>
                                                            <span className="mx-1">•</span>
                                                            <span>Home Services</span>
                                                        </div>

                                                        <div className="flex items-center justify-between border-t border-dashed border-gray-100 dark:border-slate-800 pt-4 gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase line-through">₹{service.price + 300}</span>
                                                                <span className="text-lg font-black text-gray-900 dark:text-white">₹{service.price}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/services/${service.id || service._id}`);
                                                                    }}
                                                                    className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors border border-transparent"
                                                                >
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleBookClick(service);
                                                                    }}
                                                                    className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-rose-600 hover:text-white transition-colors"
                                                                >
                                                                    Book Now
                                                                </button>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mt-8 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Previous
                                        </button>

                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No services found</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                                    We couldn't find any services matching "<span className="font-medium text-slate-900 dark:text-white">{searchQuery}</span>". Try changing your filters.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setMinRating(0); setMaxPrice(5000); }}
                                    className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div >

            {/* Mobile Bottom Nav */}
            < div className="md:hidden" >
                <MobileBottomNav />
            </div >

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                service={selectedService}
                onConfirm={handleConfirmBooking}
            />

            {
                isMobileDetailOpen && selectedService && (
                    <MobileServiceDetail
                        service={selectedService}
                        onClose={() => setIsMobileDetailOpen(false)}
                    />
                )
            }
        </div >
    );
};

export default ServicesPage;
