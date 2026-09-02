import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getEventsService, subscribeOpportunitiesService, subscribeEventsService, subscribeClubSettingsService } from '../services/dataService';
import { EventItem, Opportunity, ClubSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { SocialChannels } from '../components/SocialChannels';
import { HackathonPrizeMatrix } from '../components/HackathonPrizeMatrix';
import { DiscordCommunityBanner } from '../components/DiscordCommunityBanner';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clubSettings, setClubSettings] = useState<ClubSettings>({ showHackathonMatrix: false });

  useEffect(() => {
    getEventsService().then(setUpcomingEvents);
    const unsubscribeOpps = subscribeOpportunitiesService((opps: Opportunity[]) => {
      setOpportunities(opps.slice(0, 3));
    });

    const unsubscribeEvents = subscribeEventsService((events) => {
      setUpcomingEvents(events);
    });

    const unsubscribeSettings = subscribeClubSettingsService((settings) => {
      setClubSettings(settings);
    });

    return () => {
      unsubscribeOpps();
      unsubscribeEvents();
      unsubscribeSettings();
    };
  }, []);

  const nextWorkshop = upcomingEvents.find(e => e.category === 'workshop') || upcomingEvents[0];

  const FULL_COMMAND = "sudo build_future --with-community";
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayedText === FULL_COMMAND) {
      timeout = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && displayedText === "") {
      timeout = setTimeout(() => setIsDeleting(false), 600);
    } else {
      const delay = isDeleting ? 30 : 60;
      timeout = setTimeout(() => {
        setDisplayedText(prev =>
          isDeleting ? prev.slice(0, -1) : FULL_COMMAND.slice(0, prev.length + 1)
        );
      }, delay);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting]);

  const handleInitiateJoin = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/events');
    }
  };

  return (
    <main className="flex-grow pt-4 md:pt-8 relative overflow-hidden">
      {/* Hero Section (Synthesizing GCore Pin 1 & Vetra Pin 2) */}
      <section className="relative z-10 min-h-[85vh] flex flex-col justify-center items-center px-container-padding pt-6 sm:pt-12 pb-20 max-w-7xl mx-auto text-center">
        
        {/* Top Status Capsule (From Previous UI) */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/12 text-xs font-code-sm text-white/80 shadow-soft-ui-chip backdrop-blur-xl mb-6 hover:border-neon-purple/50 transition-all cursor-pointer group"
          onClick={() => navigate('/events')}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-electric-cyan font-bold tracking-wider">SYSTEM_STATUS: ONLINE</span>
          <span className="w-1 h-1 rounded-full bg-white/30"></span>
          <span className="text-white/90 font-medium">VCE REGISTRATION OPEN</span>
          <span className="material-symbols-outlined text-sm text-neon-purple group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
        </div>

        {/* Main Headline (From Previous UI: Build the Future. { Together }) */}
        <h1 className="font-headline-xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight max-w-5xl">
          Build the Future. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-electric-cyan to-ember-amber drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            {'{ Together }'}
          </span>
        </h1>

        {/* Monospace Terminal Command Box with Typing Loop */}
        <div className="my-5 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/40 border border-white/10 text-xs sm:text-sm font-mono text-white/90 shadow-soft-ui-inset backdrop-blur-md">
          <span className="text-electric-cyan font-bold">$</span>
          <span className="text-white font-medium">{displayedText}</span>
          <span className="w-1.5 h-4 bg-neon-purple animate-pulse"></span>
        </div>

        {/* Quote from Previous UI */}
        <p className="text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed font-medium mb-8">
          Join the premier student technical community at Vardhaman College of Engineering. We craft code, architect distributed systems, and dominate national hackathons.
        </p>

        {/* Dual CTAs (From Previous UI: INITIATE JOIN & EXPLORE EVENTS) */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-16 z-20">
          <button
            onClick={handleInitiateJoin}
            className="bg-gradient-to-r from-[#9333ea] to-[#0ea5e9] hover:from-[#a855f7] hover:to-[#38bdf8] text-white px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all transform hover:-translate-y-0.5 shadow-aurora flex items-center gap-2.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            <span>Initiate Join</span>
          </button>

          <button
            onClick={() => navigate('/events')}
            className="soft-ui-btn text-white px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg text-electric-cyan">explore</span>
            <span>Explore Events</span>
          </button>
        </div>

        {/* Interactive Tech Node Cluster (Inspired by GCore Pin 1) */}
        <div className="w-full max-w-4xl relative py-8 px-4 flex flex-col items-center">
          
          {/* Circuit SVG Lines linking nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 800 240" fill="none">
            {/* Left traces to center */}
            <path d="M 160 50 L 320 50 L 370 120" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1.5" className="circuit-pulse" />
            <path d="M 160 190 L 320 190 L 370 120" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" className="circuit-pulse" />
            
            {/* Center to Right traces */}
            <path d="M 430 120 L 480 50 L 640 50" stroke="rgba(14, 165, 233, 0.4)" strokeWidth="1.5" className="circuit-pulse" />
            <path d="M 430 120 L 480 190 L 640 190" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" className="circuit-pulse" />
            <path d="M 400 160 L 400 230" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>

          {/* Node Grid Layout */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-center relative z-10">
            
            {/* Left Satellite Nodes */}
            <div className="flex flex-col gap-5 items-center sm:items-end">
              {/* Node 1: AI / Machine Learning */}
              <div className="soft-ui-chip rounded-2xl p-4 w-60 text-left border border-white/10 hover:border-amber-500/50 transition-all group hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-ember-amber/15 border border-ember-amber/30 flex items-center justify-center text-ember-amber shadow-sm">
                    <span className="material-symbols-outlined text-lg">neurology</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-ember-amber transition-colors">AI & Deep Learning</h4>
                    <p className="text-[11px] text-white/50 mono">LLMs • PyTorch • Vision</p>
                  </div>
                </div>
              </div>

              {/* Node 2: Cybersecurity & Cryptography */}
              <div className="soft-ui-chip rounded-2xl p-4 w-60 text-left border border-white/10 hover:border-neon-purple/50 transition-all group hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center text-neon-purple shadow-sm">
                    <span className="material-symbols-outlined text-lg">shield</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-neon-purple transition-colors">Cybersecurity</h4>
                    <p className="text-[11px] text-white/50 mono">CTFs • Network Security</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Core SDC Hub Node */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-neon-purple/30 via-electric-cyan/20 to-ember-amber/30 blur-xl rounded-full opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl soft-ui-panel border border-white/20 flex flex-col items-center justify-center p-3 relative shadow-2xl group-hover:scale-105 transition-transform">
                  <img 
                    src="/logo-sdc.svg" 
                    alt="SDC Central Hub" 
                    className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] mb-1" 
                  />
                  <span className="text-[10px] font-black text-white tracking-wider mono uppercase">SDC CORE</span>
                  <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Right Satellite Nodes */}
            <div className="flex flex-col gap-5 items-center sm:items-start">
              {/* Node 3: Cloud & Distributed Systems */}
              <div className="soft-ui-chip rounded-2xl p-4 w-60 text-left border border-white/10 hover:border-electric-cyan/50 transition-all group hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-electric-cyan/15 border border-electric-cyan/30 flex items-center justify-center text-electric-cyan shadow-sm">
                    <span className="material-symbols-outlined text-lg">cloud</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-electric-cyan transition-colors">Cloud & DevOps</h4>
                    <p className="text-[11px] text-white/50 mono">Kubernetes • Docker • Go</p>
                  </div>
                </div>
              </div>

              {/* Node 4: Open Source & Full Stack */}
              <div className="soft-ui-chip rounded-2xl p-4 w-60 text-left border border-white/10 hover:border-neon-purple/50 transition-all group hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center text-neon-purple shadow-sm">
                    <span className="material-symbols-outlined text-lg">code_blocks</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-neon-purple transition-colors">Open Source</h4>
                    <p className="text-[11px] text-white/50 mono">React • Rust • Python</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Celestial Horizon Arc & Live Showcase Frame (Inspired by Vetra Pin 2) */}
        <div className="w-full max-w-6xl mt-12 relative pt-8">
          {/* Glowing Planetary Horizon Curve */}
          <div className="w-full h-12 relative overflow-hidden flex items-center justify-center">
            <div className="w-[120%] h-48 rounded-[100%] border-t border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-neon-purple/5 to-transparent absolute -top-1 blur-[1px]"></div>
          </div>

          {/* Elevated Live Platform Dashboard Frame */}
          <div className="soft-ui-panel rounded-3xl p-6 sm:p-8 border border-white/12 shadow-soft-ui-lg relative backdrop-blur-2xl text-left -mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl text-neon-purple">dashboard</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">SDC Live Platform Activity</h3>
                  <p className="text-xs text-white/50 mono">Real-time telemetry & active opportunities</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs mono">
                <div className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/70">
                  <span className="text-electric-cyan font-bold">500+</span> Enrolled Engineers
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  ● Cluster Online
                </div>
              </div>
            </div>

            {/* Quick Metrics & Spotlight Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Metric 1 */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                <div className="flex items-center justify-between text-xs text-white/50 mb-2 mono">
                  <span>UPCOMING SESSIONS</span>
                  <span className="material-symbols-outlined text-sm text-neon-purple">event</span>
                </div>
                <div className="text-2xl font-black text-white">{upcomingEvents.length} Active Events</div>
                <p className="text-[11px] text-white/40 mt-1">Hackathons, hands-on labs & talks</p>
              </div>

              {/* Metric 2 */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                <div className="flex items-center justify-between text-xs text-white/50 mb-2 mono">
                  <span>PRIZE POOL TRACKS</span>
                  <span className="material-symbols-outlined text-sm text-amber-400">emoji_events</span>
                </div>
                <div className="text-2xl font-black text-amber-300">₹2,00,000+</div>
                <p className="text-[11px] text-white/40 mt-1">Hackathon awards & sponsored perks</p>
              </div>

              {/* Metric 3 */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                <div className="flex items-center justify-between text-xs text-white/50 mb-2 mono">
                  <span>EXTERNAL RADAR</span>
                  <span className="material-symbols-outlined text-sm text-electric-cyan">radar</span>
                </div>
                <div className="text-2xl font-black text-electric-cyan">{opportunities.length} Curated Opps</div>
                <p className="text-[11px] text-white/40 mt-1">Internships, grants & open source</p>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* Social / Community Channels Section (From Pic 1) */}
      <SocialChannels />

      {/* About SDC Section with Soft-UI & Glassmorphism Container */}
      <section className="relative z-10 py-12 px-container-padding">
        <div className="max-w-7xl mx-auto soft-ui-panel rounded-3xl p-8 md:p-14 shadow-soft-ui-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-3xl"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">
            <div>
              <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center text-neon-purple shadow-aurora">
                  <span className="material-symbols-outlined text-xl">code_blocks</span>
                </div>
                <span>About Student Developers Club</span>
              </h2>
              <p className="text-on-surface-variant font-body-md mb-8 leading-relaxed">
                The Student Developers Club (SDC) is a high-energy, community-driven collective at Vardhaman College of Engineering. We strip away theoretical fluff and focus on real engineering: shipping code, learning modern stacks, building hackathon projects, and launching careers.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl soft-ui-chip">
                  <div className="w-10 h-10 rounded-xl bg-neon-purple/20 flex items-center justify-center text-neon-purple border border-neon-purple/40 shadow-sm shrink-0">
                    <span className="material-symbols-outlined">code</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Hands-On Workshops</h4>
                    <p className="text-xs text-on-surface-variant font-code-sm">Deep dives into modern Web, AI, Rust, Systems, and Cloud engineering.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl soft-ui-chip">
                  <div className="w-10 h-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center text-electric-cyan border border-electric-cyan/40 shadow-sm shrink-0">
                    <span className="material-symbols-outlined">rocket_launch</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Hackathons & Sprints</h4>
                    <p className="text-xs text-on-surface-variant font-code-sm">Build, break, pitch, and claim prizes with fellow student engineering teams.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-[380px] rounded-3xl overflow-hidden border border-white/20 shadow-soft-ui-lg group">
              <img 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80" 
                alt="SDC Developer Hub"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md p-4 rounded-2xl soft-ui-chip">
                <span className="font-label-caps text-[10px] bg-neon-purple/30 text-neon-purple border border-neon-purple/50 px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                  Engineered Environment
                </span>
                <p className="text-white font-headline-lg text-base md:text-lg font-bold mt-2">Where ambition meets execution.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Up Workshop Highlight (Bento Card layout) */}
      {nextWorkshop && (
        <section className="relative z-10 py-16 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Bento Text & Metadata Card */}
            <div className="lg:col-span-7 soft-ui-panel rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-soft-ui-lg">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-neon-purple mono block mb-2">
                  Next Up Workshop
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 leading-tight">
                  {nextWorkshop.title}
                </h2>
                <p className="text-sm text-white/60 mt-4 leading-relaxed font-medium">
                  {nextWorkshop.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 space-y-3 mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2.5">
                  <span className="text-white/40 uppercase tracking-wider text-[11px]">Date</span>
                  <span className="text-white font-bold">{nextWorkshop.date}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2.5">
                  <span className="text-white/40 uppercase tracking-wider text-[11px]">Venue</span>
                  <span className="text-white font-bold">{nextWorkshop.location}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-white/40 uppercase tracking-wider text-[11px]">Availability</span>
                  <span className="text-neon-purple font-bold">
                    {Math.max(0, nextWorkshop.max_seats - nextWorkshop.registered_count)} Seats Remaining
                  </span>
                </div>

                <button
                  onClick={() => navigate('/events')}
                  className="w-full mt-4 soft-ui-btn py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-white hover:text-neon-purple transition-all cursor-pointer"
                >
                  Reserve Spot
                </button>
              </div>
            </div>

            {/* Right Bento Visual Card */}
            <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-white/10 bg-[#070d1d]/80 min-h-[320px] shadow-soft-ui-lg flex flex-col justify-end p-6 group">
              <img 
                src={nextWorkshop.image || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"} 
                alt={nextWorkshop.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-[#050914]/40 to-transparent"></div>
              
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] mono uppercase tracking-wider px-3 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/40 text-neon-purple font-bold inline-block">
                  Hands-on Engineering
                </span>
                <p className="text-white font-bold text-base leading-snug">
                  Build production containers, scale microservices, and deploy to Kubernetes clusters.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Opportunity Radar Highlights */}
      <section className="relative z-10 py-12 px-container-padding max-w-7xl mx-auto mb-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="font-label-caps text-xs text-electric-cyan tracking-widest uppercase block mb-1">External Radar</span>
            <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-electric-cyan">hub</span>
              <span>Curated Opportunities</span>
            </h2>
          </div>
          <Link to="/opportunities" className="text-neon-purple hover:text-white font-code-sm text-xs flex items-center gap-1 transition-colors">
            View All Opportunities <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div 
              key={opp.id} 
              className="soft-ui-card rounded-3xl p-6 flex flex-col justify-between h-full group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/[0.06] text-electric-cyan px-3 py-1 rounded-xl font-label-caps text-[10px] tracking-wider border border-white/15 uppercase font-bold">
                    {opp.category}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-neon-purple transition-colors">open_in_new</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1.5 group-hover:text-neon-purple transition-colors line-clamp-1">
                  {opp.title}
                </h3>
                <p className="text-on-surface-variant font-code-sm text-xs mb-3">{opp.organization}</p>
                <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-2 mb-4">{opp.description}</p>
              </div>

              <a
                href={opp.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full text-center soft-ui-btn text-white py-2.5 rounded-full font-label-caps text-xs transition-all mt-4 block uppercase font-bold relative z-10 shadow-sm"
              >
                Apply External
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Flagship Hackathon Tracks & Prize Pool Matrix (Toggled by Admin, Hidden by default) */}
      {clubSettings.showHackathonMatrix && <HackathonPrizeMatrix />}

      {/* Discord Community CTA Banner */}
      <DiscordCommunityBanner />

      {/* Auth Modal Trigger */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
};
