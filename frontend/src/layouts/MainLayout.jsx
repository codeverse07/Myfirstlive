import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-white bg-transparent dark:bg-slate-950 transition-colors duration-300">
            <div className="hidden md:block">
                <Navbar />
            </div>

            <main className="grow">
                <Outlet />
            </main>

            <div className="hidden md:block">
                <Footer />
            </div>
        </div>
    );
};

export default MainLayout;
