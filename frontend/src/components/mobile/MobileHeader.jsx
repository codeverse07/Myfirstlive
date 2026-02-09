import { MapPin, Moon, Sun } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

const MobileHeader = ({ className }) => {
  const { user, updateProfile } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [isLocating, setIsLocating] = useState(false);
  const [displayAddress, setDisplayAddress] = useState(() => {
    // Laptop Mode Logic: Prioritize real-time coordinate city over profile default
    return localStorage.getItem('user_location') || user?.address || 'Locate Me';
  });

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();

        // High-precision area detection
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.district || data.address.county || 'Detected';

        if (city) {
          // Instant UI update (Laptop Style)
          setDisplayAddress(city);
          localStorage.setItem('user_location', city);

          // Update backend profile in background
          if (user && updateProfile) {
            updateProfile({ address: city });
          }
        }
      } catch (e) {
        console.error("Locating failed", e);
        alert("Could not detect exact location. Please ensure GPS is active.");
      } finally {
        setIsLocating(false);
      }
    }, (error) => {
      console.error("GPS Error:", error);
      setIsLocating(false);
      if (error.code === 1) {
        alert("Permission Denied: Please 'Allow' Location Access in your browser settings.");
      } else {
        alert("GPS Signal Weak: Please check your connection.");
      }
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }, [user, updateProfile]);

  const handleAddressClick = () => {
    detectLocation();
  };

  // Auto-detect location on mount if coordinates aren't already saved
  useEffect(() => {
    const savedLoc = localStorage.getItem('user_location');
    if (!savedLoc && !isLocating) {
      detectLocation();
    }
  }, [detectLocation]);

  return (
    <div className={`sticky top-0 z-50 pt-4 pb-4 px-5 transition-all backdrop-blur-2xl border-b border-white/20 dark:border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${className || 'bg-white/80 dark:bg-slate-950/80'}`}>
      <div className="flex items-center justify-between">

        {/* Futuristic Location Pill */}
        <div
          onClick={handleAddressClick}
          className="flex flex-col max-w-[70%] group cursor-pointer active:scale-[0.97] transition-all"
        >
          <div className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-[0.2em] mb-0.5">
            <MapPin className={`w-3 h-3 text-rose-500 ${isLocating ? 'animate-bounce' : ''}`} />
            <span className="bg-linear-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              {isLocating ? 'Detecting...' : 'Current Location'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 relative">
            <span className="font-extrabold text-slate-900 dark:text-white text-base truncate relative z-10 group-hover:text-rose-600 transition-colors tracking-tight">
              {isLocating ? 'Fetching GPS...' : displayAddress}
            </span>
            <div className="w-6 h-6 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center transform group-hover:rotate-180 transition-transform duration-500">
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Actions - Theme Toggle & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="relative w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 shadow-sm active:scale-90 transition-all outline-none overflow-hidden group"
          >
            <div className="relative z-10 transition-transform duration-500 group-hover:rotate-20">
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-indigo-600 fill-indigo-50" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              )}
            </div>
          </button>

          <Link to="/profile" className="relative w-11 h-11 rounded-2xl p-[2px] bg-gradient-to-tr from-rose-500 via-orange-500 to-purple-500 active:scale-90 transition-transform shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[0.9rem] flex items-center justify-center overflow-hidden border border-white/50 dark:border-slate-800">
              {user ? (
                <img
                  src={user.image}
                  alt={user.name}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">Login</span>
                </div>
              )}
            </div>
            {/* Online/Active Dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-3 border-white dark:border-slate-950 shadow-sm"></div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
