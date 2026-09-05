import React from 'react';

export const DiscordCommunityBanner: React.FC = () => {
  return (
    <section className="relative z-10 py-10 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto w-full mb-8">
      <div className="relative rounded-3xl p-8 sm:p-10 soft-ui-panel border border-white/10 shadow-soft-ui-lg overflow-hidden text-center">
        {/* Ambient Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-gradient-to-r from-neon-purple/30 to-electric-cyan/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-neon-purple/40 text-xs mono text-neon-purple shadow-soft-ui-chip">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold tracking-widest uppercase text-[10px]">Community Headquarters</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase">
            Connect with <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-electric-cyan to-white">500+ Developers</span>
          </h2>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-medium">
            Join the most active student engineering community on campus. Form hackathon squads, share code critiques, and build production projects together.
          </p>

          {/* Channels Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-4">
            {['#hackathon-squads', '#project-critiques', '#ai-agents-lab', '#internship-referrals'].map((ch) => (
              <span key={ch} className="text-xs mono text-white/80 soft-ui-chip px-3 py-1 rounded-full">
                {ch}
              </span>
            ))}
          </div>

          {/* Action Button */}
          <div>
            <a
              href="https://discord.gg/sdc-vce"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-neon-purple to-electric-cyan text-white hover:from-purple-500 hover:to-cyan-400 px-10 sm:px-14 py-4 rounded-full font-black text-xs uppercase tracking-wider transition-all transform hover:-translate-y-1 shadow-aurora"
            >
              <span>Join Discord Server</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </a>
          </div>

          <p className="text-[10px] mono text-white/40 uppercase tracking-widest pt-2">
            Free forever • Instant Invite • Open to All Student Engineers
          </p>
        </div>
      </div>
    </section>
  );
};
