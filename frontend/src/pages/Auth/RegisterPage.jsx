import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useState } from 'react';
import { Wrench, Eye, EyeOff } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import repairImage from '../../assets/REPAIR.png';
import repairImage2 from '../../assets/repair2.png';
import repairImage3 from '../../assets/image.png';

const slides = [
    {
        image: repairImage,
        quote: "Reservice saved my weekend! The technician arrived within an hour and fixed my AC perfectly. Highly recommended!",
        author: "Sarah Jenkins",
        role: "Homeowner, Brooklyn"
    },
    {
        image: repairImage2,
        quote: "I never had to worry about safety or quality. All technicians are verified, polite, and know exactly what they’re doing.",
        author: "Michael Chen",
        role: "Business Owner"
    },
    {
        image: repairImage3,
        quote: "Finding a technician was super easy, and the website is very user-friendly. Everything just works smoothly.",
        author: "Emily Rodriguez",
        role: "Freelance Designer"
    }
];

const RegisterPage = () => {
    const containerRef = useRef(null);
    const formRef = useRef(null);
    const rightSectionRef = useRef(null);
    const { register } = useUser();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER'); // Default Role
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Form Entrance
        tl.from(formRef.current, {
            x: -50,
            opacity: 0,
            duration: 0.8,
        })
            .from(".stagger-item", {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
            }, "-=0.4");

        // Slideshow Animation
        const slideshowTl = gsap.timeline({ repeat: -1 });
        const imageElements = gsap.utils.toArray(".slide-image");
        const textElements = gsap.utils.toArray(".slide-text");

        // Initial setup
        gsap.set(imageElements, { autoAlpha: 0, x: 40 });
        gsap.set(textElements, { autoAlpha: 0, x: 40 });

        // We assume imageElements and textElements have same length
        imageElements.forEach((img, i) => {
            const textContent = textElements[i];

            // Enter
            slideshowTl
                .to([img, textContent], {
                    duration: 2,
                    autoAlpha: 1,
                    x: 0,
                    ease: "power2.out",
                })
                // Stay
                .to([img, textContent], {
                    duration: 2.5,
                    x: 0,
                })
                // Exit
                .to([img, textContent], {
                    duration: 1.5,
                    autoAlpha: 0,
                    x: -40,
                    ease: "power2.in",
                });

            // Reset position for next loop (set immediateRender false to strictly happen in sequence)
            slideshowTl.set([img, textContent], { x: 40 });
        });
        // Floating Animation (Independent)
        gsap.to(imageElements, {
            y: -10, // Increased float
            duration: 3.5, // Slightly slower for smoother feel with larger movement
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: containerRef });

    const [successMessage, setSuccessMessage] = useState('');
    const [pageError, setPageError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');
        setPageError('');

        const isCaptchaEnabled = import.meta.env.VITE_ENABLE_CAPTCHA === 'true';

        if (isCaptchaEnabled && !recaptchaToken) {
            setPageError('Please complete the Captcha verification.');
            setIsLoading(false);
            return;
        }

        const tokenToSend = isCaptchaEnabled ? recaptchaToken : 'bypass-token';
        const name = `${firstName} ${lastName}`.trim();

        console.log("Submitting registration...");
        const result = await register(name, email, password, password, phone, role, tokenToSend);
        console.log("Registration Result:", result);

        if (result.success) {
            setSuccessMessage('Created successfully ✓');
            // Clear form
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setPassword('');

            setTimeout(() => {
                if (role === 'TECHNICIAN') {
                    navigate('/technician/onboarding');
                } else {
                    navigate('/bookings');
                }
            }, 1500);
        } else {
            setPageError(result.message || 'Registration failed. Please try again.');
            if (recaptchaRef.current) recaptchaRef.current.reset();
            setRecaptchaToken(null);
        }
        setIsLoading(false);
    };

    return (
        <div ref={containerRef} className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Form */}
            <div ref={formRef} className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 bg-white order-last lg:order-first">
                <div className="w-full max-w-md mx-auto py-6">
                    <div className="mb-6 stagger-item">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-blue-600">Reservice</span>
                        </Link>
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create an account</h1>
                        <p className="text-slate-500 text-sm">Join thousands of happy homeowners today.</p>
                        {successMessage && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm font-bold flex items-center gap-2 animate-pulse">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {successMessage}
                            </div>
                        )}
                        {pageError && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                {pageError}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 stagger-item">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                id="firstName"
                                label="First Name"
                                placeholder="Rajesh"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            <Input
                                id="lastName"
                                label="Last Name"
                                placeholder="Kumar"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>


                        <Input
                            id="email"
                            label="Email Address"
                            placeholder="name@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {/* Role Selector */}
                        <div className="mb-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">I am a</label>
                            <div className="flex gap-3">
                                <label className={`flex-1 border rounded-lg p-2 cursor-pointer transition-colors ${role === 'USER' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300'}`}>
                                    <div className="flex items-center gap-2 font-bold text-xs">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="USER"
                                            checked={role === 'USER'}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="text-blue-600 focus:ring-blue-600"
                                        />
                                        Customer
                                    </div>
                                </label>
                                <label className={`flex-1 border rounded-lg p-2 cursor-pointer transition-colors ${role === 'TECHNICIAN' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300'}`}>
                                    <div className="flex items-center gap-2 font-bold text-xs">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="TECHNICIAN"
                                            checked={role === 'TECHNICIAN'}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="text-blue-600 focus:ring-blue-600"
                                        />
                                        Technician
                                    </div>
                                </label>
                            </div>
                        </div>

                        <Input
                            id="phone"
                            label="Phone Number"
                            placeholder="+91 123456789"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />

                        <div>
                            <Input
                                id="password"
                                label="Password"
                                placeholder="Create a password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Must be at least 8 characters.
                            </p>
                        </div>


                        <div className="pt-2">
                            {/* Captcha */}
                            {import.meta.env.VITE_ENABLE_CAPTCHA === 'true' && (
                                <div className="flex justify-center mb-4 captcha-container scale-90 origin-center">
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                                        onChange={(token) => setRecaptchaToken(token)}
                                    />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:translate-y-[-1px] transition-transform duration-200"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </div>


                        {import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true' && (
                            <>
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-2 text-slate-500">Or register with</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full relative flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-600"
                                        onClick={handleGoogleLogin}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        <span className="font-medium">Continue with Google</span>
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500 stagger-item">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right: Decoration */}
            <div ref={rightSectionRef} className="hidden lg:block relative bg-linear-to-br from-[#0f172a] to-[#020617] overflow-hidden">
                {/* Images */}
                <div className="absolute inset-0 z-0">
                    {slides.map((slide, index) => (
                        <img
                            key={index}
                            src={slide.image}
                            alt={`Presentation ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-contain slide-image"
                            style={{ padding: '80px' }}
                        />
                    ))}
                </div>

                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-20 flex flex-col justify-end h-full p-20 text-white pointer-events-none">
                    <div className="relative min-h-40"> {/* Min height to prevent layout jumps */}
                        {slides.map((slide, index) => (
                            <div key={index} className="absolute bottom-0 left-0 w-full slide-text">
                                <div className="flex gap-1 mb-5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg key={i} className="w-5 h-5 text-[#FDBA74] fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-xl font-medium leading-loose mb-6 max-w-lg tracking-wide text-slate-100">
                                    "{slide.quote}"
                                </p>
                                <div>
                                    <p className="font-bold text-white text-lg">{slide.author}</p>
                                    <p className="text-slate-400 text-sm font-medium">{slide.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default RegisterPage;
