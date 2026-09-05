import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { subscribeIdeaRequestsService, submitIdeaRequestService, toggleUpvoteIdeaService } from '../services/dataService';
import { IdeaHubRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';

export const IdeaHubPage: React.FC = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<IdeaHubRequest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'workshop' | 'hackathon' | 'speaker'>('workshop');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeIdeaRequestsService((fetchedIdeas) => {
      setIdeas(fetchedIdeas);
    });
    return () => unsubscribe();
  }, []);

  const handleUpvote = async (ideaId: string, currentStatus: boolean) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic UI update
    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id === ideaId) {
          const newUpvoted = !currentStatus;
          const newCount = newUpvoted
            ? item.upvotesCount + 1
            : Math.max(0, item.upvotesCount - 1);
          const newUpvotedBy = newUpvoted
            ? [...(item.upvotedBy || []), user.uid]
            : (item.upvotedBy || []).filter((id) => id !== user.uid);
          return {
            ...item,
            upvotesCount: newCount,
            upvotedBy: newUpvotedBy
          };
        }
        return item;
      })
    );

    try {
      await toggleUpvoteIdeaService(ideaId, user.uid, currentStatus);
    } catch (e) {
      console.error('Error toggling upvote:', e);
    }
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await submitIdeaRequestService({
        title: title.trim(),
        description: description.trim(),
        category,
        authorId: user.uid,
        authorEmail: user.email,
        authorName: user.displayName || user.email.split('@')[0]
      });
      setTitle('');
      setDescription('');
      setShowSubmitModal(false);
    } catch (e) {
      console.error('Submit idea error', e);
    } finally {
      setSubmitting(false);
    }
  };

  // Exclude approved and rejected ideas from community voting queue
  const activeIdeas = ideas.filter(i => i.status !== 'approved' && i.status !== 'rejected');
  const filteredIdeas = selectedCategory === 'all' 
    ? activeIdeas 
    : activeIdeas.filter(i => i.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <main className="flex-grow pt-[68px] pb-section-gap px-container-padding w-full max-w-7xl mx-auto flex flex-col relative z-10">
      {/* Header Banner */}
      <header className="relative mb-6 p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-[#090d1a]/85 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Specular Sheen */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/40 text-neon-purple font-code-sm text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <span className="material-symbols-outlined text-sm">hub</span>
              <span>Community Engine • No Limits</span>
            </div>
            <h1 className="font-headline-xl text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-electric-cyan to-white">Idea Hub</span>
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base mt-3 leading-relaxed">
              Propose workshops, hackathon themes, or guest tech talks. Community upvotes dictate which initiatives the SDC Core Team builds and funds next!
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
              } else {
                setShowSubmitModal(true);
              }
            }}
            className="bg-[#A855F7] hover:bg-[#9333ea] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Submit Proposal</span>
          </button>
        </div>

        {/* Clean Pill Filter Tabs (UX Pilot Style) */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10 relative z-10">
          {[
            { id: 'all', label: 'All Proposals' },
            { id: 'workshop', label: 'Workshops' },
            { id: 'hackathon', label: 'Hackathons' },
            { id: 'speaker', label: 'Tech Talks' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-gradient-to-r from-neon-purple to-electric-cyan text-white shadow-aurora'
                  : 'soft-ui-chip text-white/70 hover:text-white hover:border-white/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Soft-UI Ideas Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredIdeas.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl soft-ui-panel text-on-surface-variant font-code-sm">
            <span className="material-symbols-outlined text-4xl text-neon-purple mb-2">lightbulb</span>
            <p>No proposals in this category yet. Be the first to submit one!</p>
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            const hasUpvoted = user ? (idea.upvotedBy || []).includes(user.uid) : false;

            return (
              <div
                key={idea.id}
                className="group relative rounded-3xl p-6 sm:p-7 flex gap-5 soft-ui-card overflow-hidden"
              >
                {/* Soft-UI Tactile Upvote Button with Undo Option */}
                <div className="flex flex-col items-center justify-start relative z-10">
                  <button
                    onClick={() => handleUpvote(idea.id, hasUpvoted)}
                    className={`w-16 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 group/btn cursor-pointer ${
                      hasUpvoted
                        ? 'bg-gradient-to-b from-neon-purple to-purple-800 text-white border-neon-purple shadow-aurora scale-105'
                        : 'soft-ui-btn text-white/70 hover:text-neon-purple hover:border-neon-purple/40'
                    }`}
                    title={hasUpvoted ? 'Click to remove your upvote' : 'Click to upvote this topic'}
                  >
                    <span className={`material-symbols-outlined text-2xl transition-transform ${hasUpvoted ? 'translate-y-[-2px]' : 'group-hover/btn:-translate-y-1'}`}>
                      {hasUpvoted ? 'thumb_up' : 'arrow_upward'}
                    </span>
                    <span className="font-code-sm text-sm font-bold mt-1">
                      {idea.upvotesCount}
                    </span>
                    <span className="text-[9px] font-code-sm opacity-80 uppercase tracking-tighter">
                      {hasUpvoted ? 'Undo' : 'Vote'}
                    </span>
                  </button>
                </div>

                {/* Idea Content */}
                <div className="flex-1 flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="font-label-caps text-[10px] px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/15 text-electric-cyan font-bold uppercase tracking-wider">
                        {idea.category}
                      </span>
                      <span className="text-on-surface-variant font-code-sm text-[11px]">
                        by {idea.authorName || 'SDC Member'}
                      </span>
                    </div>

                    <h3 className="font-headline-lg text-lg font-bold text-white mb-2 group-hover:text-neon-purple transition-colors leading-snug">
                      {idea.title}
                    </h3>

                    <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed mb-4 line-clamp-3">
                      {idea.description}
                    </p>
                  </div>

                  {/* Clean Community Stats (No artificial cap!) */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-code-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-neon-purple">favorite</span>
                      <span>
                        <strong className="text-white font-bold">{idea.upvotesCount}</strong> {idea.upvotesCount === 1 ? 'Community Vote' : 'Community Votes'}
                      </span>
                    </div>

                    {idea.upvotesCount >= 5 && (
                      <span className="px-2 py-0.5 rounded-md bg-neon-purple/20 border border-neon-purple/40 text-neon-purple text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">local_fire_department</span> Trending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Propose Idea Modal with Liquid Glass Aesthetic */}
      {showSubmitModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-deep-black/85 backdrop-blur-xl animate-fadeIn">
          {/* Ambient Glow */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-purple/25 rounded-full blur-[120px] pointer-events-none -z-10"></div>

          <div className="relative my-auto max-h-[90vh] overflow-y-auto max-w-lg w-full rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-on-surface shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)] bg-gradient-to-b from-[#131b2e]/95 via-[#0b1326]/95 to-[#060e20]/95 backdrop-blur-3xl border border-white/20 ring-1 ring-neon-purple/30">
            {/* Top Sheen */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none rounded-t-3xl"></div>

            <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  <span className="material-symbols-outlined text-lg">lightbulb</span>
                </div>
                <div>
                  <h3 className="font-headline-lg text-lg font-bold text-white tracking-tight">Propose Workshop Topic</h3>
                  <p className="text-[10px] font-code-sm text-on-surface-variant uppercase tracking-wider">Community Crowdsourcing Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)} 
                className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-white rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitIdea} className="space-y-4 text-xs font-body-md relative z-10">
              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">Topic Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building Autonomous AI Agents with Rust & WebAssembly"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-purple focus:bg-white/[0.08] focus:ring-1 focus:ring-neon-purple/50 transition-all backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#0b1326] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-purple transition-all"
                >
                  <option value="workshop">Hands-On Workshop Session</option>
                  <option value="hackathon">Hackathon Theme / Track</option>
                  <option value="speaker">Industry Guest Lecture</option>
                </select>
              </div>

              <div>
                <label className="block text-on-surface-variant font-code-sm mb-1 text-[11px]">Description & Learning Outcomes</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what students will learn, tools they will use, and what hands-on project they will ship..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-neon-purple focus:bg-white/[0.08] focus:ring-1 focus:ring-neon-purple/50 transition-all backdrop-blur-md"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl font-code-sm text-on-surface-variant hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-cyan text-white font-label-caps uppercase font-bold hover:opacity-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20"
                >
                  {submitting ? 'Publishing...' : 'Post Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Auth Modal Trigger for unauthenticated upvoters */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
};
