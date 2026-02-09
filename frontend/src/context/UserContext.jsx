import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { toast } from 'react-hot-toast';

const UserContext = createContext();

// const generateReferralId = (email) => {
//     if (!email) return 'RSV-GUEST';
//     // Simple deterministic hash function
//     let hash = 0;
//     for (let i = 0; i < email.length; i++) {
//         const char = email.charCodeAt(i);
//         hash = ((hash << 5) - hash) + char;
//         hash = hash & hash; // Convert to 32bit integer
//     }
//     return `RSV-${Math.abs(hash).toString(16).toUpperCase()}`;
// };

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Keep local helper for saved services/addresses if not yet in backend, 
    // but plan states we should move to backend. For now, keeping local for those specific non-critical items 
    // or if backend doesn't support them yet fully. 
    // However, the plan is "Transition from mock data". 
    // Let's assume backend handles user profile. Saved services might still be local if not in DB schema yet.
    // Checking backend schemas: User schema likely has 'savedServices' or similar? 
    // Let's keep savedServices/addresses local for this step to minimize breakage, 
    // but AUTH is definitely moving to API.

    const [savedServices, setSavedServices] = useState(() => {
        const saved = localStorage.getItem('saved_services');
        return saved ? JSON.parse(saved) : [];
    });

    const [addresses, setAddresses] = useState(() => {
        const saved = localStorage.getItem('user_addresses');
        return saved ? JSON.parse(saved) : [];
    });

    const [isChatOpen, setIsChatOpen] = useState(false);

    // Check Auth on Mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Using /auth/me to match 'front' logic reference
                const { data } = await client.get('/auth/me');
                if (data.status === 'success' && data.data.user) {
                    setUser(data.data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                // Not authenticated or session expired
                console.warn('Auth check failed:', err.response?.status);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    // Sync local preferences
    useEffect(() => {
        localStorage.setItem('saved_services', JSON.stringify(savedServices));
    }, [savedServices]);

    useEffect(() => {
        localStorage.setItem('user_addresses', JSON.stringify(addresses));
    }, [addresses]);

    const login = async (email, password, recaptchaToken, role, rememberMe = true) => {
        setIsLoading(true);
        setError(null);
        try {
            // We pass 'role' to allow backend to enforce portal isolation
            const { data } = await client.post('/auth/login', { email, password, recaptchaToken, role, rememberMe });
            if (data.status === 'success' && data.data.user) {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                setUser(data.data.user);
                toast.success('Login successful!');
                return { success: true, user: data.data.user };
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Login failed';
            setError(msg);
            toast.error(msg);
            return { success: false, message: msg };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password, passwordConfirm, phone, role = 'USER', recaptchaToken, pincode, address) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await client.post('/auth/register', {
                name,
                email,
                password,
                passwordConfirm,
                phone,
                role,
                recaptchaToken, // Pass token to backend
                pincode,
                address
            });
            if (data.status === 'success' && data.data.user) {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                setUser(data.data.user);
                toast.success('Registration successful!');
                return { success: true, user: data.data.user };
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Registration failed';
            setError(msg);
            toast.error(msg);
            return { success: false, message: msg };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await client.post('/auth/logout');
            toast.success('Logged out successfully');
        } catch (err) {
            console.error('Logout error', err);
            // toast.error('Logout failed'); // Often fails if already unauthorized, ignore
        } finally {
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('admin_auth');
            // setSavedServices([]);
            // setAddresses([]);
        }
    };

    // Placeholder for address/profile updates to also hit API
    // For now, keeping local state sync but adding API calls would be next step.
    const updateProfile = async (userData) => {
        try {
            const res = await client.patch('/users/update-me', userData);
            if (res.data.status === 'success' && res.data.data.user) {
                setUser(res.data.data.user);
                toast.success('Profile updated successfully!');
                return { success: true };
            } else {
                throw new Error(res.data.message || 'Profile update failed');
            }
        } catch (err) {
            console.error('Update profile failed:', err);
            const msg = err.response?.data?.message || err.message || 'Update failed';
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const submitFeedback = async (category, message, requestedCategoryName) => {
        try {
            const res = await client.post('/feedbacks', { category, message, requestedCategoryName });
            return { success: res.data.status === 'success' };
        } catch (err) {
            console.error('Feedback submission failed:', err);
            return { success: false, message: err.response?.data?.message || 'Failed to send feedback' };
        }
    };

    // Address management (Local for now)
    const addAddress = (newAddr) => {
        setAddresses(prev => {
            const isFirst = prev.length === 0;
            const addrObj = {
                ...newAddr,
                id: Date.now(),
                isDefault: isFirst
            };
            return [...prev, addrObj];
        });
        toast.success("Address added");
    };

    const removeAddress = (addressId) => {
        setAddresses(prev => {
            const remaining = prev.filter(a => a.id !== addressId);
            // If we removed the default, set a new default
            if (remaining.length > 0) {
                const hasDefault = remaining.some(a => a.isDefault);
                if (!hasDefault) {
                    remaining[0].isDefault = true;
                }
            }
            return remaining;
        });
        toast.success("Address removed");
    };

    const saveService = async (serviceId) => {
        // Optimistically update local state
        const newSaved = [...savedServices, serviceId];
        setSavedServices(newSaved);

        // Also update the 'user' object if it exists so UI checks against user.savedServices pass
        if (user) {
            setUser({ ...user, savedServices: [...(user.savedServices || []), serviceId] });
        }
        toast.success("Service saved");
        // TODO: Call API to persist
    };

    const removeService = async (serviceId) => {
        const newSaved = savedServices.filter(id => id !== serviceId);
        setSavedServices(newSaved);

        if (user) {
            setUser({ ...user, savedServices: (user.savedServices || []).filter(s => (s._id || s) !== serviceId) });
        }
        toast.success("Service removed");
        // TODO: Call API to persist
    };

    return (
        <UserContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            error,
            login,
            register,
            logout,
            updateProfile,
            isChatOpen,
            setIsChatOpen,
            savedServices,
            saveService,
            removeService,
            // Addresses
            addresses,
            addAddress,
            removeAddress,
            submitFeedback,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
