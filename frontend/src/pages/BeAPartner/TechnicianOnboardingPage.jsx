import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTechnician } from '../../context/TechnicianContext';
import { useUser } from '../../context/UserContext'; // Import UserContext
import { MapPin, Upload, Check, Loader } from 'lucide-react';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const SKILL_OPTIONS = [
    "Plumber", "Electrician", "Carpenter", "AC Repair",
    "Painter", "Cleaner", "Pest Control", "Appliance Repair"
];

const TechnicianOnboardingPage = () => {
    const { createProfile } = useTechnician();
    const { user, isAuthenticated, isLoading: isUserLoading } = useUser(); // Get user state
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if not logged in (after loading)
    useEffect(() => {
        if (!isUserLoading && !isAuthenticated) {
            toast.error("Please login to continue");
            navigate('/login');
        }
    }, [isUserLoading, isAuthenticated, navigate]);

    if (isUserLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Form State
    const [bio, setBio] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [location, setLocation] = useState({ address: '', coordinates: [0, 0] });
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Document State
    const [aadharCard, setAadharCard] = useState(null);
    const [panCard, setPanCard] = useState(null);
    const [resume, setResume] = useState(null);

    const { uploadDocuments } = useTechnician();

    const handleSkillToggle = (skill) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleLocationDetect = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation(prev => ({
                    ...prev,
                    coordinates: [longitude, latitude], // Mongo uses [Long, Lat]
                    address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`
                }));
                setLocationStatus('success');
                toast.success("Location detected!");
            },
            (error) => {
                console.error(error);
                setLocationStatus('error');
                toast.error("Unable to retrieve location");
            }
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedSkills.length === 0) {
            toast.error("Please select at least one skill");
            return;
        }
        if (location.coordinates[0] === 0 && location.coordinates[1] === 0) {
            toast.error("Please detect your location");
            return;
        }

        setIsLoading(true);

        // 1. Create Basic Profile
        const profileResult = await createProfile({
            bio: bio || "Professional Technician", // Default bio if empty
            skills: selectedSkills,
            location,
            profilePhoto
        });

        if (!profileResult.success) {
            setIsLoading(false);
            return;
        }

        // 2. Upload Mandatory Documents
        if (!aadharCard || !panCard) {
            toast.error("Aadhaar Card and PAN Card are mandatory for verification");
            setIsLoading(false);
            return;
        }

        const docResult = await uploadDocuments({
            aadharCard,
            panCard,
            resume // Optional
        });

        if (docResult.success) {
            toast.success("Onboarding complete! Your profile is under review.");
            navigate('/technician/dashboard');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <h1 className="text-3xl font-black text-white mb-2">Complete Your Profile</h1>
                    <p className="text-blue-100">Tell customers about yourself to get started.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-4">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-colors">
                                <Upload className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <p className="text-sm text-slate-500">Upload a professional photo</p>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">About You (Optional)</label>
                        <textarea
                            rows="4"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-0 transition-all resize-none"
                            placeholder="I have 5 years of experience in..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        ></textarea>
                        <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/500</p>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Your Skills</label>
                        <div className="flex flex-wrap gap-2">
                            {SKILL_OPTIONS.map(skill => {
                                const isSelected = selectedSkills.includes(skill);
                                return (
                                    <button
                                        type="button"
                                        key={skill}
                                        onClick={() => handleSkillToggle(skill)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                            }`}
                                    >
                                        {skill} {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Service Location</label>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${locationStatus === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {location.address || "Location not set"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {locationStatus === 'success' ? 'Ready for jobs nearby' : 'Required to find jobs'}
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant={locationStatus === 'success' ? 'outline' : 'primary'}
                                onClick={handleLocationDetect}
                                disabled={locationStatus === 'loading'}
                            >
                                {locationStatus === 'loading' ? <Loader className="w-4 h-4 animate-spin" /> : 'Detect'}
                            </Button>
                        </div>
                    </div>

                    {/* Document Uploads */}
                    <div className="space-y-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Verification Documents</label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Aadhaar */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer relative">
                                <input required type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setAadharCard(e.target.files[0])} />
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${aadharCard ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{aadharCard ? aadharCard.name : 'Aadhaar Card *'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black">Mandatory</p>
                                    </div>
                                </div>
                            </div>

                            {/* PAN */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer relative">
                                <input required type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setPanCard(e.target.files[0])} />
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${panCard ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{panCard ? panCard.name : 'PAN Card *'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black">Mandatory</p>
                                    </div>
                                </div>
                            </div>

                            {/* Resume */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer relative md:col-span-2">
                                <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setResume(e.target.files[0])} />
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${resume ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{resume ? resume.name : 'CV / Resume (Optional)'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black">Optional</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button className="w-full py-4 text-lg shadow-xl shadow-blue-600/20" disabled={isLoading}>
                            {isLoading ? 'Creating Profile...' : 'Complete Setup'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TechnicianOnboardingPage;
