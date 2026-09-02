import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 mt-auto border-t border-white/10 backdrop-blur-2xl bg-[#060812]/95 pt-16 sm:pt-20 pb-12 px-4 sm:px-8 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Massive Editorial Outline Headline */}
        <div className="mb-14 sm:mb-16">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neon-purple mono block mb-3">
            University Developer Ecosystem
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/30 leading-[0.95] tracking-tight uppercase select-none">
            STUDENT <br className="hidden sm:inline" />
            DEVELOPERS CLUB
          </h2>
        </div>

        {/* Multi-column navigation & community links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 pb-16 border-b border-white/10">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-sdc.svg" 
                alt="SDC Club Emblem" 
                className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]" 
              />
              <div className="flex flex-col">
                <span className="font-black text-lg text-white tracking-tight leading-none">SDC VCE</span>
                <span className="text-[8px] mono text-neon-purple font-bold tracking-widest uppercase">Cohort 2026</span>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs">
              The premier engineering collective at Vardhaman College of Engineering. Crafting production code, building autonomous systems, and dominating national hackathons.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-bold text-white/50 mono">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-white/70 hover:text-neon-purple transition-colors">Home Terminal</Link>
              </li>
              <li>
                <Link to="/events" className="text-white/70 hover:text-neon-purple transition-colors">Events & Hackathons</Link>
              </li>
              <li>
                <Link to="/opportunities" className="text-white/70 hover:text-neon-purple transition-colors">Opportunities Radar</Link>
              </li>
              <li>
                <Link to="/idea-hub" className="text-white/70 hover:text-neon-purple transition-colors">Community Idea Hub</Link>
              </li>
              <li>
                <Link to="/my-registrations" className="text-white/70 hover:text-neon-purple transition-colors">My Ticket Wallet</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Communities */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-bold text-white/50 mono">Socials</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://discord.gg/sdc-vce" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/70 hover:text-neon-purple transition-colors flex items-center gap-1.5"
                >
                  <span>Discord Community</span>
                  <span className="material-symbols-outlined text-xs">arrow_outward</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/company/student-developer-club-vce" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/70 hover:text-electric-cyan transition-colors flex items-center gap-1.5"
                >
                  <span>LinkedIn Chapter</span>
                  <span className="material-symbols-outlined text-xs">arrow_outward</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/studentdevelopersclub.vce?igsi=MWRmZ3J5Y3N4NnRscw==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/70 hover:text-pink-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Instagram</span>
                  <span className="material-symbols-outlined text-xs">arrow_outward</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>GitHub Org</span>
                  <span className="material-symbols-outlined text-xs">arrow_outward</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Chapter */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-bold text-white/50 mono">Headquarters</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Vardhaman College of Engineering<br />
              Kacharam, Shamshabad, Hyderabad,<br />
              Telangana 501218
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Command Center Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 gap-4 text-xs text-white/40">
          <p>© 2026 Student Developers Club. All rights reserved.</p>
          <p className="mono text-[10px] uppercase tracking-wider text-center">
            Affiliated with Vardhaman College of Engineering
          </p>
        </div>
      </div>
    </footer>
  );
};
