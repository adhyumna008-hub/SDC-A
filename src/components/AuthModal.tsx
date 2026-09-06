import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resendVerificationEmail, 
    checkEmailVerification, 
    signOutUser 
  } = useAuth();
  
  const [tab, setTab] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Email verification state (active only for first-time email/password registrations)
  const [verificationPending, setVerificationPending] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState('');
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Open directly to email verification screen if user is already logged in but unverified
  React.useEffect(() => {
    if (isOpen) {
      if (user && !user.emailVerified) {
        if (user.email) setEmail(user.email);
        setVerificationPending(true);
      } else if (!user) {
        setVerificationPending(false);
      }
    }
  }, [isOpen, user]);

  // Auto-close modal whenever user is successfully authenticated and verified (or via Google)
  React.useEffect(() => {
    if (user && isOpen && !verificationPending) {
      if (user.emailVerified) {
        setSubmitting(false);
        onClose();
      }
    }
  }, [user, isOpen, verificationPending, onClose]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      setVerificationPending(false);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Google sign-in could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (tab === 'signin') {
        await signInWithEmail(email, password);
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          setVerificationPending(true);
          setResendCooldown(60);
          setVerificationMsg('Please verify your email address to continue.');
          setIsVerifiedSuccess(false);
        } else {
          onClose();
        }
      } else {
        // First-time email registration: creates user and dispatches verification link
        const result = await signUpWithEmail(email, password, displayName, collegeName, rollNumber);
        if (result && !result.isNewUser && result.emailVerified) {
          // Account already existed and is verified -> close modal
          onClose();
        } else {
          // New account or pending verification -> immediately switch to verification screen!
          setVerificationPending(true);
          setResendCooldown(60);
          setVerificationMsg('');
          setIsVerifiedSuccess(false);
        }
      }
    } catch (e: any) {
      console.error('Auth error:', e);
      let msg = e.message || 'Authentication error';
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
        msg = tab === 'signup'
          ? 'An account with this email already exists. Switch to Sign In or enter the correct password.'
          : 'Invalid email or password. If you are new, switch to "Create Account"!';
      } else if (e.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to the Sign In tab!';
        setTab('signin');
      } else if (e.code === 'auth/weak-password') {
        msg = 'Password must be at least 6 characters.';
      } else if (e.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (e.code === 'auth/network-request-failed') {
        msg = 'Network error. Please check your internet connection and try again.';
      } else if (e.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please wait a moment and try again.';
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    setVerificationMsg('');
    try {
      const verified = await checkEmailVerification();
      if (verified) {
        setIsVerifiedSuccess(true);
        setVerificationMsg('Email verified successfully! Activating your account...');
        setTimeout(() => {
          setVerificationPending(false);
          onClose();
        }, 1200);
      } else {
        setIsVerifiedSuccess(false);
        setVerificationMsg('Verification not detected yet. Please open the email sent to you, click the link, and try again.');
      }
    } catch (err: any) {
      setVerificationMsg('Could not verify status. Please check your internet connection.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendVerificationEmail();
      setResendCooldown(60);
      setIsVerifiedSuccess(true);
      setVerificationMsg('A fresh verification link has been sent to your email.');
    } catch (err: any) {
      setIsVerifiedSuccess(false);
      setVerificationMsg('Failed to resend email. Please try again in a moment.');
    }
  };

  const handleCancelVerification = async () => {
    await signOutUser();
    setVerificationPending(false);
    setVerificationMsg('');
    setTab('signup');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-deep-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Ambient Glow Orbs */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-purple/25 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="fixed bottom-1/4 right-1/3 w-80 h-80 bg-electric-cyan/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Modal Container */}
      <div className="relative my-auto max-h-[90vh] overflow-y-auto max-w-md w-full rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-on-surface shadow-soft-ui-lg bg-gradient-to-b from-[#131b2e]/95 via-[#0b1326]/95 to-[#060e20]/95 backdrop-blur-3xl border border-white/20 ring-1 ring-neon-purple/30 no-scrollbar animate-scaleIn">
        
        {/* Top Specular Sheen */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none rounded-t-3xl"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <span className="material-symbols-outlined text-lg">
                {verificationPending ? 'mark_email_unread' : 'terminal'}
              </span>
            </div>
            <div>
              <h2 className="font-headline-lg text-lg font-bold text-white tracking-tight">
                {verificationPending ? 'Verify Email' : 'SDC Terminal'}
              </h2>
              <p className="text-[10px] font-code-sm text-on-surface-variant uppercase tracking-wider">
                {verificationPending ? 'Identity Confirmation' : 'Authentication Portal'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-white rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && !verificationPending && (
          <div className="p-3 bg-error-container/30 border border-error/40 text-error text-xs rounded-xl font-code-sm leading-relaxed backdrop-blur-md relative z-10 shadow">
            {errorMsg}
          </div>
        )}

        {/* VIEW 1: EMAIL VERIFICATION PENDING (First-time email registration only) */}
        {verificationPending ? (
          <div className="relative z-10 py-2 text-center space-y-5 animate-fadeIn">
            {/* Animated Glowing Envelope Icon */}
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-neon-purple/10 border border-neon-purple/40 flex items-center justify-center text-neon-purple shadow-aurora">
              <span className="material-symbols-outlined text-4xl animate-bounce">mark_email_unread</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-electric-cyan animate-ping"></span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-code-sm text-electric-cyan shadow-soft-ui-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-pulse"></span>
                <span>VERIFICATION_LINK // DISPATCHED</span>
              </div>
              <h3 className="font-headline-lg text-2xl font-bold text-white tracking-tight">
                Check Your Inbox
              </h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                We've sent an official verification activation link to:
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-xs shadow-soft-ui-inset">
                {email}
              </div>
              <p className="text-[11px] text-white/60 max-w-xs mx-auto pt-1 leading-relaxed">
                Click the verification link inside your email (check Spam or Promotions if needed), then confirm below.
              </p>
            </div>

            {verificationMsg && (
              <div className={`p-3 rounded-xl text-xs font-code-sm leading-relaxed border ${
                isVerifiedSuccess 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-200'
              }`}>
                {verificationMsg}
              </div>
            )}

            {/* Verification Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                className="w-full bg-gradient-to-r from-neon-purple via-[#9333ea] to-electric-cyan text-white py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-wider font-bold hover:opacity-95 transition-all shadow-aurora border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {checkingVerification ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>I've Clicked the Verification Link</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0}
                  className="flex-1 soft-ui-btn text-white/80 hover:text-white py-2.5 px-3 rounded-xl text-[11px] font-code-sm transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Link'}
                </button>

                <button
                  type="button"
                  onClick={handleCancelVerification}
                  className="flex-1 soft-ui-btn text-white/60 hover:text-white py-2.5 px-3 rounded-xl text-[11px] font-code-sm transition-all border border-white/10 cursor-pointer"
                >
                  Change Email
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: STANDARD GOOGLE OR EMAIL LOGIN / SIGNUP */
          <>
            {/* Method 1: Google One-Click Login */}
            <div className="relative z-10 space-y-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleLogin}
                className="w-full bg-white/[0.06] hover:bg-white/[0.12] text-white py-3.5 px-4 rounded-2xl border border-white/20 hover:border-neon-purple/60 transition-all duration-300 font-label-caps text-xs flex items-center justify-center gap-3 shadow-lg glow-hover font-bold backdrop-blur-xl cursor-pointer"
              >
                {/* Google SVG Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 relative z-10 text-on-surface-variant font-code-sm text-[11px] uppercase tracking-wider">
              <div className="flex-1 h-px bg-white/10"></div>
              <span>or with email</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Method 2: Email / Password Form */}
            <div className="relative z-10">
              {/* Frosted Tab Switcher */}
              <div className="flex rounded-2xl bg-white/[0.04] p-1 border border-white/10 mb-4 font-label-caps text-xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => { setTab('signin'); setErrorMsg(''); }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    tab === 'signin'
                      ? 'bg-gradient-to-r from-neon-purple to-neon-purple/90 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setErrorMsg(''); }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    tab === 'signup'
                      ? 'bg-gradient-to-r from-neon-purple to-neon-purple/90 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3.5 font-body-md text-xs">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adhyumna Chowdary"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-purple focus:bg-white/[0.08] focus:ring-1 focus:ring-neon-purple/50 transition-all backdrop-blur-md"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com or @vardhaman.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-purple focus:bg-white/[0.08] focus:ring-1 focus:ring-neon-purple/50 transition-all backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-purple focus:bg-white/[0.08] focus:ring-1 focus:ring-neon-purple/50 transition-all backdrop-blur-md"
                  />
                </div>

                {tab === 'signup' && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">College / Univ</label>
                      <input
                        type="text"
                        placeholder="Vardhaman / IIT"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-purple transition-all backdrop-blur-md"
                      />
                    </div>
                    <div>
                      <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">Roll / Student ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 24881A05B4"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white font-mono uppercase focus:outline-none focus:border-neon-purple transition-all backdrop-blur-md"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-neon-purple via-[#9333ea] to-electric-cyan text-white py-3.5 rounded-2xl font-label-caps text-xs uppercase tracking-wider font-bold hover:opacity-95 transition-all shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-white/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Authenticating...</span>
                      </>
                    ) : tab === 'signin' ? (
                      'Sign In with Email'
                    ) : (
                      'Create Account & Send Verification Link'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
