import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, ArrowRight, Star, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// import { useAdmin } from '../../context/AdminContext';
import MobileHeader from '../../components/mobile/MobileHeader';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
// import MobileServiceDetail from '../../pages/Services/MobileServiceDetail';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

const MobileHomePage = ({ services = [], categories = [] }) => {
  const [heroSlides, setHeroSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const navigate = useNavigate();

  // Fetch Hero Slides from Backend
  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const res = await client.get('/heroes/public');
        if (res.data.status === 'success') {
          setHeroSlides(res.data.data.heroes || []);
        }
      } catch (err) {
        console.error("Failed to fetch heroes:", err);
      }
    };
    fetchHeroes();
  }, []);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides]);

  // Auto-cycle categories scale effect (only if no filter selected)
  useEffect(() => {
    if (activeCategoryFilter !== 'All') return;
    const interval = setInterval(() => {
      setActiveCategoryIndex((prev) => (prev + 1) % 8);
    }, 1500);
    return () => clearInterval(interval);
  }, [activeCategoryFilter]);

  // Handle Categories Rotation (Interchange)
  useEffect(() => {
    const activeCategories = categories.filter(c => c.isActive !== false);
    if (activeCategories.length <= 8) return;

    const rotationInterval = setInterval(() => {
      setRotationIndex((prev) => (prev + 4) % activeCategories.length);
    }, 30000); // Rotate every 30 seconds

    return () => clearInterval(rotationInterval);
  }, [categories]);

  const getVisibleCategories = () => {
    const activeCategories = categories.filter(c => c.isActive !== false);
    if (activeCategories.length <= 8) return activeCategories;

    const visible = [];
    for (let i = 0; i < 8; i++) {
      const index = (rotationIndex + i) % activeCategories.length;
      visible.push(activeCategories[index]);
    }
    return visible;
  };

  const [activeCardId, setActiveCardId] = useState(null);

  // Intersection Observer for Zoom Effect
  const observerRef = useRef(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      // Home-Specific: Elegant center capture for tall cards
      const bestEntry = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (bestEntry && bestEntry.intersectionRatio > 0.4) {
        const newId = bestEntry.target.dataset.id; // Keep as string
        setActiveCardId(prev => (prev === newId ? prev : newId));
      }
    }, {
      threshold: [0.4, 0.6], // Only trigger when significantly visible
      rootMargin: "-20% 0px -20% 0px" // Focus area is the vertical center 60% of screen
    });

    const cards = document.querySelectorAll('.zoom-card');
    cards.forEach(card => observerRef.current.observe(card));

    return () => observerRef.current.disconnect();
  }, [services]);

  const handleHeroClick = (slide) => {
    if (slide.serviceId) {
      setSelectedServiceId(slide.serviceId);
    }
  };

  const handleCategoryClick = (categoryId) => {
    // Redirect to Services page with strict filtering
    navigate('/services', { state: { category: categoryId } });
  };

  // Show only 7 services on Home Page as requested
  const displayedServices = React.useMemo(() => services.filter(s => s.isActive !== false).slice(0, 7), [services]);

  return (
    <div className="min-h-screen bg-transparent dark:bg-slate-950 pb-24 font-sans">
      {/* MobileServiceDetail removed as we navigate to page now */}

      <MobileHeader />

      <main className="relative px-2 pt-2">
        {/* Immersive Hero Section */}
        {heroSlides.length > 0 && (
          <section
            className="relative h-[65vh] w-full overflow-hidden rounded-[2.5rem] shadow-2xl z-0 cursor-pointer active:scale-[0.98] transition-all duration-300"
            onClick={() => handleHeroClick(heroSlides[currentSlide])}
          >
            <AnimatePresence mode="popLayout">
              <motion.img
                key={currentSlide}
                src={heroSlides[currentSlide]?.image}
                alt="Hero"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
              />
            </AnimatePresence>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

            {/* Hero Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 pb-12 flex flex-col gap-2 z-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="inline-block px-3 py-1 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-3 shadow-lg shadow-rose-500/30">
                  Premium Services
                </span>
                <h1 className="text-4xl font-black text-white leading-none mb-2 tracking-tight">
                  {heroSlides[currentSlide]?.title}
                </h1>
                <p className="text-slate-200 text-lg font-medium opacity-90">
                  {heroSlides[currentSlide]?.subtitle}
                </p>
              </motion.div>

              {/* Glassmorphic Search Bar */}
              <motion.div
                className="mt-6 relative"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent hero click
                  navigate('/search');
                }}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  readOnly
                  className="block w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium text-sm shadow-xl cursor-text"
                  placeholder="What can we help you with?"
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* Categories Grid */}
        <section className="px-5 -mt-8 relative z-10">
          <motion.div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Categories
              </h3>
              <span className="text-xs font-semibold text-rose-500 flex items-center cursor-pointer" onClick={() => navigate('/services')}>View All <ArrowRight className="w-3 h-3 ml-1" /></span>
            </div>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2 relative min-h-40">
              <AnimatePresence mode="popLayout" initial={false}>
                {getVisibleCategories().map((cat, idx) => {
                  const isAutoActive = idx === activeCategoryIndex;

                  return (
                    <motion.div
                      key={cat._id || cat.id}
                      layout
                      className="flex flex-col items-center gap-2 cursor-pointer"
                      initial={{ opacity: 0, x: 20, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 30,
                        mass: 1,
                        delay: idx * 0.03
                      }}
                      onClick={() => handleCategoryClick(cat._id || cat.id)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-700
                        ${isAutoActive ? 'scale-110 border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900 shadow-lg' : ''}`}>
                        <img src={cat.image} className="w-full h-full object-cover opacity-90" alt={cat.name} />
                      </div>
                      <span className={`text-[10px] font-bold text-center leading-3 transition-colors duration-500 ${isAutoActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>{cat.name}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* Popular Services - Scroll-Linked Animation */}
        <section className="px-3 mt-8 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-5 flex items-center gap-2 px-2">
            <Sparkles className="w-5 h-5 text-amber-400 fill-current" />
            Top Rated Services
          </h2>

          <div className="flex flex-col gap-8 min-h-75">
            {displayedServices.map((service, idx) => {
              const uniqueKey = service.id || service._id || idx;
              const isActive = String(activeCardId) === String(service._id || service.id);

              return (
                <motion.div
                  key={uniqueKey}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.4,
                      duration: 0.8
                    }
                  }}
                  viewport={{ once: true, margin: "-10%" }}
                  onClick={() => navigate(`/services/${service._id || service.id}`)}
                  className={`zoom-card rotating-border-home relative rounded-4xl cursor-pointer mb-8 group ${isActive ? 'active' : ''}`}
                  style={{
                    '--border-color-1': '#f43f5e', // Rose 500
                    '--border-color-2': '#fbbf24', // Amber 400
                    '--glow-color': 'rgba(244, 63, 94, 0.4)'
                  }}
                  data-id={service._id || service.id}
                >
                  <div className="rounded-4xl overflow-hidden w-full h-full relative z-10 bg-white dark:bg-slate-900 shadow-xl dark:shadow-slate-900/50 border border-rose-100 dark:border-rose-500/20">
                    {/* Image Section */}
                    <div className="h-72 relative overflow-hidden rounded-t-4xl">
                      <img
                        src={service.headerImage || service.image || 'https://images.unsplash.com/photo-1581578731117-104f2a41d58e?auto=format&fit=crop&q=80'}
                        alt={service.title}
                        className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${isActive ? 'scale-110' : 'scale-100'} group-hover:scale-110`}
                      />
                      <div className="absolute top-0 inset-x-0 h-16 bg-linear-to-b from-black/50 to-transparent"></div>
                      <div className="absolute top-5 left-5">
                        <span className="bg-white/90 dark:bg-black/80 backdrop-blur text-black dark:text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                          Best Seller
                        </span>
                      </div>
                      {/* Removed Star from top right as requested */}
                    </div>

                    {/* Text Content */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{service.title}</h3>
                        {service.rating > 0 && (
                          <div className="bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                            {service.rating}
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
                        <Clock className="w-3.5 h-3.5" />
                        <span>45 Mins</span>
                        <span className="mx-1">•</span>
                        <span>Home Services</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-dashed border-gray-100 dark:border-slate-800 pt-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase line-through">₹{service.price + 300}</span>
                          <span className="text-2xl font-black text-gray-900 dark:text-white">₹{service.price}</span>
                        </div>
                        <button className="bg-rose-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/25 active:scale-95">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div >
  );
};

export default MobileHomePage;
