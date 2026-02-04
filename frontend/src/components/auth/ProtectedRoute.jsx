import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isLoading, isAuthenticated } = useUser();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Verifying Session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login but save the current location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // If they don't have the right role, send them to home or specific page
        toast.error('You do not have permission to access this area.');
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
