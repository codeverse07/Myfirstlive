import React from 'react';
import { Star, Clock, ChevronRight, Check, Tag, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import Button from './Button';

const ServiceCard = ({ service, onBook, variant = 'user', onEdit, onDelete }) => {
    return (
        <div className="group flex flex-row md:flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1 h-40 md:h-full">
            {/* Image Section - Horizontal on mobile, Vertical on desktop */}
            <div className="relative w-32 md:w-full md:h-56 h-full shrink-0">
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10" />
                <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transform md:group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Price Tag - Hidden on mobile image, shown in content, or kept small */}
                <div className="absolute top-2 left-2 md:top-4 md:right-4 md:left-auto z-20">
                    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-1">
                        <span className="hidden md:inline text-xs font-medium text-slate-500 dark:text-slate-400">starts at</span>
                        <div className="flex flex-col md:flex-row items-baseline gap-1">
                            {service.originalPrice && (
                                <span className="text-[10px] md:text-xs text-slate-400 line-through">₹{service.originalPrice}</span>
                            )}
                            <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">₹{service.price}</span>
                        </div>
                    </div>
                </div>

                {/* Rating Badge - Bottom left on both but adjusted */}
                <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-20">
                    <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                        <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] md:text-xs font-bold text-slate-800 dark:text-slate-200">{service.rating}</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-3 md:p-6 flex flex-col grow justify-between">
                <div>
                    <h3 className="font-bold text-sm md:text-xl text-slate-900 dark:text-white mb-1 md:mb-2 line-clamp-2 md:line-clamp-1 group-hover:text-rose-600 md:group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {service.title}
                    </h3>
                    <p className="hidden md:block text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                        {service.description}
                    </p>
                    <p className="md:hidden text-slate-400 dark:text-slate-500 text-xs line-clamp-2 leading-tight">
                        {service.description}
                    </p>
                </div>

                {/* Meta Info - Hidden on mobile to save space, or very compact */}
                <div className="hidden md:flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 border-t border-slate-50 dark:border-slate-800 pt-4 mt-auto">
                    {variant === 'technician' ? (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>Created {service.createdAt ? format(new Date(service.createdAt), 'MMM d, yyyy') : 'Recently'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span>60 mins</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-indigo-500" />
                        <span>{service.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Instant Booking</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2 md:mt-auto">
                    {variant === 'technician' ? (
                        <>
                            <div className="flex-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-center border-slate-200 dark:border-slate-700 hover:border-blue-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 px-2"
                                    onClick={() => onEdit(service)}
                                >
                                    Edit
                                </Button>
                            </div>
                            <div className="flex-1">
                                <Button
                                    size="sm"
                                    className="w-full justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-900/30 dark:bg-red-900/10 shadow-sm px-2"
                                    onClick={() => onDelete(service)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to={`/services/${service._id || service.id}`} className="flex-1 hidden md:block">
                                <Button variant="outline" size="sm" className="w-full justify-center border-slate-200 dark:border-slate-700 hover:border-red-600 md:hover:border-blue-600 hover:text-red-600 md:hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 px-2">
                                    Details
                                </Button>
                            </Link>
                            <div className="flex-1">
                                <Button
                                    size="sm"
                                    className="w-full justify-center bg-rose-600 md:bg-blue-600 hover:bg-rose-700 md:hover:bg-blue-700 shadow-lg shadow-rose-500/20 md:shadow-blue-500/20 px-3 md:px-2 py-2 md:py-2 text-xs md:text-sm whitespace-nowrap dark:bg-rose-600 dark:hover:bg-rose-700"
                                    onClick={() => onBook(service)}
                                >
                                    Book
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceCard;
