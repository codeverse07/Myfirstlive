import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Search, ArrowRight, ShieldCheck, Clock, Award, Hammer, Zap, Refrigerator, Droplets, Truck, Calendar, Map, CheckCircle } from 'lucide-react';
// import { useAdmin } from '../../context/AdminContext';
import ServiceCard from '../../components/common/ServiceCard';
import ServiceStack from '../../components/home/ServiceStack';
import Button from '../../components/common/Button';
import Particles from '../../react-bit/Particle';
import BookingModal from '../../components/bookings/BookingModal';
import { useBookings } from '../../context/BookingContext';
import { useNavigate } from 'react-router-dom';
import { useServices, useCategories } from '../../hooks/useServices';

import promoImg from '../../assets/images/fridge-repair.png';
import MobileHomePage from './MobileHomePage';
import SplitText from '../../react-bit/SplitText';
import TextType from '../../react-bit/TextType';
import SupermanTechnician from '../../components/home/SupermanTechnician';
import { motion, AnimatePresence } from 'framer-motion';
// import MobileServiceDetail from '../Services/MobileServiceDetail';


const iconMap = {
  Hammer,
  Zap,
  Refrigerator,
  Droplets,
  Truck
};

const placeholders = [
  "AC Repair",
  "Washing Machine Fix",
  "Electrician Near Me",
  "Plumber in 10 Mins"
];

const particleColors = ['#ffffff', '#aaacb9'];



const HomePage = () => {
  const { data: categories = [] } = useCategories();
  const { data: servicesData, isLoading: servicesLoading } = useServices({ limit: 10 });
  const services = servicesData?.services || [];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typingStep, setTypingStep] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { addBooking } = useBookings();
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false); // Kept to avoid breaking references temporarily

  const handleBookClick = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleDetailsClick = (service) => {
    navigate(`/services/${service.id || service._id}`);
  };

  const handleConfirmBooking = (bookingData) => {
    addBooking(bookingData);
    setIsModalOpen(false);
    navigate('/bookings');
  };

  useGSAP(() => {
    gsap.from(".animate-item", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (typingStep === 3) {
      gsap.fromTo(".book-btn",
        { x: -50, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(".explore-btn",
        { x: 50, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(".trust-item",
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, delay: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, { scope: containerRef, dependencies: [typingStep] });

  useGSAP(() => {
    // Superman Animation Sequence
    // Initial Entrance (runs on load)
    gsap.fromTo(".superman-container",
      { y: "100vh" },
      { y: 0, duration: 1.5, ease: "power3.out" }
    );

    // Initial Idle Float
    gsap.to(".superman-container", {
      y: -20,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1.5 // Start after entrance
    });

  }, { scope: containerRef });



  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      setFadeKey((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Force scroll to top on mount and prevent browser restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Optional: restoration cleanup if navigating away (though manual is often desired for single-page apps on refresh)
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!overlayRef.current) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate opacity: 1 at top, fades to 0 as you scroll one screen height
      // We start fading immediately
      const opacity = Math.max(0, 1 - (scrollY / (windowHeight * 0.8)));

      overlayRef.current.style.opacity = opacity;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call to set correct state
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isMobile) {
    return (
      <AnimatePresence mode="wait">
        <MobileHomePage key="mobile-home" services={services} categories={categories} />
      </AnimatePresence>
    );
  }

  return (
    <>
      <div className="relative min-h-screen">
        {/* Dynamic Background System */}
        <div className="fixed inset-0 bg-transparent dark:bg-slate-950 z-0" />
        <div
          ref={overlayRef}
          className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-75 ease-linear"
          style={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-[#020617]" />
          <Particles
            particleCount={300}
            particleSpread={10}
            speed={1}
            particleColors={particleColors}
            moveParticlesOnHover={true}
            particleHoverFactor={2}
            alphaParticles={true}
            particleBaseSize={200}
            sizeRandomness={1}
            cameraDistance={20}
            className="absolute inset-0"
          />
        </div>

        {/* Main Content Wrapper - z-10 puts it above the fixed background */}
        <div ref={containerRef} className="relative z-10 flex flex-col gap-16 pb-16">
          {/* Hero Section */}
          <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-20 overflow-hidden animate-item">
            {/* Animated Background Shapes - Minimal & Subtle */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-slate-600 rounded-full blur-3xl animate-blob"></div>
              <div className="absolute top-1/3 right-0 w-80 h-80 bg-slate-700 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-slate-600 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Superman Technician - Moved outside the text container for full-width positioning */}
            <div className="superman-container absolute left-[2%] md:left-[5%] lg:left-[10%] top-32 md:top-48 w-80 lg:w-96 h-[28rem] lg:h-[32rem] z-20 hidden md:block pointer-events-none">
              <SupermanTechnician />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[1.1]">
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
                  Home Services,
                </span> <br className="hidden md:block" />
                <span className="relative inline-block mt-2">
                  {/* "On-demand!" with a vibrant cyan/blue gradient text effect */}
                  <SplitText
                    text="On-demand!"
                    className="text-5xl md:text-7xl font-black text-cyan-400 inline-block pb-2 drop-shadow-lg"
                    delay={50}
                    duration={1.25}
                    ease="power3.out"
                    splitType="chars"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0.1}
                    rootMargin="-100px"
                    textAlign="center"
                    showCallback
                  />
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                <TextType
                  text="Expert professionals for all your home repair needs."
                  typingSpeed={10}
                  loop={false}
                  showCursor={typingStep === 0}
                  onSentenceComplete={() => setTypingStep(1)}
                  cursorCharacter="|"
                  className="inline whitespace-pre-wrap"
                  as="span"
                />
                <br className="hidden md:block" />
                {typingStep >= 1 && (
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-sm">
                    <TextType
                      text="Quick, reliable, and affordable"
                      typingSpeed={10}
                      loop={false}
                      showCursor={typingStep === 1}
                      onSentenceComplete={() => setTypingStep(2)}
                      cursorCharacter="|"
                      className="inline whitespace-pre-wrap"
                      as="span"
                    />
                  </span>
                )}
                {typingStep >= 2 && (
                  <TextType
                    text=" services at your doorstep."
                    typingSpeed={10}
                    loop={false}
                    showCursor={true}
                    cursorCharacter="|"
                    className="inline whitespace-pre-wrap"
                    as="span"
                    onSentenceComplete={() => setTypingStep(3)}
                  />
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto mb-12">
                <Link to="/bookings" className="book-btn invisible">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 shadow-xl border border-transparent rounded-full px-8 py-4 h-auto text-base font-bold transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>Book a Service</span>
                    </div>
                  </Button>
                </Link>
                <Link to="/services" className="explore-btn invisible">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-white/5 hover:text-white hover:border-white rounded-full px-8 py-4 h-auto text-base font-medium backdrop-blur-sm transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      <span>Explore Services</span>
                    </div>
                  </Button>
                </Link>
              </div>

              {/* Premium Trust Signals */}
              <div className="flex flex-wrap justify-center gap-4 mt-12">
                {[
                  { icon: Clock, text: "90 min Arrival" },
                  { icon: ShieldCheck, text: "Verified Experts" },
                  { icon: Award, text: "30-Day Warranty" }
                ].map((item, idx) => (
                  <div key={idx} className="trust-item invisible flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 px-5 py-2.5 rounded-full hover:bg-slate-800/50 transition-colors duration-300 cursor-default">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Teaser */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 relative z-20 animate-item">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: Map, title: "1. Choose Service", desc: "Select from 50+ services" },
                { icon: Calendar, title: "2. Book Instantly", desc: "Pick a time that works" },
                { icon: CheckCircle, title: "3. Technician Arrives", desc: "Track pro in real-time" }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 dark:group-hover:bg-rose-600 transition-colors duration-300 border border-slate-100 dark:border-slate-700">
                    <step.icon className="w-7 h-7 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Categories Section - ScrollStack */}
          <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24">
            <ServiceStack />
          </section>

          {/* Popular Services Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-item">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Most Popular Services</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Booked by thousands of customers</p>
              </div>
              <Link to="/services">
                <Button variant="ghost" className="hidden sm:flex text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" size="sm">
                  View All <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 3).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={handleBookClick}
                  onDetails={handleDetailsClick}
                />
              ))}
            </div>
          </section>



          {/* Promotional Banner */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-item">
            <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-10 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left shadow-2xl">
              <div className="relative z-10 max-w-lg">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Broken Appliance? <br />We Fix It Fast.</h2>
                <p className="text-slate-400 mb-8 text-lg font-light leading-relaxed">Expert technicians for AC, Plumbing, Electrical & more. <br />Get <span className="font-semibold text-white">20% off</span> your first service.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <div className="bg-white/10 backdrop-blur-sm px-6 py-3.5 rounded-xl border border-white/10 text-slate-200 font-mono tracking-wider text-center select-all">
                    NEWUSER20
                  </div>
                  <Link to="/bookings">
                    <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 border-none shadow-xl cursor-pointer font-bold px-8">
                      Book a Repair
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Image */}
              <div className="relative z-10 md:w-1/2 flex justify-center md:justify-end">
                <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 hover:scale-[1.02] transition-transform duration-500">
                  <img
                    src={promoImg}
                    alt="Professional Scheduler"
                    className="w-full h-full object-cover grayscale-[20%] contrast-125"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 text-white font-medium flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Verified Professional</span>
                  </div>
                </div>
              </div>

              {/* Abstract Background Effects - Minimal */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-slate-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>
          </section>
        </div >
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          service={selectedService}
          onConfirm={handleConfirmBooking}
        />

        <AnimatePresence>
          {isMobileDetailOpen && selectedService && (
            /* MobileServiceDetail removed */
            null
          )}
        </AnimatePresence>
      </div >
    </>
  );
};


export default HomePage;
