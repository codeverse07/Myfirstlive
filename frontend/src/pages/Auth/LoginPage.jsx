import React, { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Eye, EyeOff } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { toast } from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useUser } from '../../context/UserContext';
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

const LoginPage = () => {
    const containerRef = useRef(null);
    const formRef = useRef(null);
    const rightSectionRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isExistingCustomer, setIsExistingCustomer] = useState(() => {
        return location.state?.isSignUp ? false : true;
    });

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('USER');

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

    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const isCaptchaEnabled = import.meta.env.VITE_ENABLE_CAPTCHA === 'true';

        // Verification Logic
        if (isCaptchaEnabled && !recaptchaToken) {
            toast.error('Please complete the Captcha verification.');
            setIsLoading(false);
            return;
        }

        const tokenToSend = isCaptchaEnabled ? recaptchaToken : 'bypass-token';

        if (isExistingCustomer) {
            // LOGIN FLOW
            const result = await login(email, password, tokenToSend);
            if (result.success) {
                toast.success('Welcome back!');
                // Redirect based on role
                if (result.user?.role === 'TECHNICIAN') {
                    navigate('/technician/dashboard');
                } else if (result.user?.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/bookings');
                }
            } else {
                toast.error(result.message || 'Login failed');
                if (recaptchaRef.current) recaptchaRef.current.reset();
                setRecaptchaToken(null);
            }
        } else {
            // REGISTER FLOW
            const result = await register(name, email, password, password, phone, role, tokenToSend);

            if (result.success) {
                toast.success('Registration successful!');
                if (role === 'TECHNICIAN') {
                    navigate('/technician/onboarding');
                } else {
                    navigate('/bookings'); // Redirect to Dashboard
                }
            } else {
                toast.error(result.message || 'Registration failed');
                if (recaptchaRef.current) recaptchaRef.current.reset();
                setRecaptchaToken(null);
            }
        }
        setIsLoading(false);
    };

    const handleGoogleLogin = () => {
        const isCaptchaEnabled = import.meta.env.VITE_ENABLE_CAPTCHA === 'true';

        if (isCaptchaEnabled && !recaptchaToken) {
            toast.error('Please complete the Captcha verification first.');
            return;
        }

        const tokenToSend = isCaptchaEnabled ? recaptchaToken : 'bypass-token';
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/google?role=${role}&recaptcha=${tokenToSend}`;
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
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
                            {isExistingCustomer ? 'Welcome Back' : 'Create your profile'}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {isExistingCustomer ? 'Login to your verified account.' : 'Join Reservice today for expert home help.'}
                        </p>
                    </div>

                    {/* Compact Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-3 stagger-item">
                        <button
                            onClick={() => { setIsExistingCustomer(false); setRecaptchaToken(null); if (recaptchaRef.current) recaptchaRef.current.reset(); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isExistingCustomer ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            New Profile
                        </button>
                        <button
                            onClick={() => { setIsExistingCustomer(true); setRecaptchaToken(null); if (recaptchaRef.current) recaptchaRef.current.reset(); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isExistingCustomer ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Existing Customer
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 stagger-item">
                        {!isExistingCustomer && (
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    id="name"
                                    label="Full Name"
                                    placeholder="John Doe"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="py-1.5"
                                />
                                <Input
                                    id="phone"
                                    label="Phone"
                                    placeholder="+91..."
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="py-1.5"
                                />
                            </div>
                        )}

                        {!isExistingCustomer && (
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
                        )}

                        <Input
                            id="email"
                            label="Email"
                            placeholder="name@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="py-1.5"
                        />

                        <Input
                            id="password"
                            label="Password"
                            placeholder={isExistingCustomer ? "Password" : "Create Password"}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="py-1.5"
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

                        {isExistingCustomer && (
                            <div className="flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                                    <span className="text-slate-600">Remember me</span>
                                </label>
                                <a href="#" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">Forgot?</a>
                            </div>
                        )}


                        {/* Captcha for BOTH Login and Register */}
                        {import.meta.env.VITE_ENABLE_CAPTCHA === 'true' && (
                            <div className="flex justify-center my-2 captcha-container scale-90 origin-center">
                                <ReCAPTCHA
                                    ref={recaptchaRef}
                                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                                    onChange={(token) => setRecaptchaToken(token)}
                                />
                            </div>
                        )}

                        <Button
                            className="w-full shadow-lg hover:-translate-y-px transition-transform duration-200 mt-2 py-2.5 text-sm"
                            size="lg"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? (isExistingCustomer ? 'Signing in...' : 'Creating account...')
                                : (isExistingCustomer ? 'Sign In' : 'Create Account')}
                        </Button>



                        {import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true' && (
                            <>
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase">
                                        <span className="bg-white px-2 text-slate-400">Or continue with</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                                        <span className="text-sm font-bold text-slate-700">Google</span>
                                    </button>
                                </div>
                            </>
                        )}

                    </form>
                </div>
            </div>

            {/* Right: Decoration */}
            <div ref={rightSectionRef} className="hidden lg:block relative bg-linear-to-br from-[#0f172a] to-[#020617] overflow-hidden">
                {/* Images */}
                <div className="absolute inset-0 z-0 -translate-y-16">
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

                <div className="relative z-20 flex flex-col justify-end h-full px-20 pb-12 text-white pointer-events-none">
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
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
