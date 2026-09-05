import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getUserRegistrationsService, getEventsService } from '../services/dataService';
import { EventRegistration, EventItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { CertificateModal } from '../components/CertificateModal';

export const MyRegistrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [certificateEvent, setCertificateEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getUserRegistrationsService(user.uid, (regs) => {
      setRegistrations(regs);
    });
    getEventsService().then(setEvents);
    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <main className="flex-grow pt-20 pb-section-gap px-container-padding text-center">
        <div className="max-w-md mx-auto backdrop-blur-2xl bg-white/[0.04] border border-white/15 p-8 rounded-3xl shadow-xl">
          <span className="material-symbols-outlined text-4xl text-neon-purple mb-3">lock</span>
          <h2 className="text-white text-2xl font-bold mb-2 font-headline-lg">Access Restricted</h2>
          <p className="text-on-surface-variant font-code-sm text-xs leading-relaxed">
            Please sign in to view your verified SDC event registrations and ticket passes.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow pt-[68px] pb-section-gap px-container-padding w-full max-w-7xl mx-auto flex flex-col relative z-10">
      {/* Header Banner */}
      <header className="relative mb-6 p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-[#090d1a]/85 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-cyan/20 border border-electric-cyan/40 text-electric-cyan font-code-sm text-xs font-semibold uppercase tracking-wider mb-3 shadow-[0_0_12px_rgba(14,165,233,0.3)]">
            <span className="material-symbols-outlined text-sm">confirmation_number</span>
            <span>/sys/verified-tickets</span>
          </div>
          <h1 className="font-headline-xl text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            My Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-neon-purple to-white">Tickets & Passes</span>
          </h1>
          <p className="text-white/60 max-w-2xl text-sm md:text-base mt-2 leading-relaxed font-medium">
            Your active registrations, team invite codes, and day-of-event check-in QR passes.
          </p>
        </div>
      </header>

      {registrations.length === 0 ? (
        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/15 rounded-3xl p-8 text-center text-on-surface-variant font-code-sm shadow-xl max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-6xl text-neon-purple/70 mb-3">confirmation_number</span>
          <p className="text-lg text-white font-bold mb-1">No Active Event Registrations</p>
          <p className="text-sm">Head over to the Events Terminal to register for upcoming workshops or hackathons!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map((reg) => {
            const associatedEvent = events.find(e => e.id === reg.eventId);
            const qrPayload = `SDC_TICKET:${reg.id}`;

            return (
              <div
                key={reg.id}
                className="soft-ui-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Status Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/10 relative z-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {reg.passType === 'paid' ? (
                      reg.paymentStatus === 'approved' ? (
                        <span className="font-label-caps text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full uppercase font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span>PAID PASS (₹{reg.amountPaid || 99}) VERIFIED</span>
                        </span>
                      ) : reg.paymentStatus === 'rejected' ? (
                        <span className="font-label-caps text-[10px] bg-error-container/30 text-error border border-error/40 px-3 py-1 rounded-full uppercase font-bold">
                          PAYMENT REJECTED
                        </span>
                      ) : (
                        <span className="font-label-caps text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full uppercase font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">hourglass_top</span>
                          <span>PAYMENT UNDER REVIEW (₹{reg.amountPaid || 99})</span>
                        </span>
                      )
                    ) : (
                      <span className={`font-label-caps text-[10px] px-3 py-1 rounded-full border uppercase font-bold ${
                        reg.status === 'confirmed'
                          ? 'bg-success-glow/20 text-success-glow border-success-glow/40 shadow-sm'
                          : 'bg-tertiary/20 text-tertiary border-tertiary/40'
                      }`}>
                        {reg.status} (FREE PASS)
                      </span>
                    )}

                    {reg.checkedIn ? (
                      <span className="font-label-caps text-[10px] bg-success-glow/20 text-success-glow border border-success-glow/50 px-2.5 py-1 rounded-full uppercase font-bold shadow-sm flex items-center gap-1">
                        ✓ PRESENT (CHECKED IN)
                      </span>
                    ) : (
                      <span className="font-label-caps text-[10px] bg-white/10 text-on-surface-variant border border-white/15 px-2.5 py-1 rounded-full uppercase font-bold">
                        PENDING CHECK-IN
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-xs text-on-surface-variant font-bold">#{reg.id.substring(0, 10)}</span>
                </div>

                {/* Event Details & QR Pass Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center mb-6 relative z-10">
                  {/* Event Details */}
                  <div className="sm:col-span-2 space-y-2.5">
                    <h3 className="font-headline-lg text-xl font-bold text-white leading-snug">
                      {reg.eventTitle}
                    </h3>
                    
                    <div className="text-xs font-code-sm text-on-surface-variant space-y-1.5">
                      <div><strong className="text-white">Participant:</strong> {reg.userName}</div>
                      <div>
                        <strong className="text-white">Pass Type:</strong>{' '}
                        <span className="text-electric-cyan font-bold">
                          {reg.passType === 'paid' ? `Paid Workshop Pass (₹${reg.amountPaid || 99})` : 'Free Pass'}
                        </span>
                      </div>
                      {reg.utrNumber && (
                        <div>
                          <strong className="text-white">UTR Reference:</strong>{' '}
                          <span className="font-mono text-amber-300 font-bold">{reg.utrNumber}</span>
                        </div>
                      )}
                      {reg.phoneNumber && (
                        <div><strong className="text-white">Phone / WhatsApp:</strong> <span className="font-mono text-white">{reg.phoneNumber}</span></div>
                      )}
                      <div><strong className="text-white">College:</strong> {reg.collegeName}</div>
                      <div><strong className="text-white">Roll ID:</strong> <span className="font-mono text-white">{reg.rollNumber}</span></div>
                      {reg.checkedInAt && (
                        <div className="text-success-glow text-[11px]">
                          <strong>Verified at:</strong> {new Date(reg.checkedInAt).toLocaleTimeString()}
                        </div>
                      )}
                      {reg.registrationType === 'team' && (
                        <div className="pt-2">
                          <span className="soft-ui-chip text-neon-purple border-neon-purple/40 px-3 py-1 rounded-full font-bold font-mono text-[11px]">
                            TEAM CODE: {reg.teamCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code Pass OR Locked Pending Review */}
                  <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl soft-ui-inset">
                    {reg.passType === 'paid' && reg.paymentStatus === 'pending_review' ? (
                      <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                          <span className="material-symbols-outlined text-2xl">lock</span>
                        </div>
                        <span className="font-headline-lg text-xs font-bold text-white">Entry Badge Locked</span>
                        <span className="font-code-sm text-[10px] text-amber-300/90 mt-1 max-w-[130px] leading-tight">
                          Awaiting Admin approval for UTR #{reg.utrNumber?.substring(0, 6)}...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="p-2 bg-white rounded-xl shadow-lg">
                          <QRCodeSVG value={qrPayload} size={105} level="H" includeMargin={true} />
                        </div>
                        <span className="font-code-sm text-[9px] text-electric-cyan font-bold mt-2 uppercase tracking-wider">Fast Check-in Pass</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Certificate Option if Event Finished */}
                {associatedEvent?.status === 'completed' && (
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
                    <span className="font-code-sm text-xs text-success-glow flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Attendance Verified</span>
                    </span>
                    <button
                      onClick={() => setCertificateEvent(associatedEvent)}
                      className="soft-ui-btn font-label-caps text-xs text-white px-4 py-2 rounded-full transition-all uppercase font-bold hover:text-neon-purple cursor-pointer"
                    >
                      Download Certificate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {certificateEvent && (
        <CertificateModal
          event={certificateEvent}
          onClose={() => setCertificateEvent(null)}
        />
      )}
    </main>
  );
};
