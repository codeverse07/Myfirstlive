import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Wrench, User, Moon, Sun, Bot, MapPin, Volume2, VolumeX } from 'lucide-react';
import Button from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useSound } from '../../context/SoundContext';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { setIsChatOpen, isAuthenticated, user } = useUser();
    const { playGlassSound, isSoundEnabled, setIsSoundEnabled } = useSound();
    const [locationName, setLocationName] = useState(() => {
        return localStorage.getItem('user_location') || null;
    });
    const [isLocating, setIsLocating] = useState(false);

    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        if (isHomePage) {
            window.addEventListener('scroll', handleScroll);
            handleScroll(); // Check initial state
        } else {
            setIsScrolled(true); // Always "scrolled" (solid) on other pages
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomePage]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Dynamic styles based on state
    const isTransparent = isHomePage && !isScrolled;

    // Base Classes
    const navClasses = `transition-all duration-300 z-50 ${isHomePage ? 'fixed w-full top-0' : 'sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800'
        } ${isTransparent
            ? 'bg-transparent'
            : isHomePage ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm' : ''
        }`;

    // Text Colors
    const textColorClass = isTransparent ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400';
    const activeColorClass = 'text-blue-600 dark:text-blue-400';
    const logoColorClass = isTransparent ? 'text-white' : 'text-slate-900 dark:text-white';

    const navLinks = user?.role === 'TECHNICIAN'
        ? [
            { name: 'Dashboard', path: '/technician/dashboard' },
            { name: 'Services', path: '/services' },
        ]
        : [
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: 'Bookings', path: '/bookings' },
        ];

    return (
        <nav className={navClasses}>
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to={user?.role === 'TECHNICIAN' ? "/technician/dashboard" : "/"} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className={`text-xl font-bold transition-colors ${logoColorClass}`}>Reservice</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors ${isActive
                                        ? activeColorClass
                                        : textColorClass
                                    }`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </div>

                    {/* Location & Time Section */}
                    <div className="hidden lg:flex items-center gap-6 mr-4">


                        {/* Location Grabber */}
                        <button
                            disabled={isLocating}
                            onClick={() => {
                                if (navigator.geolocation) {
                                    setIsLocating(true);
                                    navigator.geolocation.getCurrentPosition(async (pos) => {
                                        try {
                                            const { latitude, longitude } = pos.coords;
                                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                            const data = await res.json();
                                            const city = data.address.city || data.address.town || data.address.village || 'Location Found';
                                            setLocationName(city);
                                            localStorage.setItem('user_location', city);
                                        } catch (e) {
                                            console.error(e);
                                            setLocationName('Error');
                                        } finally {
                                            setIsLocating(false);
                                        }
                                    }, () => setIsLocating(false));
                                }
                            }}
                            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${isTransparent ? 'text-white hover:text-blue-200' : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'}`}
                        >
                            <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce' : ''}`} />
                            <span>{isLocating ? 'Fetching...' : locationName || 'Detect'}</span>
                        </button>
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-xl transition-all duration-300 active:scale-95 ${isTransparent
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5 fill-current" />
                            ) : (
                                <Sun className="w-5 h-5 fill-current" />
                            )}
                        </button>

                        {/* Sound Toggle - Only for registered users */}
                        {isAuthenticated && (
                            <button
                                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                                className={`p-2 rounded-xl transition-all duration-300 active:scale-95 ${isTransparent
                                    ? 'bg-white/10 text-white hover:bg-white/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                aria-label="Toggle Sound"
                            >
                                {isSoundEnabled ? (
                                    <Volume2 className="w-5 h-5" />
                                ) : (
                                    <VolumeX className="w-5 h-5" />
                                )}
                            </button>
                        )}


                        {!isAuthenticated ? (
                            <>
                                <Link to="/login">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`transition-colors ${isTransparent ? 'text-white hover:text-blue-200 hover:bg-white/10' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
                                    >
                                        Log in
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm" className={isTransparent ? 'shadow-lg shadow-blue-500/30' : 'dark:bg-blue-600 dark:hover:bg-blue-700'}>
                                        Sign up
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <Link to={user?.role === 'TECHNICIAN' ? "/technician/dashboard" : "/profile"}>
                                <Button
                                    size="sm"
                                    className={`flex items-center gap-2 font-bold ${isTransparent ? 'bg-white/20 text-white hover:bg-white/30 border-white/50 shadow-lg' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'}`}
                                >
                                    <User className="w-4 h-4" />
                                    <span>{user?.role === 'TECHNICIAN' ? 'Dashboard' : 'Profile'}</span>
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={toggleMenu}
                            className={`p-2 rounded-md focus:outline-none transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white dark:bg-slate-900 absolute w-full left-0 shadow-lg top-16">
                    <div className="px-4 pt-2 pb-6 space-y-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-3 rounded-md text-base font-medium ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}

                        {/* Mobile Theme Toggle */}
                        <div className="px-3 py-2">
                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 w-full text-left text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                            >
                                {theme === 'light' ? (
                                    <>
                                        <Moon className="w-5 h-5" />
                                        <span>Switch to Dark Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <Sun className="w-5 h-5" />
                                        <span>Switch to Light Mode</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Mobile Sound Toggle - Only for registered users */}
                        {isAuthenticated && (
                            <div className="px-3 py-2">
                                <button
                                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                                    className="flex items-center gap-2 w-full text-left text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                                >
                                    {isSoundEnabled ? (
                                        <>
                                            <Volume2 className="w-5 h-5" />
                                            <span>Mute Sounds</span>
                                        </>
                                    ) : (
                                        <>
                                            <VolumeX className="w-5 h-5" />
                                            <span>Unmute Sounds</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-slate-400">
                                    Log in
                                </Button>
                            </Link>
                            <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full">
                                    Sign up
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
