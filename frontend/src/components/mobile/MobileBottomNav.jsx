import { Home, Search, Calendar, User, Bot, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { motion } from 'framer-motion';

const MobileBottomNav = ({ className }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { setIsChatOpen, user } = useUser();

  const navItems = user?.role === 'TECHNICIAN'
    ? [
      { icon: Home, label: 'Dashboard', path: '/technician/dashboard' },
      { icon: Search, label: 'Search', path: '/search' },
      { icon: User, label: 'Account', path: '/profile' },
    ]
    : [
      { icon: Home, label: 'Home', path: '/' },
      { icon: Search, label: 'Search', path: '/search' },
      { icon: Calendar, label: 'Bookings', path: '/bookings' },
      { icon: User, label: 'Account', path: '/profile' },
    ];

  return (
    <div className={`fixed bottom-6 left-6 right-6 backdrop-blur-xl border border-white/40 dark:border-white/10 px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl shadow-rose-900/10 dark:shadow-black/40 rounded-full z-50 flex justify-between items-center md:hidden transition-all hover:scale-[1.01] ${className || 'bg-white/50 supports-[backdrop-filter]:bg-white/40 dark:bg-slate-900/60'}`}>
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`relative flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl group ${isActive ? '-translate-y-1' : ''}`}
          >
            {isActive && (
              <span className="absolute -top-1 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
            )}
            <div className={`p-2 rounded-full transition-all duration-300 drop-shadow-sm ${isActive ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-700 dark:text-slate-100 bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/10'}`}>
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-rose-600 dark:fill-rose-500/0' : ''}`} strokeWidth={2.5} />
            </div>
          </Link>
        );
      })}

      {/* AI Chatbot Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="relative flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl group active:scale-90"
      >
        <div className="p-2.5 rounded-2xl transition-all duration-300 bg-gradient-to-tr from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25 group-hover:scale-110">
          <Bot className="w-5 h-5" />
          <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-white animate-pulse" />
        </div>
      </button>
    </div>
  );
};

export default MobileBottomNav;
