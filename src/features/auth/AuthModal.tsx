import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  Phone,
  Check,
  Eye,
  EyeOff,
  WifiOff,
  HardDrive,
  LogOut,
  Trash2,
  Loader2,
  ChevronDown,
  Search,
  KeyRound,
  User,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile as fbUpdateProfile,
  signOut,
  AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../lib/storage/libraryStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

interface Country {
  name: string;
  dialCode: string;
  code: string;
  flag: string;
}

const COUNTRY_LIST: Country[] = [
  { name: 'India', dialCode: '+91', code: 'IN', flag: '🇮🇳' },
  { name: 'United States', dialCode: '+1', code: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', dialCode: '+44', code: 'GB', flag: '🇬🇧' },
  { name: 'United Arab Emirates', dialCode: '+971', code: 'AE', flag: '🇦🇪' },
  { name: 'Canada', dialCode: '+1', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', dialCode: '+61', code: 'AU', flag: '🇦🇺' },
  { name: 'Germany', dialCode: '+49', code: 'DE', flag: '🇩🇪' },
  { name: 'France', dialCode: '+33', code: 'FR', flag: '🇫🇷' },
  { name: 'Singapore', dialCode: '+65', code: 'SG', flag: '🇸🇬' },
  { name: 'Saudi Arabia', dialCode: '+966', code: 'SA', flag: '🇸🇦' },
  { name: 'Pakistan', dialCode: '+92', code: 'PK', flag: '🇵🇰' },
  { name: 'Bangladesh', dialCode: '+880', code: 'BD', flag: '🇧🇩' },
  { name: 'Nepal', dialCode: '+977', code: 'NP', flag: '🇳🇵' },
  { name: 'Japan', dialCode: '+81', code: 'JP', flag: '🇯🇵' },
  { name: 'Brazil', dialCode: '+55', code: 'BR', flag: '🇧🇷' },
  { name: 'Nigeria', dialCode: '+234', code: 'NG', flag: '🇳🇬' },
  { name: 'South Africa', dialCode: '+27', code: 'ZA', flag: '🇿🇦' },
  { name: 'New Zealand', dialCode: '+64', code: 'NZ', flag: '🇳🇿' },
];

function friendlyAuthError(err: unknown): string {
  const code = (err as AuthError)?.code ?? '';
  const message = (err as any)?.message ?? '';
  const map: Record<string, string> = {
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': '',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-verification-code': 'Invalid verification code. Please check and re-enter.',
    'auth/invalid-phone-number': 'Invalid phone number. Please check the digits.',
    'auth/quota-exceeded': 'SMS quota reached. Try again later or use email.',
    'auth/missing-phone-number': 'Please enter a phone number.',
    'auth/configuration-not-found': 'Firebase Authentication is not yet enabled in Firebase Console. Please enable Email/Google/Phone under Sign-in method.',
  };
  return map[code] ?? (message || 'Something went wrong. Please try again.');
}

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen } = usePlayerStore();
  const { profile, updateProfile } = useLibraryStore();
  const { isForcedOffline, toggleForcedOffline } = useNetworkStatus();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'phone' | 'settings'>(
    profile.provider !== 'guest' ? 'settings' : 'signin'
  );

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email OTP Signup State
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);

  // Phone OTP State
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRY_LIST[0]);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const countryMenuRef = useRef<HTMLDivElement>(null);

  const cachedArtistsCount = offlineMetadataCache.getOfflineArtists().length;
  const cachedPlaylistsCount = offlineMetadataCache.getOfflinePlaylists().length;

  // Countdown timer for resending email OTP
  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setTimeout(() => setEmailCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  // Click outside to close country dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryMenuRef.current && !countryMenuRef.current.contains(e.target as Node)) {
        setShowCountryMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = undefined;
      }
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (!authModalOpen) return null;

  const switchMode = (mode: typeof authMode) => {
    setAuthMode(mode);
    setAuthError(null);
    setEmailOtpSent(false);
    setEmailOtp('');
    setPhoneOtpSent(false);
    setPhoneOtp('');
    setShowCountryMenu(false);
  };

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      updateProfile({
        id: user.uid,
        name: user.displayName || 'Aura Listener',
        email: user.email || '',
        isAnonymous: false,
        provider: 'google',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      });
      setAuthMode('settings');
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Email Sign-In (Existing User) ───────────────────────────────────────────
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      updateProfile({
        id: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email || email,
        isAnonymous: false,
        provider: 'email',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      });
      setAuthMode('settings');
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Email Signup Step 1: Send OTP to Email ──────────────────────────────────
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: signupName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      if (!data.emailSent) {
        console.warn('[Aura Auth] SMTP not configured. OTP printed to server terminal.');
      }
      setEmailOtpSent(true);
      setEmailCountdown(45);
    } catch (err: any) {
      setAuthError(err.message || 'Unable to send verification email. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Email Signup Step 2: Verify OTP & Create Firebase Account ───────────────
  const handleVerifyEmailOtpAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.trim().length !== 6) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      // 1. Verify OTP with backend
      const vRes = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: emailOtp.trim() }),
      });
      const vData = await vRes.json();
      if (!vRes.ok) {
        throw new Error(vData.error || 'Invalid verification code');
      }

      // 2. Create authenticated Firebase account
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      const displayName = signupName.trim() || email.split('@')[0];
      await fbUpdateProfile(user, { displayName });

      updateProfile({
        id: user.uid,
        name: displayName,
        email: user.email || email,
        isAnonymous: false,
        provider: 'email',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      });

      setAuthMode('settings');
    } catch (err: any) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Phone — Send OTP with Country Code & reCAPTCHA Fix ──────────────────────
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/^0+/, '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 6) {
      setAuthError('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      // 1. Permanently fix "reCAPTCHA has already been rendered in this element"
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = '';
      }
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = undefined;
      }

      // 2. Initialize verifier on clean element
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current!,
        {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            if (recaptchaContainerRef.current) {
              recaptchaContainerRef.current.innerHTML = '';
            }
            window.recaptchaVerifier = undefined;
          },
        }
      );

      const fullPhoneNumber = `${selectedCountry.dialCode}${cleanDigits}`;
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        window.recaptchaVerifier
      );
      confirmationResultRef.current = confirmation;
      setPhoneOtpSent(true);
    } catch (err: any) {
      setAuthError(friendlyAuthError(err));
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = undefined;
      }
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = '';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Phone — Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtp.length < 6) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }
    if (!confirmationResultRef.current) {
      setAuthError('Session expired. Please resend the OTP.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      const result = await confirmationResultRef.current.confirm(phoneOtp);
      const user = result.user;
      const cleanDigits = phone.replace(/\D/g, '');
      const lastDigits = cleanDigits.slice(-4) || 'VIP';

      updateProfile({
        id: user.uid,
        name: user.displayName || `Listener +${selectedCountry.dialCode} ${lastDigits}`,
        email: user.email || `${cleanDigits}@phone.aura.audio`,
        isAnonymous: false,
        provider: 'email',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      });
      setAuthMode('settings');
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try { await signOut(auth); } catch (_) {}
    updateProfile({
      id: 'guest',
      name: 'Guest Audiophile',
      email: 'guest@aura.audio',
      isAnonymous: true,
      provider: 'guest',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=guest`,
    });
    setAuthMode('signin');
  };

  // Filter countries for country picker search
  const filteredCountries = COUNTRY_LIST.filter(c => 
    c.name.toLowerCase().includes(countryQuery.toLowerCase()) ||
    c.dialCode.includes(countryQuery) ||
    c.code.toLowerCase().includes(countryQuery.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Member Authentication & Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn"
    >
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

      <div 
        className="relative w-full max-w-3xl bg-[#0d0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-slate-100 min-h-[520px]"
        style={{
          boxShadow: '0 25px 60px -15px var(--aura-glow, rgba(0,0,0,0.8))',
        }}
      >
        {/* Left Side: Visual Pane (Desktop) */}
        <div className="hidden md:flex md:w-5/12 relative flex-col justify-between p-8 bg-gradient-to-br from-indigo-950/80 via-slate-950 to-black overflow-hidden border-r border-white/10">
          <div 
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ backgroundColor: 'var(--aura-primary, #6366f1)' }}
          />

          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--aura-primary,#6366f1)]" />
              <span className="text-xs font-mono tracking-widest text-slate-300 uppercase">AURA SOUND LAB</span>
            </div>
            <h3 className="text-2xl font-extrabold text-white leading-tight">
              Unlock Your Private Acoustic Sanctuary
            </h3>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Synchronize custom playlists, cloud listening history, Car Group Jam sessions, and offline caching across all devices.
            </p>
          </div>

          <div className="space-y-2 pt-6 border-t border-white/10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>320 kbps lossless acoustic streaming</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-device Car Jam playback sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Synced real-time line-by-line lyrics</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form or Settings */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-3 sm:gap-4 border-b border-white/10 pb-3 mb-6 overflow-x-auto no-scrollbar">
              {profile.provider === 'guest' ? (
                <>
                  {(['signin', 'signup', 'phone'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className={`text-xs sm:text-sm font-semibold transition-colors pb-1 border-b-2 whitespace-nowrap cursor-pointer ${
                        authMode === m
                          ? 'border-[var(--aura-primary,#6366f1)] text-white'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {m === 'signin' ? 'Sign In' : m === 'signup' ? 'Create Account' : 'Phone OTP'}
                    </button>
                  ))}
                </>
              ) : null}

              <button
                onClick={() => switchMode('settings')}
                className={`text-xs sm:text-sm font-semibold transition-colors pb-1 border-b-2 whitespace-nowrap cursor-pointer ${
                  authMode === 'settings'
                    ? 'border-[var(--aura-primary,#6366f1)] text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Settings & Network
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
                {authError}
              </div>
            )}

            {/* TAB: Settings & Offline */}
            {authMode === 'settings' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{profile.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {profile.provider.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{profile.email}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isForcedOffline ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'
                      }`}>
                        <WifiOff className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Go Offline (Simulate)</h5>
                        <p className="text-[11px] text-slate-400">Test cached catalog without disabling Wi-Fi</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isForcedOffline}
                      onClick={toggleForcedOffline}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isForcedOffline ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isForcedOffline ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      offlineMetadataCache.clearCache();
                      window.location.reload();
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Offline Cache</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Google One-Click Button (for Sign In & Sign Up) */}
            {(authMode === 'signin' || (authMode === 'signup' && !emailOtpSent)) && (
              <>
                <button
                  onClick={handleGoogleAuth}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md mb-4 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative px-3 bg-[#0d0f17] text-[11px] text-slate-500 uppercase tracking-wider">
                    or with email
                  </span>
                </div>
              </>
            )}

            {/* TAB: Sign In Form (Existing User) */}
            {authMode === 'signin' && (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Email</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--aura-secondary,#8b5cf6)] to-[var(--aura-primary,#6366f1)] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB: Create Account with Email OTP Flow */}
            {authMode === 'signup' && (
              <div>
                {!emailOtpSent ? (
                  <form onSubmit={handleSendEmailOtp} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Your Name</label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Audiophile Member"
                          className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@domain.com"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Create Password</label>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          className="w-full pl-9 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--aura-secondary,#8b5cf6)] to-[var(--aura-primary,#6366f1)] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Send Email Verification Code →</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailOtpAndSignup} className="space-y-4 animate-fadeIn">
                    <div className="text-center mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto mb-2">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Enter Email Verification Code</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        We sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>. Please check your inbox and spam folder.
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        autoFocus
                        required
                        className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || emailOtp.length !== 6}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--aura-secondary,#8b5cf6)] to-[var(--aura-primary,#6366f1)] disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Verify & Create Account</span>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOtpSent(false);
                          setEmailOtp('');
                          setAuthError(null);
                        }}
                        className="flex items-center gap-1 text-slate-400 hover:text-white"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Email</span>
                      </button>

                      <button
                        type="button"
                        disabled={emailCountdown > 0 || isSubmitting}
                        onClick={handleSendEmailOtp}
                        className="flex items-center gap-1 text-[var(--aura-primary,#6366f1)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{emailCountdown > 0 ? `Resend in ${emailCountdown}s` : 'Resend code'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB: Phone OTP with Country Code Picker */}
            {authMode === 'phone' && (
              <div className="space-y-4">
                {!phoneOtpSent ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Mobile Number</label>
                      <div className="relative flex items-center gap-2">
                        {/* Country Code Picker Dropdown Button */}
                        <div className="relative" ref={countryMenuRef}>
                          <button
                            type="button"
                            onClick={() => setShowCountryMenu(!showCountryMenu)}
                            className="h-10 px-3 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white font-medium transition-colors shrink-0 cursor-pointer"
                          >
                            <span className="text-base">{selectedCountry.flag}</span>
                            <span>{selectedCountry.dialCode}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>

                          {/* Country Dropdown Menu */}
                          {showCountryMenu && (
                            <div className="absolute top-12 left-0 z-30 w-64 max-h-64 bg-[#141724] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
                              <div className="p-2 border-b border-white/10">
                                <div className="relative flex items-center">
                                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={countryQuery}
                                    onChange={(e) => setCountryQuery(e.target.value)}
                                    placeholder="Search country or code..."
                                    className="w-full pl-8 pr-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                                    autoFocus
                                  />
                                </div>
                              </div>

                              <div className="overflow-y-auto flex-1 p-1">
                                {filteredCountries.map((c) => (
                                  <button
                                    key={`${c.code}-${c.dialCode}`}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setShowCountryMenu(false);
                                      setCountryQuery('');
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                                      selectedCountry.code === c.code && selectedCountry.dialCode === c.dialCode
                                        ? 'bg-[var(--aura-primary,#6366f1)]/20 text-white font-semibold'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <span>{c.flag}</span>
                                      <span className="truncate">{c.name}</span>
                                    </span>
                                    <span className="font-mono text-slate-400 text-[11px] shrink-0 ml-2">
                                      {c.dialCode}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Phone Number Input */}
                        <div className="relative flex-1 flex items-center">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="99962 31869"
                            required
                            className="w-full pl-9 pr-3 h-10 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-primary,#6366f1)] font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 font-medium text-xs flex items-center justify-center gap-2 shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Send Verification OTP</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Enter 6-Digit SMS Code sent to {selectedCountry.dialCode} {phone}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        required
                        autoFocus
                        className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || phoneOtp.length !== 6}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--aura-secondary,#8b5cf6)] to-[var(--aura-primary,#6366f1)] disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Verify & Sign In</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPhoneOtpSent(false);
                        setPhoneOtp('');
                        setAuthError(null);
                      }}
                      className="w-full text-center text-xs text-slate-400 hover:text-white"
                    >
                      ← Change phone number
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            {authMode !== 'settings' ? (
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Continue as guest listener
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Close Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
