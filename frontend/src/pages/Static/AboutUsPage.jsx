import React from 'react';
import MobileBottomNav from '../../components/mobile/MobileBottomNav';
import { FileText, Shield, Info } from 'lucide-react';

const AboutUsPage = () => {
    return (
        <div className="min-h-screen bg-transparent dark:bg-slate-950 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">About Us</h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Learn more about Reservice, our mission, and the terms that govern our platform.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">

                    {/* Terms & Conditions Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Terms and Conditions</h2>
                        </div>

                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                            <p className="mb-4">
                                Welcome to Reservice. By accessing or using our website and services, you agree to be bound by these Terms and Conditions and our Privacy Policy.
                            </p>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Introduction</h3>
                            <p className="mb-4">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. User Responsibilities</h3>
                            <p className="mb-4">
                                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </p>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Service Modifications</h3>
                            <p className="mb-4">
                                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                            </p>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 mt-6">
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                                    Last Updated: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mission Section (Dummy) */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Promise</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            At Reservice, we are committed to providing top-tier home services with a focus on quality, reliability, and customer satisfaction. Our extensive network of verified professionals ensures that your home needs are met with the highest standards.
                        </p>
                    </div>

                </div>
            </div>
            <MobileBottomNav />
        </div>
    );
};

export default AboutUsPage;
