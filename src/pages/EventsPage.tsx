import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeEventsService, getUserRegistrationsService } from '../services/dataService';
import { EventItem, EventRegistration } from '../types';
import { useAuth } from '../context/AuthContext';
import { RegistrationModal } from '../components/RegistrationModal';
import { CertificateModal } from '../components/CertificateModal';

export const EventsPage: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<EventRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [interCollegeOnly, setInterCollegeOnly] = useState<boolean>(role === 'guest');

  // Modal states
  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);
  const [certificateEvent, setCertificateEvent] = useState<EventItem | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeEvents = subscribeEventsService((fetchedEvents) => {
      setEvents(fetchedEvents);
    });

    let unsubscribeRegs = () => {};
    if (user?.uid) {
      unsubscribeRegs = getUserRegistrationsService(user.uid, (regs) => {
        setUserRegistrations(regs);
      });
    }

    return () => {
      unsubscribeEvents();
      unsubscribeRegs();
    };
  }, [user?.uid]);

  const upcomingEvents = events.filter(e => {
    if (e.status === 'completed') return false;
    if (interCollegeOnly && !e.is_inter_college) return false;
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  const pastEvents = events.filter(e => {
    if (e.status !== 'completed') return false;
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  const handleRegistrationSuccess = (reg: EventRegistration) => {
    setUserRegistrations(prev => [reg, ...prev.filter(r => r.eventId !== reg.eventId)]);
    setSuccessToast(`Successfully registered for ${reg.eventTitle}! Pass generated.`);
    setTimeout(() => setSuccessToast(null), 6000);
  };

  return (
    <main className="flex-grow pt-[68px] pb-section-gap px-container-padding w-full max-w-7xl mx-auto flex flex-col relative z-10">
      {/* Header Section */}
      <header className="relative mb-6 p-8 md:p-10 rounded-3xl backdrop-blur-2xl bg-[#090d1a]/85 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/40 text-neon-purple font-code-sm text-xs font-semibold uppercase tracking-wider mb-3 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>/sys/events-engine</span>
          </div>
          <h1 className="font-headline-xl text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-electric-cyan to-white">Terminal</span>
          </h1>
          <p className="text-white/60 max-w-2xl text-sm md:text-base mt-2 leading-relaxed font-medium">
            Discover upcoming hackathons, hands-on workshops, and guest lectures. Register solo or create/join teams and earn verified credentials.
          </p>
        </div>
      </header>

      {/* Notification Toast */}
      {successToast && (
        <div className="mb-8 p-4 bg-success-glow/20 border border-success-glow/40 rounded-2xl text-success-glow font-code-sm text-xs md:text-sm flex items-center justify-between shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">verified</span>
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Clean Navigation & Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-white/10">
        {/* Main Tabs (Upcoming vs Completed Archive) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0a0a0f] rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'past'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Past Workshop Archive ({pastEvents.length})
          </button>
        </div>

        {/* Category Pills & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'workshop', 'hackathon', 'speaker'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all capitalize cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-neon-purple to-electric-cyan text-white shadow-aurora'
                  : 'soft-ui-chip text-white/70 hover:text-white hover:border-white/30'
              }`}
            >
              {cat === 'all' ? 'All Events' : cat === 'speaker' ? 'Talks' : cat + 's'}
            </button>
          ))}

          {activeTab === 'upcoming' && (
            <label className="flex items-center gap-2 soft-ui-chip px-4 py-2 rounded-full text-xs font-bold text-white/80 cursor-pointer select-none hover:border-white/30 transition-colors ml-1">
              <input
                type="checkbox"
                checked={interCollegeOnly}
                onChange={(e) => setInterCollegeOnly(e.target.checked)}
                className="rounded bg-white/10 border-white/20 text-[#A855F7] focus:ring-0"
              />
              <span className="text-[11px] mono">Inter-College Only</span>
            </label>
          )}
        </div>
      </div>

      {/* UPCOMING EVENTS GRID */}
      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((evt) => {
            const now = new Date().getTime();
            const start = evt.registration_start_time ? new Date(evt.registration_start_time).getTime() : 0;
            const end = evt.registration_end_time ? new Date(evt.registration_end_time).getTime() : Infinity;
            const isOpen = (start === 0 || now >= start) && (end === Infinity || now <= end);

            const userReg = userRegistrations.find(r => 
              r.eventId === evt.id || 
              (r.eventTitle && evt.title && r.eventTitle.trim().toLowerCase() === evt.title.trim().toLowerCase())
            );
            const isRegistered = !!userReg;

            return (
              <article
                key={evt.id}
                className="soft-ui-card rounded-3xl overflow-hidden flex flex-col group relative"
              >
                <div className="h-56 w-full relative overflow-hidden bg-surface-container-low">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1326] via-transparent to-transparent"></div>

                  <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                    {isRegistered ? (
                      <span className="font-label-caps text-[10px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-xl backdrop-blur-md uppercase font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        REGISTERED
                      </span>
                    ) : (
                      <span className={`font-label-caps text-[10px] px-3 py-1 rounded-xl backdrop-blur-md uppercase border font-bold ${
                        isOpen
                          ? 'bg-electric-cyan/20 text-electric-cyan border-electric-cyan/40 shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                          : 'bg-error-container/40 text-error border-error/30'
                      }`}>
                        {isOpen ? 'OPEN FOR REG' : 'SCHEDULE LOCKED'}
                      </span>
                    )}

                    <span className="font-label-caps text-[10px] bg-deep-black/80 text-white border border-white/20 px-2.5 py-1 rounded-xl backdrop-blur-md uppercase font-bold">
                      {evt.category}
                    </span>

                    {evt.feeType === 'paid' || (evt.ticketPrice !== undefined && evt.ticketPrice > 0) ? (
                      <span className="font-label-caps text-[10px] bg-amber-500/25 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded-xl backdrop-blur-md uppercase font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                        <span>₹{evt.ticketPrice || 99} PASS</span>
                      </span>
                    ) : (
                      <span className="font-label-caps text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-xl backdrop-blur-md uppercase font-bold">
                        FREE PASS
                      </span>
                    )}

                    {evt.hostingType === 'external' && (
                      <span className="font-label-caps text-[10px] bg-electric-cyan/20 text-electric-cyan border border-electric-cyan/40 px-2.5 py-1 rounded-xl backdrop-blur-md uppercase font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">public</span>
                        <span>{evt.organizerName || 'External Host'}</span>
                      </span>
                    )}
                  </div>

                  {evt.is_inter_college && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="font-label-caps text-[10px] bg-neon-purple/80 text-white px-2.5 py-1 rounded-xl shadow border border-neon-purple font-bold">
                        INTER-COLLEGE
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow relative z-10">
                  <h3 className="font-headline-lg text-xl font-bold text-white mb-2 group-hover:text-neon-purple transition-colors leading-snug">
                    {evt.title}
                  </h3>

                  <div className="flex items-center gap-2 text-on-surface-variant text-xs font-code-sm mb-3">
                    <span className="material-symbols-outlined text-sm text-electric-cyan">calendar_today</span>
                    <span>{evt.date}</span>
                  </div>

                  <p className="text-on-surface-variant text-xs md:text-sm mb-4 flex-grow leading-relaxed line-clamp-3">
                    {evt.description}
                  </p>

                  {/* If user registered with a team, show their team info */}
                  {isRegistered && userReg.registrationType === 'team' && userReg.teamCode && (
                    <div className="mb-4 p-2.5 rounded-xl bg-electric-cyan/10 border border-electric-cyan/30 flex items-center justify-between text-xs font-code-sm">
                      <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                        <span className="material-symbols-outlined text-sm text-electric-cyan">groups</span>
                        <span className="truncate">{userReg.teamName}</span>
                      </div>
                      <span className="font-mono text-electric-cyan font-bold shrink-0 ml-2">
                        {userReg.teamCode}
                      </span>
                    </div>
                  )}

                  {/* Action Area: In-House Registration vs. External College/Company */}
                  {evt.hostingType === 'external' ? (
                    <div className="mt-auto pt-4 border-t border-white/10">
                      {evt.externalRegistrationUrl ? (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] mono text-white/50 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-electric-cyan">open_in_new</span>
                            External Registration
                          </span>
                          <a
                            href={evt.externalRegistrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-label-caps text-xs px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-cyan to-blue-500 hover:from-electric-cyan/90 hover:to-blue-600 text-white transition-all shadow-[0_0_15px_rgba(56,189,248,0.4)] uppercase font-bold border border-white/20 flex items-center gap-1.5"
                          >
                            <span>Official Portal</span>
                            <span className="material-symbols-outlined text-sm">arrow_outward</span>
                          </a>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-[11px]">
                            <span className="material-symbols-outlined text-sm text-amber-400">link_off</span>
                            <span>Official Link Not Found Yet</span>
                          </div>
                          <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                            Official portal link has not been released yet. Please search official channels. If you found the link, do mail us!
                          </p>
                          <a
                            href={`mailto:studentdevelopersclub88@gmail.com?subject=Registration Link for ${encodeURIComponent(evt.title)}&body=Hi SDC Team,%0D%0A%0D%0AI found the official registration link for "${encodeURIComponent(evt.title)}":%0D%0A[Paste Link Here]`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] transition-colors uppercase tracking-wider mono"
                          >
                            <span className="material-symbols-outlined text-xs">mail</span>
                            <span>Mail Us Official Link</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-electric-cyan text-xs font-code-sm">
                        <span className="material-symbols-outlined text-base">groups</span>
                        <span>Team Max: {evt.max_team_size}</span>
                      </div>

                      {isRegistered ? (
                        <button
                          onClick={() => navigate('/my-registrations')}
                          className="font-label-caps text-xs px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 font-bold shadow-[0_0_15px_rgba(160,185,129,0.3)]"
                        >
                          <span className="material-symbols-outlined text-sm">confirmation_number</span>
                          <span>Registered ✓</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setRegisteringEvent(evt)}
                          className="font-label-caps text-xs px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-cyan text-white hover:opacity-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] uppercase font-bold border border-white/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{evt.feeType === 'paid' ? `Register • ₹${evt.ticketPrice || 99}` : 'Register'}</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {upcomingEvents.length === 0 && (
            <div className="col-span-full py-8 text-center text-on-surface-variant font-code-sm bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10">
              <span className="material-symbols-outlined text-5xl mb-3 text-neon-purple">event_busy</span>
              <p>No upcoming events matching your selected filters.</p>
            </div>
          )}
        </div>
      )}

      {/* COMPLETED WORKSHOP ARCHIVE GRID */}
      {activeTab === 'past' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastEvents.map((evt) => (
            <article
              key={evt.id}
              className="soft-ui-card rounded-3xl overflow-hidden flex flex-col group relative border border-white/10"
            >
              <div className="h-52 w-full relative overflow-hidden bg-surface-container-low">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="font-label-caps text-[10px] bg-white/10 text-white px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-wider font-bold border border-white/20">
                    COMPLETED ARCHIVE
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-on-surface-variant text-xs font-code-sm mb-2">
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span>{evt.date} • {evt.attendance_count || evt.registered_count} Participants</span>
                </div>

                <h3 className="font-headline-lg text-xl font-bold text-white mb-2">
                  {evt.title}
                </h3>

                <p className="text-on-surface-variant text-xs leading-relaxed mb-4">
                  {evt.description}
                </p>

                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs font-code-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    Organized by Previous SDC Leads
                  </span>
                </div>
              </div>
            </article>
          ))}

          {pastEvents.length === 0 && (
            <div className="col-span-full py-8 text-center text-on-surface-variant font-code-sm bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10">
              <span className="material-symbols-outlined text-5xl mb-3 text-neon-purple">history</span>
              <p>No archived events matching filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Registration Modal */}
      {registeringEvent && (
        <RegistrationModal
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Certificate Modal */}
      {certificateEvent && (
        <CertificateModal
          event={certificateEvent}
          winnerInfo={certificateEvent.winners ? certificateEvent.winners[0] : undefined}
          onClose={() => setCertificateEvent(null)}
        />
      )}
    </main>
  );
};
