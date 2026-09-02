import React, { useState, useEffect } from 'react';
import { subscribeOpportunitiesService } from '../services/dataService';
import { Opportunity } from '../types';

export const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('All');

  useEffect(() => {
    const unsubscribe = subscribeOpportunitiesService((fetchedOpps) => {
      setOpportunities(fetchedOpps);
    });
    return () => unsubscribe();
  }, []);

  const filteredOpps = opportunities.filter(opp => {
    if (selectedTag === 'All') return true;
    if (selectedTag === 'Hackathons') return opp.category === 'hackathon';
    if (selectedTag === 'Internships') return opp.category === 'internship';
    if (selectedTag === 'OpenSource') return opp.category === 'opensource';
    if (selectedTag === 'Remote') return opp.tags.some(t => t.toLowerCase().includes('remote'));
    return true;
  });

  const getDaysRemaining = (deadlineIso: string) => {
    const diff = new Date(deadlineIso).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    return `${days} days left`;
  };

  return (
    <main className="flex-grow z-10 w-full max-w-7xl mx-auto px-container-padding py-24 flex flex-col gap-12 relative">
      {/* Header Section */}
      <header className="relative p-8 md:p-10 rounded-3xl backdrop-blur-2xl bg-[#090d1a]/85 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/40 text-neon-purple font-code-sm text-xs font-semibold uppercase tracking-wider mb-3 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <span className="material-symbols-outlined text-sm">radar</span>
            <span>/sys/opportunity-radar</span>
          </div>
          <h1 className="font-headline-xl text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Discover your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-electric-cyan to-white">commit</span>.
          </h1>
          <p className="text-on-surface-variant font-body-md text-sm md:text-base leading-relaxed mt-3">
            A curated terminal of external hackathons, open-source programs, and student developer internships hand-picked for the SDC community.
          </p>

          {/* Clean Pill Filter Tabs (UX Pilot Style) */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
            {['All', 'Hackathons', 'Internships', 'OpenSource', 'Remote'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedTag === tag
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#0a0a0f] border border-white/10 text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Soft-UI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOpps.map((opp) => (
          <article
            key={opp.id}
            className="soft-ui-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-electric-cyan shadow-soft-ui">
                  <span className="material-symbols-outlined text-2xl">
                    {opp.category === 'hackathon' ? 'emoji_events' : opp.category === 'internship' ? 'work' : 'code_blocks'}
                  </span>
                </div>

                <div className="flex gap-1.5 flex-wrap justify-end">
                  {opp.tags.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-electric-cyan font-code-sm text-[10px] border border-white/10 font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="font-headline-lg text-xl font-bold text-white mb-1.5 group-hover:text-neon-purple transition-colors line-clamp-1 leading-snug">
                {opp.title}
              </h3>
              <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider mb-3 font-bold">
                {opp.organization}
              </p>
              <p className="text-on-surface-variant text-xs md:text-sm line-clamp-3 mb-6 leading-relaxed">
                {opp.description}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/10 relative z-10">
              <div className="flex items-center gap-1.5 text-on-surface-variant font-code-sm text-xs">
                <span className="material-symbols-outlined text-sm text-tertiary">hourglass_empty</span>
                <span>{getDaysRemaining(opp.deadline)}</span>
              </div>

              <a
                href={opp.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="soft-ui-btn text-white font-code-sm text-xs px-5 py-2 rounded-full border border-white/15 hover:border-white/30 transition-all flex items-center gap-1.5 uppercase font-bold shadow-sm"
              >
                <span>Apply</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};
