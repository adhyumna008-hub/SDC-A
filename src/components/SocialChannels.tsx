import React from 'react';

export const SocialChannels: React.FC = () => {
  return (
    <section className="relative z-10 py-16 px-container-padding max-w-7xl mx-auto">
      {/* Soft-UI & Glass Section Container */}
      <div className="soft-ui-panel rounded-3xl p-6 sm:p-10 shadow-soft-ui-lg relative overflow-hidden">
        {/* Top Specular Sheen */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-3xl"></div>

        {/* Header Title */}
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-code-sm text-electric-cyan mb-2 shadow-soft-ui-chip">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-ping"></span>
            <span>COMMUNITY_NETWORKS // DIRECT_CHANNELS</span>
          </div>
          <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-white tracking-tight">
            Connect Across Developer Networks
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-code-sm mt-1 max-w-md mx-auto">
            Stay in the loop with announcements, workshop resources, hackathon squads, and live dev discussions.
          </p>
        </div>

        {/* 3 Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* LinkedIn Card */}
          <a
            href="https://www.linkedin.com/company/student-developer-club-vce"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Student Developer Club VCE on LinkedIn"
            className="soft-ui-card rounded-2xl p-8 flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-electric-cyan/10 border border-electric-cyan/30 flex items-center justify-center text-[#67d7f0] mb-4 group-hover:scale-110 group-hover:bg-electric-cyan/20 transition-all duration-300 shadow-soft-ui">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.33V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.31 7.41a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm-1.78 13.04h3.56V8.98H3.53v11.47Z"/>
              </svg>
            </div>
            
            <h3 className="font-headline-lg text-2xl font-bold text-white mb-1 group-hover:text-electric-cyan transition-colors">
              LinkedIn
            </h3>
            <p className="font-code-sm text-[11px] text-on-surface-variant uppercase tracking-widest mb-6">
              STUDENT DEVELOPER CLUB VCE
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-code-sm font-bold text-electric-cyan uppercase tracking-wider group-hover:gap-2.5 transition-all">
              FOLLOW <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </span>
          </a>

          {/* Instagram Card */}
          <a
            href="https://www.instagram.com/studentdevelopersclub.vce?igsi=MWRmZ3J5Y3N4NnRscw=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Student Developer Club VCE on Instagram"
            className="soft-ui-card rounded-2xl p-8 flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-[#d79dfc] mb-4 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300 shadow-soft-ui">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5"/>
                <circle cx="12" cy="12" r="4.2"/>
                <circle cx="17.5" cy="6.7" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            
            <h3 className="font-headline-lg text-2xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">
              Instagram
            </h3>
            <p className="font-code-sm text-[11px] text-on-surface-variant uppercase tracking-widest mb-6">
              @STUDENTDEVELOPERSCLUB.VCE
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-code-sm font-bold text-pink-400 uppercase tracking-wider group-hover:gap-2.5 transition-all">
              FOLLOW <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </span>
          </a>

          {/* Discord Card */}
          <a
            href="https://discord.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join Student Developer Club VCE on Discord"
            className="soft-ui-card rounded-2xl p-8 flex flex-col items-center text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-[#9c8eff] mb-4 group-hover:scale-110 group-hover:bg-neon-purple/20 transition-all duration-300 shadow-soft-ui">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M19.54 4.37A16.7 16.7 0 0 0 15.5 3.1l-.5 1.02a15.2 15.2 0 0 0-6 0l-.5-1.02C7.1 3.43 5.74 3.85 4.46 4.37 1.91 8.16 1.22 11.86 1.56 15.5a16.3 16.3 0 0 0 4.96 2.51l1.2-1.65c-.66-.25-1.3-.57-1.88-.95l.46-.35c3.62 1.67 7.54 1.67 11.12 0l.46.35c-.59.38-1.22.7-1.89.95l1.2 1.65a16.26 16.26 0 0 0 4.97-2.51c.4-4.22-.68-7.89-2.66-11.13ZM8.83 13.25c-1.07 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18c1.1 0 1.97.98 1.95 2.18 0 1.2-.86 2.18-1.95 2.18Zm6.34 0c-1.08 0-1.95-.98-1.95-2.18s.86-2.18 1.95-2.18c1.1 0 1.97.98 1.95 2.18 0 1.2-.85 2.18-1.95 2.18Z"/>
              </svg>
            </div>
            
            <h3 className="font-headline-lg text-2xl font-bold text-white mb-1 group-hover:text-neon-purple transition-colors">
              Discord
            </h3>
            <p className="font-code-sm text-[11px] text-on-surface-variant uppercase tracking-widest mb-6">
              JOIN THE DEVELOPER SERVER
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-code-sm font-bold text-neon-purple uppercase tracking-wider group-hover:gap-2.5 transition-all">
              JOIN <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};
