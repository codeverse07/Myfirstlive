import React, { useState } from 'react';
import { X, Calendar, Clock, Loader2, FileText, MapPin } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Button from '../common/Button';
import Input from '../common/Input';

const BookingModal = ({ isOpen, onClose, service, onConfirm }) => {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        description: '',
        address: user?.address || '',
        pickupLocation: user?.address || '',
        dropLocation: ''
    });

    const { updateProfile } = useUser();

    // Update address if user data loads
    React.useEffect(() => {
        if (user?.address && !formData.address) {
            setFormData(prev => ({
                ...prev,
                address: user.address,
                pickupLocation: prev.pickupLocation || user.address
            }));
        }
    }, [user, isOpen]);

    if (!isOpen || !service) return null;

    const isShiftingOrTransport = service.category === 'houseshifting' || service.category === 'transport';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // If user didn't have an address before, update their profile
        if (!user?.address && formData.address) {
            await updateProfile({ address: formData.address });
        }

        // Create sanitized booking data
        const bookingData = {
            ...formData,
            serviceId: service._id || service.id,
            serviceName: service.title,
            image: service.image,
            price: service.price,
        };

        // Sanitize: remove empty strings for location fields to prevent backend validation errors
        if (!bookingData.dropLocation) delete bookingData.dropLocation;
        if (!bookingData.pickupLocation) delete bookingData.pickupLocation;
        if (!bookingData.address) delete bookingData.address;

        // Simulate network delay
        setTimeout(() => {
            onConfirm(bookingData);
            setIsLoading(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Book Service</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {service.title} <span className="mx-1">•</span> ₹{service.price}
                    </p>
                    {isShiftingOrTransport && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                            <p className="text-xs text-amber-700 font-medium">
                                <strong>Note:</strong> Final shifting price will be fixed after distance verification and on-site inspection.
                            </p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Preferred Date"
                                type="date"
                                icon={Calendar}
                                value={formData.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                            <Input
                                label="Preferred Time"
                                type="time"
                                icon={Clock}
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>

                        {!isShiftingOrTransport && (
                            <Input
                                label="Service Address"
                                placeholder="Enter full address for service"
                                icon={MapPin}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value, pickupLocation: e.target.value })}
                                required
                            />
                        )}

                        {isShiftingOrTransport && (
                            <>
                                <Input
                                    label="Pickup Location"
                                    placeholder="Enter origin address"
                                    icon={MapPin}
                                    value={formData.pickupLocation}
                                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value, address: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Drop Location"
                                    placeholder="Enter destination address"
                                    icon={MapPin}
                                    value={formData.dropLocation}
                                    onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })}
                                    required
                                />
                            </>
                        )}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 ml-1">
                                Additional Notes
                            </label>
                            <div className="relative">
                                <div className="absolute top-3 left-4 text-slate-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <textarea
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 min-h-20 resize-none text-sm"
                                    placeholder="Any specific instructions..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1 justify-center" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 justify-center shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Confirming...
                                </>
                            ) : (
                                'Confirm Booking'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
