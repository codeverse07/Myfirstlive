import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAdmin } from '../context/AdminContext';
import { Shield, Layout, Wallet, Share2, LogOut, Settings, Wrench, Users, Clock, User as UserIcon, Tag, MessageSquarePlus, Sun, Moon, Briefcase, Image as ImageIcon, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const AdminLayout = () => {
    const { isAdminAuthenticated, logout } = useAdmin();
    const { isLoading: isAuthLoading } = useUser();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    React.useEffect(() => {
        if (!isAuthLoading && !isAdminAuthenticated) {
            navigate('/admin/login');
        }
    }, [isAdminAuthenticated, isAuthLoading, navigate]);

    // Handle responsiveness
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
                <Loader className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!isAdminAuthenticated) return null;

    const menuItems = [
        { id: 'overview', path: '/admin/dashboard', label: 'Dashboard', icon: Layout },
        { id: 'bookings', path: '/admin/bookings', label: 'Bookings', icon: Clock },
        { id: 'roles', path: '/admin/roles', label: 'Role Manager', icon: Briefcase },
        { id: 'experts', path: '/admin/experts', label: 'Technicians', icon: Users },
        { id: 'categories', path: '/admin/categories', label: 'Categories', icon: Tag },
        { id: 'services', path: '/admin/services', label: 'Services', icon: Wrench },
        { id: 'users', path: '/admin/users', label: 'Users', icon: UserIcon },
        { id: 'feedback', path: '/admin/feedback', label: 'Feedback', icon: MessageSquarePlus },
        { id: 'hero', path: '/admin/hero', label: 'Hero Slides', icon: ImageIcon },
        { id: 'reasons', path: '/admin/reasons', label: 'Extra Charges', icon: Tag },
        { id: 'dealers', path: '/admin/dealers', label: 'Dealers', icon: Users },
        { id: 'toggles', path: '/admin/toggles', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-outfit">
            {/* Mobile Navigation Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl active:scale-90 transition-transform"
            >
                <Layout className="w-6 h-6" />
            </button>

            {/* Sidebar Overlay (Mobile) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Brand Logo */}
                <div className="p-6 flex items-center gap-3 h-24 shrink-0 overflow-hidden">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
                        <Shield className="w-7 h-7" />
                    </div>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="whitespace-nowrap"
                        >
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Reservice</h2>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Admin Panel</p>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (location.pathname === '/admin' && item.id === 'overview');
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                                {isSidebarOpen && (
                                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                                )}
                                {!isSidebarOpen && (
                                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-black rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-4 px-4 py-3.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        {isSidebarOpen && <span className="font-bold text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>
                    <button
                        onClick={async () => {
                            await logout();
                            navigate('/admin/login');
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        {isSidebarOpen && <span className="font-bold text-sm text-red-500">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 font-outfit">
                <header className="lg:hidden h-20 px-6 flex items-center border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">Management</h1>
                    </div>
                </header>

                <div className="p-6 md:p-10 lg:p-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
