import React, { useState, useEffect, useRef } from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Users,
  ChevronRight,
  RefreshCw,
  Zap,
  TrendingUp,
  BrainCircuit,
  Activity,
  Server,
  Layers,
  Check,
  X,
  CreditCard,
  ShoppingBag,
  Clock,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { AvanyxWordmark } from './AvanyxWordmark';

interface AuthPortalProps {
  onSuccess?: () => void;
  isOpenModal?: boolean;
  onClose?: () => void;
  initialMode?: 'login' | 'signup' | 'phone' | 'staff';
  onBackToWebsite?: () => void;
}

const COUNTRY_CODES = [
  { code: '+1', label: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: '+92', label: 'Pakistan', flag: '🇵🇰' },
  { code: '+971', label: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: '+33', label: 'France', flag: '🇫🇷' },
  { code: '+91', label: 'India', flag: '🇮🇳' },
  { code: '+65', label: 'Singapore', flag: '🇸🇬' },
  { code: '+81', label: 'Japan', flag: '🇯🇵' },
  { code: '+34', label: 'Spain', flag: '🇪🇸' },
  { code: '+39', label: 'Italy', flag: '🇮🇹' },
  { code: '+55', label: 'Brazil', flag: '🇧🇷' },
  { code: '+27', label: 'South Africa', flag: '🇿🇦' },
];

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onSuccess,
  isOpenModal = false,
  onClose,
  initialMode = 'login',
  onBackToWebsite,
}) => {
  const {
    loginAsOwner,
    signupAsOwner,
    loginWithGoogle,
    sendPhoneOtpCode,
    loginWithPhoneOtpCode,
    loginAsStaff,
    quickLoginAsDemo,
    activeBusiness,
  } = useAvanyx();

  // Active Tab: 'owner' | 'phone' | 'staff' | 'demo'
  const [activeTab, setActiveTab] = useState<'owner' | 'phone' | 'staff'>(() => {
    if (initialMode === 'phone') return 'phone';
    if (initialMode === 'staff') return 'staff';
    
    return 'owner';
  });

  // Sub-modes
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>(() => {
    if (initialMode === 'signup') return 'signup';
    return 'login';
  });

  // Owner Form State
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ownerName, setOwnerName] = useState('');

  // Phone Auth State
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneSending, setPhoneSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Staff Form State
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // UI Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Translate technical errors to clear human instructions
  const formatAuthError = (err: any): string => {
    const raw = err?.message || String(err || '');
    if (raw.includes('user-not-found') || raw.includes('auth/invalid-credential')) {
      return 'Incorrect email or password. Please verify your credentials or create a new account.';
    }
    if (raw.includes('wrong-password')) {
      return 'Incorrect password. Click "Forgot password?" to reset it.';
    }
    if (raw.includes('email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (raw.includes('weak-password')) {
      return 'Password should be at least 6 characters with a combination of letters and numbers.';
    }
    if (raw.includes('popup-closed-by-user')) {
      return 'Google sign-in was cancelled. Please try again when ready.';
    }
    if (raw.includes('too-many-requests')) {
      return 'Too many attempts. For security reasons, please wait 60 seconds before trying again.';
    }
    if (raw.includes('network-request-failed')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    if (raw.includes('invalid-phone-number')) {
      return 'Please enter a valid international mobile phone number.';
    }
    if (raw.includes('invalid-verification-code')) {
      return 'Invalid 6-digit verification code. Please check your SMS or resend code.';
    }
    return raw || 'An unexpected error occurred. Please try again.';
  };

  // Combine full phone string
  const getFullPhoneNumber = () => {
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    const cleanCode = countryCode.trim();
    return `${cleanCode}${cleanNum}`;
  };

  // Handle Phone OTP Request
  const handleSendPhoneOtp = async () => {
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 7) {
      setErrorMsg('Please enter a valid mobile number with area code.');
      return;
    }
    setPhoneSending(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const full = getFullPhoneNumber();
      const res = await sendPhoneOtpCode(full);
      if (!res.success && res.error) {
        throw new Error(res.error);
      }
      setOtpSent(true);
      setCountdown(60);
      setSuccessMsg(`Verification passcode dispatched to ${full}. Enter the 6-digit code below.`);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setPhoneSending(false);
    }
  };

  // Handle OTP input digit change
  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...phoneOtp];
    newOtp[index] = digit;
    setPhoneOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !phoneOtp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Phone OTP Verification
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = phoneOtp.join('');
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const full = getFullPhoneNumber();
      const res = await loginWithPhoneOtpCode(fullOtp, full);
      if (!res.success) {
        throw new Error(res.error || 'Invalid verification code.');
      }
      setSuccessMsg('Phone verified! Launching your Avanyx workspace...');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Owner Email/Password Submission
  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerEmail.trim() || !ownerPassword) {
      setErrorMsg('Please enter both your business email and password.');
      return;
    }

    if (authMode === 'signup') {
      if (!ownerName.trim()) {
        setErrorMsg('Please enter your full name or business owner name.');
        return;
      }
      if (ownerPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (ownerConfirmPassword && ownerPassword !== ownerConfirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter your password.');
        return;
      }
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (authMode === 'signup') {
        const res = await signupAsOwner(ownerEmail.trim(), ownerPassword, ownerName.trim());
        if (!res.success) {
          throw new Error(res.error || 'Failed to create business account.');
        }
        setSuccessMsg('Account created successfully! Initializing store setup...');
      } else {
        const res = await loginAsOwner(ownerEmail.trim(), ownerPassword);
        if (!res.success) {
          throw new Error(res.error || 'Failed to sign in.');
        }
        setSuccessMsg('Welcome back! Synchronizing your cloud business store...');
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Native Google OAuth Popup
  const handleGoogleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        throw new Error(res.error || 'Google sign-in was cancelled or failed.');
      }
      setSuccessMsg('Google Account verified! Accessing Avanyx Cloud...');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Staff Login (Unique Staff ID + Password)
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim()) {
      setErrorMsg('Please enter your assigned Staff ID (e.g. MGR-001, CSH-001).');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await loginAsStaff(staffId.trim(), staffPassword);
      if (!res.success) {
        throw new Error(res.error || 'Invalid Staff ID or Password.');
      }
      setSuccessMsg(`Welcome, ${res.staff?.name || 'Staff Member'} (${res.staff?.roleName || 'Staff'})! Unlocking register...`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Please enter your registered business email.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setResetEmailSent(true);
      setSuccessMsg(`Password reset link sent to ${forgotEmail.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div
      className={`text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative ${
        isOpenModal
          ? 'w-full max-w-xl rounded-3xl border border-slate-200/90 shadow-2xl max-h-[90vh] overflow-y-auto bg-white p-6 sm:p-8'
          : 'w-full bg-[#FAFAFC] min-h-screen flex flex-col'
      }`}
    >
      {/* Invisible container for phone OTP captcha */}
      <div id="recaptcha-container"></div>

      {/* Top Header for Full-page mode */}
      {!isOpenModal && (
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-20 shrink-0 sticky top-0">
          <div className="flex items-center gap-3">
            {onBackToWebsite && (
              <button
                onClick={onBackToWebsite}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-sm cursor-pointer mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Website</span>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-black text-sm">
                V
              </div>
              <AvanyxWordmark size="md" showLivingLine={false} />
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 border-l border-slate-200 pl-3">
              Universal Multi-Device POS & AI Business Brain
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Sync Active</span>
            </div>
          </div>
        </header>
      )}

      {/* Modal Close Button */}
      {isOpenModal && onClose && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black">
              V
            </div>
            <AvanyxWordmark size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Area: Split-screen on Desktop (lg+) or Centered on Modal/Mobile */}
      <div className={`flex-1 flex ${isOpenModal ? 'flex-col' : 'flex-col lg:flex-row'}`}>
        
        {/* Left Side: Visual Product Experience & Telemetry (Visible on Full Page Desktop) */}
        {!isOpenModal && (
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 border-r border-slate-200/80 p-10 xl:p-14 flex-col justify-between relative overflow-hidden">
            
            {/* Subtle Grid Background Pattern */}
            <div
              className="absolute inset-0 opacity-[0.4] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Ambient Soft Blur Highlights */}
            <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Tagline */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide uppercase">
                <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
                <span>Next-Generation Commerce OS</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Your business. <br />
                <span className="text-blue-600">Smarter with AI.</span>
              </h2>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed font-normal">
                Sign in to manage multi-device checkout registers, automated inventory forecasting, live customer CRM, and AI executive insights.
              </p>
            </div>

            {/* Middle: Floating Interactive Dashboard Visual Preview Cards */}
            <div className="relative z-10 my-8 space-y-4 max-w-lg">
              
              {/* Card 1: Live Revenue KPI + Sparkline */}
              <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Live Gross Revenue</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    +18.4% today
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">$24,850.00</div>
                    <div className="text-[11px] text-slate-500 font-medium">1,420 orders across 3 registers</div>
                  </div>
                  
                  {/* Polished SVG Velocity Curve */}
                  <svg className="w-28 h-10 overflow-visible" viewBox="0 0 120 40">
                    <defs>
                      <linearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,35 Q20,30 40,22 T80,14 T120,4 L120,40 L0,40 Z"
                      fill="url(#curveGrad)"
                    />
                    <path
                      d="M0,35 Q20,30 40,22 T80,14 T120,4"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 2: AI Business Brain Autonomous Insight */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-white backdrop-blur-md rounded-2xl border border-indigo-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-indigo-950">AI Demand Forecast</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                    98.6% Accuracy
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  "Peak weekend demand predicted for <strong>Signature Arabica Blend</strong>. Automated restock PO #841 drafted to maintain 100% service uptime."
                </p>
              </div>

              {/* Card 3: Multi-Terminal Node Telemetry */}
              <div className="p-3.5 bg-white/95 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-semibold text-slate-800">Terminal Register 01 (Front Counter)</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span className="text-emerald-600 font-bold">14ms latency</span>
                  <span>•</span>
                  <span>Synced</span>
                </div>
              </div>

            </div>

            {/* Bottom: Trust & Compliance Badges */}
            <div className="relative z-10 pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>SOC2 Type II & PCI-DSS Level 1</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>256-Bit Encrypted Data Sync</span>
              </div>
            </div>

          </div>
        )}

        {/* Right Side: Authentication Panel */}
        <div className={`flex-1 flex flex-col justify-center ${isOpenModal ? 'p-0' : 'p-6 sm:p-10 lg:p-12 xl:p-16'}`}>
          <div className="w-full max-w-md mx-auto">
            
            {/* Card Header & Greeting */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {activeTab === 'owner'
                    ? authMode === 'signup'
                      ? 'Create Your Business Account'
                      : authMode === 'forgot'
                      ? 'Reset Your Password'
                      : 'Welcome Back to Avanyx'
                    : activeTab === 'phone'
                    ? 'Mobile OTP Sign In'
                    : activeTab === 'staff'
                    ? 'Staff Terminal Sign In'
                    : 'Instant Demo Workspaces'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {activeTab === 'owner'
                  ? authMode === 'signup'
                    ? 'Launch your cloud POS, catalog, and AI business intelligence in 60 seconds.'
                    : authMode === 'forgot'
                    ? 'Enter your registered email to receive secure recovery instructions.'
                    : 'Enter your credentials to access your store dashboard and registers.'
                  : activeTab === 'phone'
                  ? 'Sign in securely using your registered mobile number and SMS code.'
                  : activeTab === 'staff'
                  ? 'Enter your assigned Staff ID and password to unlock this terminal.'
                  : 'Experience the full Avanyx operating suite with preloaded test data.'}
              </p>
            </div>

            {/* Segmented Top Tabs */}
            {authMode !== 'forgot' && (
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('owner');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'owner'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span className="truncate">Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('phone');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'phone'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span className="truncate">Phone</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'staff'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                  <span className="truncate">Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('demo');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">Demo</span>
                </button>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* Success Message Banner */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">{successMsg}</div>
              </div>
            )}

            {/* TAB 1: OWNER EMAIL & GOOGLE AUTHENTICATION */}
            {activeTab === 'owner' && (
              <div className="space-y-4">
                
                {/* Mode Selector Pill: Sign In vs Sign Up */}
                {authMode !== 'forgot' && (
                  <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        authMode === 'signup'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {/* Google Sign-In Button */}
                {authMode !== 'forgot' && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleSubmit}
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition border border-slate-200 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs hover:shadow-sm active:scale-[0.99] disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <div className="flex items-center gap-3 my-3">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-[11px] font-medium text-slate-400">or with business email</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                  </>
                )}

                {/* Forgot Password Flow View */}
                {authMode === 'forgot' ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Business Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="owner@yourstore.com"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition shadow-xs"
                        />
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || resetEmailSent}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Send Recovery Link</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer pt-2"
                    >
                      ← Back to Sign In
                    </button>
                  </form>
                ) : (
                  /* Standard Email/Password Form */
                  <form onSubmit={handleOwnerSubmit} className="space-y-3.5 text-xs">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Business Owner Name *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            placeholder="e.g. Alex Henderson"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition shadow-xs"
                          />
                          <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Business Email *</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          placeholder="owner@yourstore.com"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition shadow-xs"
                        />
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-700">Password *</label>
                        {authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgot');
                              setForgotEmail(ownerEmail);
                              setErrorMsg('');
                              setSuccessMsg('');
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition shadow-xs"
                        />
                        <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {authMode === 'signup' && (
                      <>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1.5">Confirm Password *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={ownerConfirmPassword}
                              onChange={(e) => setOwnerConfirmPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition shadow-xs"
                            />
                            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>{authMode === 'signup' ? 'Create Business Account' : 'Sign In to Dashboard'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: MOBILE OTP AUTHENTICATION */}
            {activeTab === 'phone' && (
              <div className="space-y-4 text-xs">
                {!otpSent ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Country & Area</label>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-xs"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.label} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Mobile Phone Number</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="555 019 2834"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-xs"
                        />
                        <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={phoneSending}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {phoneSending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Send 6-Digit SMS Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-bold text-slate-700">Enter 6-Digit Verification Code</label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] text-blue-600 font-semibold hover:underline"
                        >
                          Change Number
                        </button>
                      </div>

                      {/* 6 Digit Input Boxes */}
                      <div className="flex gap-2 justify-between">
                        {phoneOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => { otpInputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-11 h-12 text-center text-lg font-black rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-xs"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Didn't receive code?</span>
                      {countdown > 0 ? (
                        <span className="font-mono text-slate-400">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={phoneSending}
                          className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Resend SMS
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Verify & Unlock Workspace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: STAFF MEMBER AUTHENTICATION */}
            {activeTab === 'staff' && (
              <form onSubmit={handleStaffSubmit} className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed">
                  Terminal access for Shift Managers, Cashiers, Kitchen Staff, and Accountants. Enter your assigned Store Staff ID.
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Assigned Staff ID *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      placeholder="e.g. MGR-001 or CSH-002"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-xs uppercase font-mono"
                    />
                    <UserCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">Staff Password / PIN *</label>
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showStaffPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none shadow-xs"
                    />
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Unlock Terminal Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick Staff Preset Shortcuts */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Quick Staff Testing Presets
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffId('MGR-001');
                        setStaffPassword('Manager123!');
                      }}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left cursor-pointer text-[11px] transition shadow-2xs"
                    >
                      <div className="font-bold text-slate-800">Store Manager</div>
                      <div className="text-slate-500 font-mono text-[10px]">MGR-001</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffId('CSH-001');
                        setStaffPassword('Cashier123!');
                      }}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left cursor-pointer text-[11px] transition shadow-2xs"
                    >
                      <div className="font-bold text-slate-800">Cashier Register</div>
                      <div className="text-slate-500 font-mono text-[10px]">CSH-001</div>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 4: INSTANT DEMO WORKSPACES */}
            {activeTab === 'demo' && (
              <div className="space-y-2.5 text-xs">
                <p className="text-xs text-slate-600 mb-3">
                  Click any role below to test the full Avanyx operating suite with demo data. No password or email needed.
                </p>

                {[
                  {
                    role: 'owner' as const,
                    title: 'Store Owner / Founder',
                    desc: 'Full access, AI Brain, analytics, multi-branch, finance',
                    badge: 'Full Suite',
                    icon: Shield,
                    color: 'text-blue-600 bg-blue-50 border-blue-200',
                  },
                  {
                    role: 'manager' as const,
                    title: 'Store Shift Manager',
                    desc: 'Inventory reordering, staff shifts, order dispatching',
                    badge: 'Operations',
                    icon: Building2,
                    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                  },
                  {
                    role: 'cashier' as const,
                    title: 'Front Cashier Register',
                    desc: 'High-speed touch POS, barcode scan, thermal receipt print',
                    badge: 'POS Desk',
                    icon: ShoppingBag,
                    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                  },
                  {
                    role: 'inventory' as const,
                    title: 'Inventory & Warehouse Lead',
                    desc: 'Barcode audit, stock transfers, supplier purchase orders',
                    badge: 'Logistics',
                    icon: Layers,
                    color: 'text-amber-600 bg-amber-50 border-amber-200',
                  },
                  {
                    role: 'accountant' as const,
                    title: 'Financial Accountant',
                    desc: 'Tax ledgers, P&L reporting, margin audit, refund controls',
                    badge: 'Finance',
                    icon: CreditCard,
                    color: 'text-purple-600 bg-purple-50 border-purple-200',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleDemoClick(item.role)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/40 hover:border-blue-300 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                            <span>{item.title}</span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.2 rounded-md">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer Terms & Security Note */}
            <div className="mt-8 pt-4 border-t border-slate-200/60 text-center text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center justify-center gap-4">
                <span>Enterprise Grade Security</span>
                <span>•</span>
                <span>256-Bit SSL Encrypted</span>
                <span>•</span>
                <span>Cloud Auto-Backup</span>
              </div>
              <div>
                By continuing, you agree to Avanyx's Terms of Service & Privacy Policy.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

