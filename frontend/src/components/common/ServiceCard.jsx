import React from 'react';
import { Star, Clock, Check, Tag, Calendar, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { format } from 'date-fns';
import Button from './Button';

const ServiceCard = ({ service, onBook, variant = 'user', onEdit, onDelete }) => {
    if (variant === 'technician') {
        // Keep technician variant compact as it was
        return (
            <div className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex gap-4">
                    <img src={service.headerImage || service.image || 'https://images.unsplash.com/photo-1581578731117-104f2a41d58e?auto=format&fit=crop&q=80'} className="w-20 h-20 rounded-2xl object-cover" />
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white">{service.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{service.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white">₹{service.price}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {typeof service.category === 'string' ? service.category : service.category?.name}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(service)}>Edit</Button>
                    <Button size="sm" className="flex-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white" onClick={() => onDelete(service)}>Delete</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={service.headerImage || service.image || 'https://images.unsplash.com/photo-1581578731117-104f2a41d58e?auto=format&fit=crop&q=80'}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent"></div>

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex items-center justify-between w-[calc(100%-2rem)]">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/20">
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                            Premium
                        </span>
                    </div>
                    <button className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-rose-500 transition-all duration-300">
                        <Heart className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-4 right-4">
                    <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black shadow-lg">
                        {service.rating || '4.8'}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                <div className="mb-3">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                        {service.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        <span>{typeof service.category === 'string' ? service.category : service.category?.name}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>Home Services</span>
                    </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {service.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex flex-col">
                        {service.originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through font-medium">₹{service.originalPrice}</span>
                        )}
                        <span className="text-xl font-black text-slate-900 dark:text-white">₹{service.price}</span>
                    </div>

                    <div className="flex gap-2">
                        <Link to={`/services/${service._id || service.id}`}>
                            <Button
                                variant="outline"
                                className="rounded-xl border-slate-100 bg-slate-50/50 hover:bg-white text-[9px] font-black uppercase tracking-widest px-3 py-2.5 h-auto"
                            >
                                Details
                            </Button>
                        </Link>
                        <Button
                            onClick={() => onBook(service)}
                            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 h-auto transition-all shadow-md shadow-blue-500/20"
                        >
                            Book Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceCard;
