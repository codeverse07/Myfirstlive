import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="md:bg-slate-900 bg-white dark:bg-slate-950 md:text-slate-300 text-slate-600 dark:text-slate-400 pt-16 pb-8 relative z-20 transition-colors duration-300 border-t border-rose-100 dark:border-slate-800 md:border-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-rose-600 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                                Reservice
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Professional home repair and transport services at your doorstep. Fast, reliable, and guaranteed quality.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-slate-400 flex items-center justify-center hover:bg-rose-600 hover:text-white dark:hover:bg-blue-600 transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full md:bg-slate-800 bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-slate-400 md:text-slate-400 flex items-center justify-center md:hover:bg-blue-600 hover:bg-rose-600 hover:text-white transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full md:bg-slate-800 bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-slate-400 md:text-slate-400 flex items-center justify-center md:hover:bg-blue-600 hover:bg-rose-600 hover:text-white transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="hidden md:block">
                        <h3 className="md:text-white text-slate-900 dark:text-white font-semibold text-lg mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li><Link to="/about" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
                            <li><Link to="/services" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Our Services</Link></li>
                            <li><Link to="/services" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Pricing</Link></li>
                            <li><Link to="/careers" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Careers</Link></li>
                            <li><Link to="/contact" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="hidden md:block">
                        <h3 className="md:text-white text-slate-900 dark:text-white font-semibold text-lg mb-6">Services</h3>
                        <ul className="space-y-4">
                            <li><Link to="/services" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Carpentry</Link></li>
                            <li><Link to="/services" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Electrical</Link></li>
                            <li><Link to="/services" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Home Appliances</Link></li>
                            <li><Link to="/services" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Plumbing</Link></li>
                            <li><Link to="/transport" className="md:hover:text-blue-500 hover:text-rose-600 dark:hover:text-blue-400 transition-colors">Transport</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="hidden md:block">
                        <h3 className="md:text-white text-slate-900 dark:text-white font-semibold text-lg mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 md:text-blue-500 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                                <span>123, Green Park, New Delhi, India 110016</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 md:text-blue-500 text-rose-600 dark:text-rose-500 shrink-0" />
                                <span>+91 98765 43210</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 md:text-blue-500 text-rose-600 dark:text-rose-500 shrink-0" />
                                <span>support@reservice.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t md:border-slate-800 border-rose-100 dark:border-slate-800 pt-8 text-center md:text-slate-500 text-slate-400 dark:text-slate-500 text-sm">
                    <p>© {new Date().getFullYear()} Reservice. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
