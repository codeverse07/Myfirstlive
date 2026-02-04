import { MapPin, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

const MobileHeader = ({ className }) => {
  const { user, updateAddress } = useUser();
  const { theme, toggleTheme } = useTheme();

  const handleAddressClick = () => {
    if (!user) return; // Prevent prompt for guest
    const newAddress = prompt('Enter your city/area:', user.address);
    if (newAddress) {
      updateAddress(newAddress);
    }
  };

  return (
    <div className={`sticky top-0 z-50 pt-4 pb-4 px-5 transition-all backdrop-blur-2xl border-b border-white/20 dark:border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${className || 'bg-white/80 dark:bg-slate-950/80'}`}>
      <div className="flex items-center justify-between">

        {/* Futuristic Location Pill */}
        <div
          onClick={handleAddressClick}
          className="flex flex-col max-w-[70%] group cursor-pointer active:scale-[0.97] transition-all"
        >
          <div className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-[0.2em] mb-0.5">
            <MapPin className="w-3 h-3 text-rose-500 animate-bounce" />
            <span className="bg-linear-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Current Location</span>
          </div>
          <div className="flex items-center gap-1.5 relative">
            <span className="font-extrabold text-slate-900 dark:text-white text-base truncate relative z-10 group-hover:text-rose-600 transition-colors tracking-tight">
              {user?.address || 'Set Location'}
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
