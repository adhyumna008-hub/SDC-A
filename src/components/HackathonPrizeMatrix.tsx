import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HackathonTrack {
  id: string;
  number: string;
  title: string;
  outlineTitle: string;
  focusSummary: string;
  prizePool: string;
  prizeDisplay: string;
  firstPrize: string;
  runnerUp: string;
  thirdPrize: string;
  focus: string[];
  techStack: string[];
  image: string;
}

const HACKATHON_TRACKS: HackathonTrack[] = [
  {
    id: 'ai-ml',
    number: '01',
    title: 'AI & Machine Learning',
    outlineTitle: 'AI/ML',
    focusSummary: 'LLMs, Neural Models, Intelligent Multi-Agent Swarms',
    prizePool: '₹2,00,000',
    prizeDisplay: '₹2L',
    firstPrize: '₹1,00,000',
    runnerUp: '₹60,000',
    thirdPrize: '₹40,000',
    focus: [
      'Autonomous Multi-Agent Networks & Agentic Swarms',
      'Fine-tuned LLMs & Retrieval-Augmented Generation (RAG)',
      'Neural Computer Vision & Edge AI inference',
      'Multimodal Real-Time Reasoning Agents'
    ],
    techStack: ['PyTorch', 'LangChain', 'Transformers', 'Ollama', 'FastAPI'],
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cloud-infra',
    number: '02',
    title: 'Cloud Infrastructure',
    outlineTitle: 'Cloud Infra',
    focusSummary: 'Kubernetes, High-Throughput Serverless, Edge Networks',
    prizePool: '₹1,50,000',
    prizeDisplay: '₹1.5L',
    firstPrize: '₹75,000',
    runnerUp: '₹45,000',
    thirdPrize: '₹30,000',
    focus: [
      'Kubernetes Operators & Cloud-Native Microservices',
      'High-Throughput Serverless & Distributed Pipelines',
      'Low-Latency Edge Workers & Global CDN Architectures',
      'Automated Observability, eBPF & SRE Tooling'
    ],
    techStack: ['Kubernetes', 'Docker', 'Go', 'AWS', 'Cloudflare Workers'],
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cybersecurity',
    number: '03',
    title: 'Cybersecurity & Defense',
    outlineTitle: 'Cybersecurity',
    focusSummary: 'Zero-Trust, Vulnerability Audits, Smart Contract Auditing',
    prizePool: '₹1,50,000',
    prizeDisplay: '₹1.5L',
    firstPrize: '₹75,000',
    runnerUp: '₹45,000',
    thirdPrize: '₹30,000',
    focus: [
      'Zero-Trust Architectures & Identity Verification Systems',
      'Automated Vulnerability Scanners & Static Analysis',
      'Smart Contract Security & Web3 Cryptographic Audits',
      'Network Intrusion Detection & Threat Intelligence'
    ],
    techStack: ['Rust', 'Wireshark', 'Solidity', 'Slither', 'Linux eBPF'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80'
  }
];

export const HackathonPrizeMatrix: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  return (
    <section className="relative z-10 py-12 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto w-full">
      {/* Container with Soft-UI & Glassmorphism */}
      <div className="soft-ui-panel rounded-3xl p-6 sm:p-8 shadow-soft-ui-lg">
        {/* Header section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-neon-purple mono block mb-2">
              Grand Finale // Cohort 2026
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase">
              Hackathon <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-electric-cyan to-amber-400">Matrix</span>
            </h2>
          </div>
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 mono block">
              Total Prize Pool
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mono">
              ₹5,00,000<span className="text-amber-400">+</span>
            </div>
            <span className="text-xs text-white/50 mono">+ ₹10,00,000 Cloud Credits</span>
          </div>
        </div>

        {/* Editorial Track Rows */}
        <div className="divide-y divide-white/10">
          {HACKATHON_TRACKS.map((track) => {
            const isExpanded = selectedTrack === track.id;
            return (
              <div key={track.id} className="group transition-all duration-300">
                {/* Row Bar */}
                <div
                  onClick={() => setSelectedTrack(isExpanded ? null : track.id)}
                  className="py-7 sm:py-8 px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center cursor-pointer hover:bg-white/[0.04] transition-colors rounded-2xl"
                >
                  {/* 01 / 02 / 03 Number */}
                  <div className="sm:col-span-1 text-xs sm:text-sm font-bold text-white/30 mono">
                    {track.number}
                  </div>

                  {/* Track Title */}
                  <div className="sm:col-span-5">
                    <h3 className="text-2xl sm:text-3xl font-black uppercase text-white group-hover:text-neon-purple transition-colors">
                      {track.outlineTitle}
                    </h3>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      Focus: {track.focusSummary}
                    </p>
                  </div>

                  {/* Image visual thumbnail */}
                  <div className="sm:col-span-3 hidden sm:block">
                    <div className="h-14 w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden relative shadow-soft-ui">
                      <img 
                        src={track.image} 
                        alt={track.title} 
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-deep-black/60 to-transparent"></div>
                    </div>
                  </div>

                  {/* Prize Pool Display */}
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 mono block">Prize</span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-300 mono">{track.prizeDisplay}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full border border-white/15 soft-ui-chip flex items-center justify-center text-white/70 group-hover:border-neon-purple group-hover:text-neon-purple transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-6 py-6 pb-8 bg-black/30 border border-white/10 rounded-2xl my-3 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Prize Standings */}
                      <div className="p-5 rounded-2xl soft-ui-chip space-y-3">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/50 mono block">
                          Prize Distribution
                        </span>
                        <div className="space-y-2 text-xs mono">
                          <div className="flex justify-between items-center text-white pb-1.5 border-b border-white/10">
                            <span className="font-bold text-amber-400">🥇 1st Place</span>
                            <span className="font-bold text-amber-300">{track.firstPrize}</span>
                          </div>
                          <div className="flex justify-between items-center text-white/80 pb-1.5 border-b border-white/10">
                            <span>🥈 Runner Up</span>
                            <span className="font-bold text-white">{track.runnerUp}</span>
                          </div>
                          <div className="flex justify-between items-center text-white/70">
                            <span>🥉 3rd Place</span>
                            <span className="font-bold text-white">{track.thirdPrize}</span>
                          </div>
                        </div>
                      </div>

                      {/* Problem Focus List */}
                      <div className="p-5 rounded-2xl soft-ui-chip space-y-2">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/50 mono block">
                          Evaluation Objectives
                        </span>
                        <ul className="space-y-1.5 text-xs text-white/70">
                          {track.focus.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="material-symbols-outlined text-[14px] text-electric-cyan shrink-0 mt-0.5">check_circle</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tech Stack & Action */}
                      <div className="p-5 rounded-2xl soft-ui-chip flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest font-bold text-white/50 mono block mb-2">
                            Recommended Stacks
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {track.techStack.map((tech) => (
                              <span key={tech} className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] mono text-white/80">
                                #{tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate('/events')}
                          className="w-full bg-gradient-to-r from-neon-purple to-electric-cyan text-white py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-aurora cursor-pointer"
                        >
                          Register for {track.title}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
