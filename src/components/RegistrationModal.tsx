import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { EventItem, EventRegistration } from '../types';
import { useAuth } from '../context/AuthContext';
import { registerForEventService } from '../services/dataService';
import { AuthModal } from './AuthModal';

interface RegistrationModalProps {
  event: EventItem;
  onClose: () => void;
  onSuccess: (reg: EventRegistration) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ event, onClose, onSuccess }) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [fullName, setFullName] = useState(user?.displayName || user?.email?.split('@')[0] || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  
  // College Selection (Vardhaman vs Other)
  const isInitialVardhaman = !user?.collegeName || user.collegeName.toLowerCase().includes('vardhaman');
  const [collegeType, setCollegeType] = useState<'vardhaman' | 'other'>(isInitialVardhaman ? 'vardhaman' : 'other');
  const [otherCollegeName, setOtherCollegeName] = useState(isInitialVardhaman ? '' : user?.collegeName || '');
  const initialRoll = (user?.rollNumber && !user.rollNumber.startsWith('REG-') && !user.rollNumber.startsWith('ADM-'))
    ? user.rollNumber
    : '';
  const [rollNumber, setRollNumber] = useState(initialRoll);

  // Pricing & Pass Type
  const isPaidEvent = event.feeType === 'paid' || (event.ticketPrice !== undefined && event.ticketPrice > 0);
  const ticketPrice = event.ticketPrice || 99;
  const upiId = event.upiId || 'sdcvce@okhdfcbank';
  const payeeName = 'Student Developers Club';

  const [passType, setPassType] = useState<'free' | 'paid'>(isPaidEvent ? 'paid' : 'free');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // UPI deep link
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${ticketPrice}&cu=INR&tn=${encodeURIComponent(`SDC ${event.title.substring(0, 18)} Pass`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Screenshot file size must be under 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Team vs Solo
  const [regType, setRegType] = useState<'solo' | 'team'>(event.max_team_size > 1 ? 'team' : 'solo');
  const [teamMode, setTeamMode] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  // Auto-generated 6-character team code for new teams
  const [generatedTeamCode] = useState(() => 'SDC-' + Math.floor(1000 + Math.random() * 9000));
  const [copiedCode, setCopiedCode] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Registration Success state for confirmation view
  const [confirmedReg, setConfirmedReg] = useState<EventRegistration | null>(null);

  // Validate Schedule Window safely
  const now = new Date().getTime();
  const startTime = event.registration_start_time ? new Date(event.registration_start_time).getTime() : 0;
  const endTime = event.registration_end_time ? new Date(event.registration_end_time).getTime() : Infinity;
  const isScheduleLocked = (startTime > 0 && !isNaN(startTime) && now < startTime) || 
                          (endTime < Infinity && !isNaN(endTime) && now > endTime);

  // Validate Inter-College Access
  const isGuestBlocked = role === 'guest' && !event.is_inter_college;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!user.emailVerified) {
      setErrorMsg('Your email address is not verified yet. Please check your inbox for the verification link sent when you registered, or sign in to verify.');
      setShowAuthModal(true);
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your contact phone / WhatsApp number for attendance verification.');
      return;
    }

    const finalCollegeName = collegeType === 'vardhaman' 
      ? 'Vardhaman College of Engineering' 
      : otherCollegeName.trim();

    if (!finalCollegeName) {
      setErrorMsg('Please enter your college / institution name.');
      return;
    }

    if (!rollNumber.trim()) {
      setErrorMsg('Please enter your college roll number or student ID.');
      return;
    }

    let finalTeamCode: string | undefined = undefined;
    let finalTeamName: string | undefined = undefined;

    if (regType === 'team') {
      if (teamMode === 'create') {
        finalTeamCode = generatedTeamCode;
        finalTeamName = teamName.trim() || `${fullName.trim().split(' ')[0]}'s Squad`;
      } else {
        const cleanInput = teamCode.trim().toUpperCase();
        if (!cleanInput) {
          setErrorMsg('Please enter the team code provided by your squad leader.');
          return;
        }
        finalTeamCode = cleanInput;
        finalTeamName = `Team ${cleanInput}`;
      }
    }

    if (passType === 'paid') {
      const cleanUtr = utrNumber.trim();
      if (!cleanUtr) {
        setErrorMsg('Please enter your 12-digit UPI Reference / UTR Number to confirm payment.');
        return;
      }
      if (cleanUtr.length < 6) {
        setErrorMsg('Please enter a valid 12-digit UPI Reference / UTR Number from your payment app.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const reg = await registerForEventService({
        eventId: event.id,
        eventTitle: event.title,
        userId: user.uid,
        userEmail: user.email,
        userName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        collegeName: finalCollegeName,
        rollNumber: rollNumber.trim(),
        registrationType: regType,
        teamCode: finalTeamCode,
        teamName: finalTeamName,
        passType,
        amountPaid: passType === 'paid' ? ticketPrice : 0,
        utrNumber: passType === 'paid' ? utrNumber.trim() : undefined,
        paymentScreenshotUrl: passType === 'paid' ? (paymentScreenshotUrl || undefined) : undefined,
        paymentStatus: passType === 'paid' ? 'pending_review' : 'free_verified',
        status: event.registered_count >= event.max_seats ? 'waitlisted' : 'confirmed'
      });

      setConfirmedReg(reg);
      onSuccess(reg);
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg('Registration failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-deep-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Ambient Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="relative my-auto max-h-[92vh] overflow-y-auto max-w-lg w-full rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-on-surface shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)] bg-gradient-to-b from-[#131b2e]/95 via-[#0b1326]/95 to-[#060e20]/95 backdrop-blur-3xl border border-white/20 ring-1 ring-neon-purple/30 animate-scaleIn">
        {/* Top Specular Sheen */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none rounded-t-3xl"></div>

        {/* Confirmation Screen */}
        {confirmedReg ? (
          <div className="py-4 space-y-6 text-center relative z-10 animate-fadeIn">
            {confirmedReg.passType === 'paid' ? (
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                <span className="material-symbols-outlined text-4xl">hourglass_top</span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-success-glow/20 border border-success-glow/50 flex items-center justify-center text-success-glow mx-auto shadow-[0_0_25px_rgba(34,197,94,0.4)]">
                <span className="material-symbols-outlined text-4xl">verified</span>
              </div>
            )}

            <div>
              {confirmedReg.passType === 'paid' ? (
                <>
                  <span className="font-label-caps text-[10px] bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full uppercase font-bold tracking-wider border border-amber-500/40">
                    PAYMENT PENDING REVIEW (₹{confirmedReg.amountPaid})
                  </span>
                  <h3 className="font-headline-lg text-2xl font-bold text-white mt-2">Pass Under Verification!</h3>
                  <p className="text-xs text-on-surface-variant font-code-sm mt-1">
                    Your registration for <strong className="text-white">{event.title}</strong> has been received with UTR: <strong className="text-amber-300 font-mono">{confirmedReg.utrNumber}</strong>
                  </p>
                </>
              ) : (
                <>
                  <span className="font-label-caps text-[10px] bg-success-glow/20 text-success-glow px-3 py-1 rounded-full uppercase font-bold tracking-wider border border-success-glow/30">
                    OFFICIALLY REGISTERED
                  </span>
                  <h3 className="font-headline-lg text-2xl font-bold text-white mt-2">Registration Confirmed!</h3>
                  <p className="text-xs text-on-surface-variant font-code-sm mt-1">
                    You are officially registered for <strong className="text-white">{event.title}</strong>
                  </p>
                </>
              )}
            </div>

            {/* Attendee Confirmation Summary */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-2 text-xs font-code-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-on-surface-variant">Participant:</span>
                <span className="text-white font-bold">{confirmedReg.userName}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-on-surface-variant">Pass Type:</span>
                <span className="text-white font-bold">
                  {confirmedReg.passType === 'paid' ? `Paid Workshop Pass (₹${confirmedReg.amountPaid})` : 'Free Pass'}
                </span>
              </div>
              {confirmedReg.utrNumber && (
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-on-surface-variant">UTR Reference:</span>
                  <span className="text-amber-300 font-mono font-bold">{confirmedReg.utrNumber}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-on-surface-variant">Phone:</span>
                <span className="text-white font-mono">{confirmedReg.phoneNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-on-surface-variant">College:</span>
                <span className="text-white text-right truncate max-w-[220px]">{confirmedReg.collegeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Roll ID:</span>
                <span className="text-white font-mono">{confirmedReg.rollNumber}</span>
              </div>
            </div>

            {/* Notice for Paid Pass Approval */}
            {confirmedReg.passType === 'paid' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span>Instant Verification Notice</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed font-code-sm">
                  Our SDC coordinators will verify your UPI transaction ID with the club bank account and instantly issue your verified entry QR badge. You can view badge status under <strong>My Passes</strong> anytime!
                </p>
              </div>
            )}

            {/* If Team Registration: Highlight Generated Team Code */}
            {confirmedReg.registrationType === 'team' && confirmedReg.teamCode && (
              <div className="p-4 rounded-2xl bg-electric-cyan/10 border border-electric-cyan/30 text-left space-y-2 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-label-caps uppercase text-electric-cyan font-bold tracking-wider">
                    {confirmedReg.teamName}
                  </span>
                  <span className="text-[10px] font-code-sm text-on-surface-variant">Max: {event.max_team_size} members</span>
                </div>

                <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                  <div>
                    <span className="text-[9px] font-code-sm text-on-surface-variant uppercase block">Shareable Team Code</span>
                    <span className="text-xl font-mono font-extrabold text-electric-cyan tracking-widest">
                      {confirmedReg.teamCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(confirmedReg.teamCode!)}
                    className="px-3 py-1.5 rounded-lg bg-electric-cyan/20 text-electric-cyan hover:bg-electric-cyan hover:text-white text-xs font-code-sm transition-colors flex items-center gap-1 font-bold border border-electric-cyan/30"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-on-surface-variant font-code-sm leading-relaxed">
                  Give this code to your teammates. They can enter it under <strong>"Join With Team Code"</strong> to join your squad.
                </p>
              </div>
            )}

            {/* Ticket Pass Token */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-code-sm text-on-surface-variant">
              <span>Day-of Check-in Pass</span>
              <span className="font-mono text-white font-bold">#{confirmedReg.id.substring(0, 10)}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/my-registrations');
                }}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-neon-purple to-electric-cyan text-white font-label-caps text-xs uppercase font-bold tracking-wider hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-1.5 border border-white/20"
              >
                <span className="material-symbols-outlined text-sm">confirmation_number</span>
                <span>View My Pass</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-label-caps text-xs uppercase font-bold tracking-wider transition-colors border border-white/10"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-label-caps text-[10px] bg-neon-purple/20 text-neon-purple px-2.5 py-0.5 rounded-lg border border-neon-purple/40 uppercase font-bold">
                    {event.category}
                  </span>
                  {event.is_inter_college && (
                    <span className="font-label-caps text-[10px] bg-electric-cyan/20 text-electric-cyan px-2.5 py-0.5 rounded-lg border border-electric-cyan/40 uppercase font-bold">
                      INTER-COLLEGE
                    </span>
                  )}
                </div>
                <h3 className="font-headline-lg text-xl font-bold text-white tracking-tight">{event.title}</h3>
                <p className="text-xs font-code-sm text-on-surface-variant mt-0.5">Date: {event.date}</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-white rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Unauthenticated Prompt */}
            {!user ? (
              <div className="py-6 text-center space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center text-neon-purple mx-auto shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  <span className="material-symbols-outlined text-3xl">account_circle</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Sign In Required</h4>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto leading-relaxed">
                    Please sign in with your Google or college account to register for this event and generate your digital pass.
                  </p>
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-neon-purple to-electric-cyan text-white font-label-caps text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:opacity-95 transition-all border border-white/20"
                >
                  Sign In to Continue
                </button>
              </div>
            ) : (
              <>
                {/* Blocking Messages */}
                {isScheduleLocked && (
                  <div className="bg-error-container/20 border border-error/30 text-error p-4 rounded-2xl font-code-sm text-xs flex items-start gap-3 relative z-10">
                    <span className="material-symbols-outlined text-lg shrink-0">lock_clock</span>
                    <div>
                      <div className="font-bold mb-1">Registration Window Locked</div>
                      <div>
                        Registrations are currently closed. Please check the event schedule or contact SDC Admins.
                      </div>
                    </div>
                  </div>
                )}

                {isGuestBlocked && (
                  <div className="bg-tertiary/15 border border-tertiary/30 text-tertiary p-4 rounded-2xl font-code-sm text-xs flex items-start gap-3 relative z-10">
                    <span className="material-symbols-outlined text-lg shrink-0">admin_panel_settings</span>
                    <div>
                      <div className="font-bold mb-1">Internal College Event Only</div>
                      <div>
                        This workshop is reserved exclusively for internal members with a verified college email domain (<code className="text-white">@vardhaman.org</code>).
                      </div>
                    </div>
                  </div>
                )}

                {!isScheduleLocked && !isGuestBlocked && (
                  <form onSubmit={handleSubmit} className="space-y-4 font-body-md text-xs relative z-10">
                    {errorMsg && (
                      <div className="p-3 bg-error-container/30 border border-error/50 text-error text-xs rounded-xl font-code-sm">
                        {errorMsg}
                      </div>
                    )}

                    {/* Participant Full Name */}
                    <div>
                      <label className="block text-[11px] font-code-sm text-on-surface-variant mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Adhyumna Chowdary"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/50 transition-all"
                      />
                    </div>

                    {/* Institution Selection: Vardhaman vs Other College */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-code-sm text-on-surface-variant uppercase">
                        Institution / College *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCollegeType('vardhaman')}
                          className={`py-2.5 px-3 rounded-xl border font-code-sm text-xs transition-all flex items-center justify-center gap-1.5 ${
                            collegeType === 'vardhaman'
                              ? 'bg-neon-purple/20 border-neon-purple text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                              : 'bg-white/[0.03] border-white/10 text-on-surface-variant hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">school</span>
                          <span>Vardhaman College</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollegeType('other')}
                          className={`py-2.5 px-3 rounded-xl border font-code-sm text-xs transition-all flex items-center justify-center gap-1.5 ${
                            collegeType === 'other'
                              ? 'bg-electric-cyan/20 border-electric-cyan text-white font-bold shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                              : 'bg-white/[0.03] border-white/10 text-on-surface-variant hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">domain</span>
                          <span>Other College</span>
                        </button>
                      </div>

                      {/* If Other College: Show Custom Text Input */}
                      {collegeType === 'other' && (
                        <div className="pt-1.5 animate-fadeIn">
                          <label className="block text-[10px] font-code-sm text-electric-cyan mb-1">
                            Type Your College / University Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Chaitanya Bharathi Institute of Technology (CBIT)"
                            value={otherCollegeName}
                            onChange={(e) => setOtherCollegeName(e.target.value)}
                            className="w-full bg-white/[0.05] border border-electric-cyan/40 rounded-xl p-2.5 text-white focus:outline-none focus:border-electric-cyan"
                          />
                        </div>
                      )}
                    </div>

                    {/* Phone Number & Roll / Student ID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-code-sm text-on-surface-variant mb-1">
                          Phone / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 98765 43210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-neon-purple font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-code-sm text-on-surface-variant mb-1">
                          Roll / Student ID *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 24881A05B4"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-neon-purple font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Registration Mode Selector (Solo vs Team) */}
                    {event.max_team_size > 1 && (
                      <div>
                        <label className="block text-[11px] font-code-sm text-on-surface-variant uppercase mb-1.5">
                          Registration Mode (Max Team: {event.max_team_size})
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setRegType('solo')}
                            className={`py-2.5 px-3 rounded-xl border font-code-sm text-xs transition-all flex items-center justify-center gap-2 ${
                              regType === 'solo'
                                ? 'bg-neon-purple/25 border-neon-purple text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'bg-white/[0.03] border-white/10 text-on-surface-variant hover:text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">person</span> Solo
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegType('team')}
                            className={`py-2.5 px-3 rounded-xl border font-code-sm text-xs transition-all flex items-center justify-center gap-2 ${
                              regType === 'team'
                                ? 'bg-neon-purple/25 border-neon-purple text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'bg-white/[0.03] border-white/10 text-on-surface-variant hover:text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">groups</span> Team
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Team Specific Inputs */}
                    {regType === 'team' && (
                      <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex gap-4 border-b border-white/10 pb-2">
                          <button
                            type="button"
                            onClick={() => setTeamMode('create')}
                            className={`font-label-caps text-xs pb-1 transition-colors ${
                              teamMode === 'create' ? 'text-electric-cyan border-b-2 border-electric-cyan font-bold' : 'text-on-surface-variant'
                            }`}
                          >
                            Create New Team
                          </button>
                          <button
                            type="button"
                            onClick={() => setTeamMode('join')}
                            className={`font-label-caps text-xs pb-1 transition-colors ${
                              teamMode === 'join' ? 'text-electric-cyan border-b-2 border-electric-cyan font-bold' : 'text-on-surface-variant'
                            }`}
                          >
                            Join With Team Code
                          </button>
                        </div>

                        {teamMode === 'create' ? (
                          <div className="space-y-2.5">
                            {/* Auto-Generated Code Preview */}
                            <div className="p-3 rounded-xl bg-electric-cyan/10 border border-electric-cyan/30 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-code-sm uppercase tracking-wider text-electric-cyan font-bold block">
                                  Auto-Generated Team Code
                                </span>
                                <span className="text-base font-mono font-bold text-white tracking-widest">
                                  {generatedTeamCode}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(generatedTeamCode)}
                                className="px-2.5 py-1 rounded-lg bg-electric-cyan/20 text-electric-cyan hover:bg-electric-cyan hover:text-white text-xs font-code-sm transition-colors flex items-center gap-1 font-bold"
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {copiedCode ? 'check' : 'content_copy'}
                                </span>
                                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] font-code-sm text-on-surface-variant mb-1">
                                Team / Squad Name <span className="text-outline font-normal">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                placeholder={`e.g. ${fullName ? fullName.split(' ')[0] + "'s Squad" : 'Cyber Squad'}`}
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-neon-purple"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-code-sm text-on-surface-variant mb-1">Enter 6-char Team Code</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. SDC-4892"
                              value={teamCode}
                              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white font-mono uppercase focus:outline-none focus:border-electric-cyan"
                            />
                            <p className="text-[10px] text-on-surface-variant font-code-sm mt-1">
                              Ask your squad leader for their generated team code.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pass Type Header */}
                    <div className="space-y-2 pt-1">
                      {isPaidEvent ? (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neon-purple/15 to-electric-cyan/15 border border-amber-500/40 space-y-1 relative overflow-hidden shadow-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-amber-400 text-lg">workspace_premium</span>
                              <span className="font-headline-lg font-bold text-sm text-white">Paid Workshop Pass</span>
                            </div>
                            <span className="font-mono text-lg font-extrabold text-amber-300">₹{ticketPrice}</span>
                          </div>
                          <p className="text-[11px] text-white/80 font-code-sm leading-relaxed">
                            Official ticket for <strong>{event.title}</strong>. Includes hands-on project kit, verified certificate badge, and direct seat reservation.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-electric-cyan text-base">confirmation_number</span>
                            <span className="font-headline-lg font-bold text-xs text-white">Free Entry Pass</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-electric-cyan">₹0</span>
                        </div>
                      )}
                    </div>

                    {/* If Paid Event: UPI Payment Widget */}
                    {isPaidEvent && (
                      <div className="p-4 rounded-2xl bg-[#0e1628]/95 border border-neon-purple/40 space-y-3.5 shadow-lg animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-neon-purple text-base">payments</span>
                            <span className="font-bold text-white text-xs">Official SDC UPI Transfer</span>
                          </div>
                          <span className="font-mono font-bold text-amber-300 text-sm">₹{ticketPrice}.00</span>
                        </div>

                        {/* QR Code & Mobile Deep Link */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-3.5 rounded-xl border border-white/10">
                          <div className="bg-white p-2 rounded-xl shadow-md shrink-0 flex items-center justify-center">
                            <QRCodeSVG
                              value={upiDeepLink}
                              size={110}
                              level="M"
                              includeMargin={false}
                            />
                          </div>
                          <div className="space-y-2 text-center sm:text-left flex-1">
                            <div className="text-[10px] font-code-sm text-on-surface-variant leading-relaxed">
                              Scan with <strong className="text-white">Google Pay / PhonePe / Paytm / BHIM</strong>
                            </div>

                            {/* Mobile Deep Link Button */}
                            <a
                              href={upiDeepLink}
                              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold font-code-sm hover:opacity-95 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              <span>Pay with any UPI App</span>
                            </a>

                            {/* Copy UPI ID */}
                            <div className="flex items-center justify-between bg-white/[0.04] px-2.5 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono">
                              <span className="text-white/80 truncate max-w-[150px] sm:max-w-[180px]">{upiId}</span>
                              <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="text-electric-cyan hover:text-white transition-colors ml-2 font-code-sm text-[10px] shrink-0 font-bold"
                              >
                                {copiedUpi ? '✓ Copied' : 'Copy UPI'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Step 2: 12-Digit UTR Input */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-code-sm text-amber-300 font-bold flex items-center justify-between">
                            <span>Enter 12-Digit UPI Ref / UTR Number *</span>
                            <span className="text-[9px] text-white/50 font-normal">Check transaction receipt</span>
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={22}
                            placeholder="e.g. 428190348219"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                            className="w-full bg-black/40 border border-amber-500/40 rounded-xl p-2.5 text-white font-mono placeholder-white/30 text-xs focus:outline-none focus:border-amber-400"
                          />
                          <p className="text-[10px] text-white/50 font-code-sm">
                            💡 Found on your payment receipt under &quot;UPI Ref No.&quot; or &quot;UTR&quot;.
                          </p>
                        </div>

                        {/* Optional Screenshot Upload */}
                        <div className="pt-1 border-t border-white/10">
                          <label className="block text-[10px] font-code-sm text-on-surface-variant mb-1 flex items-center justify-between">
                            <span>Upload Payment Screenshot (Optional)</span>
                            {paymentScreenshotUrl && <span className="text-emerald-400 font-bold">✓ Attached</span>}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="w-full text-xs font-code-sm text-on-surface-variant file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Capacity status */}
                    <div className="flex justify-between items-center text-xs font-code-sm text-on-surface-variant pt-2 border-t border-white/10">
                      <span>Capacity Status:</span>
                      <span className="text-electric-cyan font-bold">
                        {Math.max(0, event.max_seats - event.registered_count)} Seats Available
                      </span>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-neon-purple to-electric-cyan text-white py-3 rounded-2xl font-label-caps text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:opacity-95 transition-all flex items-center justify-center gap-2 border border-white/20"
                      >
                        {submitting ? (
                          <span>Registering & Generating Pass...</span>
                        ) : (
                          <>
                            <span>
                              {passType === 'paid' ? `Submit Registration & UTR (₹${ticketPrice})` : 'Confirm Free Registration'}
                            </span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>,
    document.body
  );
};
