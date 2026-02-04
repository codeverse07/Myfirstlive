import React from 'react';
import { User, Phone, Mail, MapPin, ChevronRight, LogOut, Settings, CreditCard, Heart, Wrench, Facebook, Twitter, Instagram, Check, MessageSquarePlus, Send, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useSound } from '../../context/SoundContext';
import { useAdmin } from '../../context/AdminContext';
import { Volume2 } from 'lucide-react';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';

const ProfilePage = () => {
  const { user, isAuthenticated, updateProfile, logout, submitFeedback, isLoading } = useUser();
  const { isSoundEnabled, setIsSoundEnabled } = useSound();
  const { appSettings } = useAdmin();
  const navigate = useNavigate();
  const [feedbackText, setFeedbackText] = React.useState('');
  const [feedbackCategory, setFeedbackCategory] = React.useState('Improvements');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [generatedAvatars, setGeneratedAvatars] = React.useState([]);

  React.useEffect(() => {
    if (isAvatarModalOpen) {
      generateAvatars();
    }
  }, [isAvatarModalOpen]);

  const generateAvatars = () => {
    const seeds = Array.from({ length: 9 }, () => Math.random().toString(36).substring(7));
    const newAvatars = seeds.map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
    setGeneratedAvatars(newAvatars);
  };

  const handleSelectAvatar = async (avatarUrl) => {
    await updateProfile({ profilePhoto: avatarUrl });
    setIsAvatarModalOpen(false);
  };

  const handleCameraClick = () => {
    setIsAvatarModalOpen(true);
  };

  const feedbackCategories = [
    { id: 'Improvements', icon: '✨' },
    { id: 'New Service', icon: '🚀' },
    { id: 'Grievance', icon: '⚖️' }
  ];

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050508]"><div className="animate-spin w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full"></div></div>;

  if (!isAuthenticated && !user) return null; // Wait for redirect



  const handleEditProfile = () => {
    const newName = prompt('Enter your name:', user.name);
    const newPhone = prompt('Enter your phone number:', user.phone || '');
    const newAddress = prompt('Enter your primary address:', user.address || '');

    const updates = {};
    if (newName && newName !== user.name) updates.name = newName;
    if (newPhone !== undefined && newPhone !== user.phone) updates.phone = newPhone;
    if (newAddress !== undefined && newAddress !== user.address) updates.address = newAddress;

    if (Object.keys(updates).length > 0) {
      updateProfile(updates);
    }
  };





  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmittingFeedback(true);
    const result = await submitFeedback(feedbackCategory, feedbackText);

    setIsSubmittingFeedback(false);
    if (result.success) {
      setFeedbackSent(true);
      setFeedbackText('');
      setFeedbackCategory('Improvements');
      setTimeout(() => setFeedbackSent(false), 3000);
    } else {
      alert(result.message || 'Failed to send feedback. Please try again.');
    }
  };

  const menuItems = [
    { icon: Heart, label: 'Saved Services', path: '/saved', color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
    { icon: MapPin, label: 'My Addresses', path: '/addresses', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
    { icon: CreditCard, label: 'Payment Methods', path: '/payments', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050508] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">

        {/* --- DESKTOP VIEW --- */}
        <div className="hidden md:grid grid-cols-12 gap-8 items-start">

          {/* Sidebar (cols 1-4) */}
          <div className="col-span-4 space-y-6">
            {/* Profile Summary Card */}
            <div className="bg-white dark:bg-[#0b0b14] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/50 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-rose-500/20 to-orange-500/20"></div>
              <div className="px-6 pb-6 text-center">
                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#0b0b14] shadow-xl mx-auto -mt-12 overflow-hidden bg-white dark:bg-slate-800 relative group cursor-pointer" onClick={handleCameraClick}>
                  <img
                    src={user.profilePhoto?.startsWith('http') ? user.profilePhoto : `/uploads/users/${user.profilePhoto}`}
                    alt={user.name}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-blue-500 p-1 rounded-full border-2 border-white dark:border-[#0b0b14]">
                    <Check className="w-3 h-3 text-white stroke-[4px]" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-4">{user.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{user.phone}</p>
                <div className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{user.email}</div>

                <button
                  onClick={handleEditProfile}
                  className="mt-6 w-full py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Menu Items Card */}
            <div className="bg-white dark:bg-[#0b0b14] rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800/50 overflow-hidden">
              <div className="p-2 space-y-1">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} shadow-sm group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-4 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all text-rose-600 dark:text-rose-400 group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm group-hover:scale-110 transition-transform">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Logout</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-300 dark:text-rose-800 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area (cols 5-12) */}
          <div className="col-span-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Wallet Card */}
              {appSettings.showWallet && (
                <div className="bg-gradient-to-br from-slate-900 to-[#0b0b14] dark:from-rose-600 dark:to-rose-700 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <span className="font-black text-xl tracking-tight">My Wallet</span>
                      </div>
                      <button className="px-6 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                        Add Money
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-white/60 text-sm font-bold uppercase tracking-widest">Available Balance</span>
                    </div>
                    <div className="text-5xl font-black mt-2 tracking-tighter">₹2,450<span className="text-2xl text-white/50">.00</span></div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Refer & Earn Banner */}
                {appSettings.showReferralBanner && (
                  <div className="bg-white dark:bg-[#11111f] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/50 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 group-hover:rotate-12 transition-transform">
                      <Heart className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Refer & Earn ₹500</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Invite friends and get free credits.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-[10px] font-black text-rose-700 dark:text-rose-300 uppercase tracking-widest border border-rose-100 dark:border-rose-900/50">
                          Code: {user.referralId}
                        </span>
                      </div>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Feedback & Requests Section */}
            <div className="bg-white dark:bg-[#0b0b14] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800/50 p-10">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 rounded-[1.5rem] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                  <MessageSquarePlus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">Feedback & Requests</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">We value your thoughts. Let us know how we can improve.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-8">
                <div className="space-y-4">
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Select Category</span>
                  <div className="flex flex-wrap gap-3">
                    {feedbackCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFeedbackCategory(cat.id)}
                        className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border shrink-0 flex items-center gap-2 ${feedbackCategory === cat.id
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <span className="text-base">{cat.icon}</span>
                        {cat.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Your Message</span>
                  <div className="relative">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us how we can improve or request a service..."
                      className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none min-h-[160px] font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!feedbackText.trim() || isSubmittingFeedback}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${feedbackSent
                    ? 'bg-green-600 text-white shadow-2xl shadow-green-600/30'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50'
                    }`}
                >
                  {isSubmittingFeedback ? (
                    'Sending Message...'
                  ) : feedbackSent ? (
                    <><Check className="w-5 h-5" /> Feedback Received!</>
                  ) : (
                    <><Send className="w-5 h-5" /> Submit Feedback</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>


        {/* --- MOBILE VIEW --- */}
        <div className="md:hidden">
          {/* Profile Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-6">
            <div className="h-32 relative">
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1000"
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="flex flex-col items-center -mt-12 mb-4 gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 shadow-md overflow-hidden bg-white dark:bg-slate-800 relative group cursor-pointer" onClick={handleCameraClick}>
                  <img
                    src={user.profilePhoto?.startsWith('http') ? user.profilePhoto : `/uploads/users/${user.profilePhoto}`}
                    alt={user.name}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-blue-500 p-1 rounded-full border-2 border-white dark:border-slate-900 shadow-lg">
                    <Check className="w-3 h-3 text-white stroke-[4px]" />
                  </div>
                </div>
                <div className="flex-1 text-center mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">{user.phone}</p>
                </div>
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <span className="text-gray-600 dark:text-slate-300 text-sm truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                  <span className="text-gray-600 dark:text-slate-300 text-sm truncate">{user.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Controlled: Wallet Card */}
          {appSettings.showWallet && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-rose-600 dark:to-rose-700 rounded-2xl p-6 shadow-lg mb-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg">My Wallet</span>
                  </div>
                  <button className="px-4 py-1.5 rounded-full bg-white text-slate-900 font-bold text-xs hover:bg-opacity-90 transition-all shadow-md">
                    Add Money
                  </button>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white/70 text-sm font-medium">Balance:</span>
                  <span className="text-3xl font-black">₹2,450.00</span>
                </div>
              </div>
            </div>
          )}

          {/* Admin Controlled: Refer & Earn Banner */}
          {appSettings.showReferralBanner && (
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-5 border border-rose-100 dark:border-rose-500/20 mb-6 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Heart className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Refer & Earn ₹500</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Invite your friends and get credits for your next repair.</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 rounded text-[10px] font-mono text-rose-700 dark:text-rose-300">
                  ID: {user.referralId}
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold text-xs shadow-sm active:scale-95 transition-all">
                Invite
              </button>
            </div>
          )}

          {/* Preferences / Sound Effects */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Touch Sounds</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Premium glass haptic feedback</p>
              </div>
            </div>
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`w-14 h-8 rounded-full transition-all duration-300 relative ${isSoundEnabled ? 'bg-rose-600 shadow-md shadow-rose-600/20' : 'bg-gray-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 ${isSoundEnabled ? 'left-7' : 'left-1'} shadow-sm`} />
            </button>
          </div>

          {/* Menu Options */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-b last:border-b-0 border-gray-50 dark:border-slate-800 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.color} shadow-sm`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-gray-700 dark:text-slate-200 font-bold">{item.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manage</span>
                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                </div>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 dark:text-red-400 border-t border-gray-50 dark:border-slate-800 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-bold">Logout</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-600" />
            </button>
          </div>

          {/* Feedback Section (Standalone Card) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 mt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Feedback & Requests</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Improvement, New Service, or Grievance</p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 mb-2">
                {feedbackCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedbackCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${feedbackCategory === cat.id
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span className="mr-1.5">{cat.icon}</span>
                    {cat.id}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us how we can improve or request a service..."
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none min-h-[120px]"
                />
              </div>
              <button
                type="submit"
                disabled={!feedbackText.trim() || isSubmittingFeedback}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${feedbackSent
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100'
                  }`}
              >
                {isSubmittingFeedback ? (
                  'Sending...'
                ) : feedbackSent ? (
                  <><Check className="w-4 h-4" /> Feedback Sent!</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Feedback</>
                )}
              </button>
            </form>
          </div>

          {/* Quick Links & Contact info for mobile */}
          <div className="px-4 pt-8 pb-4 space-y-8">
            {/* Quick Links */}
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/contact" className="text-slate-600 dark:text-slate-400 font-medium">About Us</Link></li>
                <li><Link to="/services" className="text-slate-600 dark:text-slate-400 font-medium">Our Services</Link></li>
                <li><Link to="/partner" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Become a Partner</Link></li>
                <li>
                  <Link to="/careers" className="text-slate-600 dark:text-slate-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                    Careers
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md animate-pulse">
                      Soon
                    </span>
                  </Link>
                </li>
                <li><Link to="/contact" className="text-slate-600 dark:text-slate-400 font-medium hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="pb-8">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">123, Green Park, New Delhi, India 110016</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-rose-600 dark:text-rose-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-rose-600 dark:text-rose-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">support@reservice.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="px-6 py-8 flex flex-col items-center text-center border-t border-gray-100 dark:border-slate-800 mt-4 bg-white dark:bg-slate-900 mx-4 rounded-2xl shadow-sm mb-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Reservice</span>
            </div>
            <div className="flex gap-4 mb-6">
              <a href="#" className="w-10 h-10 rounded-full bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-slate-400 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-slate-400 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-slate-400 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div className="text-slate-400 text-xs font-medium">
              <p>© {new Date().getFullYear()} Reservice. All rights reserved.</p>
            </div>
          </div>

          <MobileBottomNav />
        </div>

      </div>


      {/* Avatar Selection Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-4xl p-6 max-w-md w-full shadow-2xl scale-100 animate-scale-in border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Choose Your Look</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">Select an avatar for your profile.</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {generatedAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAvatar(avatar)}
                  className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 p-2 hover:scale-110 hover:shadow-lg transition-all border-2 border-transparent hover:border-rose-500"
                >
                  <img src={avatar} alt={`Avatar ${index}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={generateAvatars}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Shuffle Avatars 🎲
              </button>

              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="mt-2 w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors"
                id="cancel-avatar-picker"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
