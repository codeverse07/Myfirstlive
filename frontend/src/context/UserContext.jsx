import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { toast } from 'react-hot-toast';

const UserContext = createContext();

const generateReferralId = (email) => {
    if (!email) return 'RSV-GUEST';
    // Simple deterministic hash function
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `RSV-${Math.abs(hash).toString(16).toUpperCase()}`;
};

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
                setUser(data.data.user);
            } catch (err) {
                // Not authenticated or session expired
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

    const login = async (email, password, recaptchaToken) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await client.post('/auth/login', { email, password, recaptchaToken });
            setUser(data.data.user);
            toast.success('Login successful!');
            return { success: true, user: data.data.user };
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);
            // toast.error(msg); // Let components handle error toast if they want custom behavior, or do it here? 
            // Front AuthContext did: toast.error(...) inside context.
            toast.error(msg);
            return { success: false, message: msg };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password, passwordConfirm, phone, role = 'USER', recaptchaToken) => {
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
                recaptchaToken // Pass token to backend
            });
            setUser(data.data.user);
            toast.success('Registration successful!');
            return { success: true, user: data.data.user };
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
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
            toast.error('Logout failed');
        } finally {
            setUser(null);
            // Clear local preferences or session-related data
            localStorage.removeItem('admin_auth'); // Just in case
            // setSavedServices([]);
            // setAddresses([]);
        }
    };

    // Placeholder for address/profile updates to also hit API
    // For now, keeping local state sync but adding API calls would be next step.
    const updateProfile = async (userData) => {
        try {
            const res = await client.patch('/users/update-me', userData);
            if (res.data.status === 'success') {
                setUser(res.data.data.user);
                toast.success('Profile updated successfully!');
                return { success: true };
            }
        } catch (err) {
            console.error('Update profile failed:', err);
            const msg = err.response?.data?.message || 'Update failed';
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const submitFeedback = async (category, message) => {
        try {
            const res = await client.post('/feedbacks', { category, message });
            return { success: res.data.status === 'success' };
        } catch (err) {
            console.error('Feedback submission failed:', err);
            return { success: false, message: err.response?.data?.message || 'Failed to send feedback' };
        }
    };

    // Address management (Local for now, can be moved to API if backend supports it)
    const addAddress = (newAddr) => {
        const addrObj = {
            ...newAddr,
            id: Date.now(),
            isDefault: addresses.length === 0
        };
        setAddresses(prev => [...prev, addrObj]);
    };

    const removeAddress = (addressId) => {
        setAddresses(prev => {
            const filtered = prev.filter(a => a.id !== addressId);
            if (filtered.length > 0 && !filtered.find(a => a.isDefault)) {
                filtered[0].isDefault = true;
            }
            return filtered;
        });
    };

    const updateAddress = (newAddress) => {
        // Legacy support if used elsewhere
        console.warn('updateAddress deprecated in favor of full profile update');
    };

    const toggleSavedService = (serviceId) => {
        setSavedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
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
            toggleSavedService,
            addAddress,
            removeAddress,
            submitFeedback,
            // Re-export specific helpers if needed
            updateAddress
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
