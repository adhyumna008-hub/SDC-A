import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const { user, role, signOutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const roleBadges: Record<UserRole, { label: string; bg: string; border: string; text: string }> = {
    admin: { label: 'ADMIN', bg: 'bg-neon-purple/20', border: 'border-neon-purple/50', text: 'text-neon-purple' },
    member: { label: 'COLLEGE MEMBER', bg: 'bg-electric-cyan/20', border: 'border-electric-cyan/50', text: 'text-electric-cyan' },
    guest: { label: 'EXTERNAL GUEST', bg: 'bg-tertiary/20', border: 'border-tertiary/50', text: 'text-tertiary' }
  };

  return (
    <header className="sticky top-0 z-50 pt-2.5 sm:pt-4 px-3 sm:px-6 md:px-8 w-full flex flex-col items-center pointer-events-none transition-all duration-300">
      <div className="w-full max-w-7xl backdrop-blur-2xl bg-[#090b16]/80 border border-white/10 rounded-full px-4 sm:px-6 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] flex justify-between items-center pointer-events-auto">
        {/* Brand */}
        <Link 
          to="/" 
          className="flex items-center gap-3 hover:opacity-95 transition-opacity group"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-neon-purple/30 blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-soft-ui group-hover:border-neon-purple/40 transition-colors">
              <img 
                src="/logo-sdc.svg" 
                alt="SDC Club Logo" 
                className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.7)] group-hover:scale-105 transition-transform" 
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg text-white tracking-tight leading-none group-hover:text-neon-purple transition-colors">SDC</span>
            <span className="text-[8px] uppercase tracking-[0.2em] font-semibold text-white/40 mono">Cohort 2026</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-1.5 items-center font-body-md p-1 rounded-full bg-black/20 border border-white/5">
          <Link
            to="/"
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/') 
                ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Home
          </Link>

          <Link
            to="/events"
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/events') 
                ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Events
          </Link>

          <Link
            to="/opportunities"
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/opportunities') 
                ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Opportunities
          </Link>

          <Link
            to="/idea-hub"
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all ${
              isActive('/idea-hub') 
                ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Idea Hub
          </Link>

          {user && (
            <Link
              to="/my-registrations"
              className={`text-xs px-3.5 py-1.5 rounded-full transition-all ${
                isActive('/my-registrations') 
                  ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              My Tickets
            </Link>
          )}

          {role === 'admin' && (
            <Link
              to="/admin"
              className={`px-3 py-1 rounded-full border transition-all text-xs mono font-bold flex items-center gap-1.5 ${
                isActive('/admin') 
                  ? 'bg-neon-purple text-white border-neon-purple shadow-aurora' 
                  : 'bg-neon-purple/10 text-neon-purple border-neon-purple/30 hover:bg-neon-purple/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
              Command Center
            </Link>
          )}
        </nav>

        {/* Right Actions & Auth */}
        <div className="hidden md:flex items-center space-x-3 relative">
          {/* Authentic Role Badge */}
          <div className={`font-label-caps text-[10px] px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-soft-ui-chip ${roleBadges[role].bg} ${roleBadges[role].border} ${roleBadges[role].text}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            <span>{roleBadges[role].label}</span>
          </div>

          {/* Admin shortcut button (Only visible if role is admin) */}
          {role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="text-white/70 hover:text-neon-purple transition-colors p-2 rounded-full hover:bg-white/5 flex items-center justify-center border border-neon-purple/30 bg-neon-purple/10 shadow-soft-ui cursor-pointer"
              title="Admin Command Center"
            >
              <span className="material-symbols-outlined text-lg text-neon-purple">admin_panel_settings</span>
            </button>
          )}

          {/* User profile / Sign In button */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={user.photoURL || '/default-avatar.svg'}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full border border-neon-purple/50 object-cover shadow-soft-ui"
                />
                {user.emailVerified && (
                  <span 
                    title="Verified Student Email"
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-deep-black flex items-center justify-center text-[9px] text-white"
                  >
                    ✓
                  </span>
                )}
              </div>
              <button
                onClick={signOutUser}
                className="soft-ui-btn px-3 py-1 text-white/80 hover:text-white mono text-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="soft-ui-btn flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white hover:text-neon-purple transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-neon-purple">login</span>
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/80 hover:text-white p-2 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu Drawer (Fully Interactive & Clickable) */}
      {mobileMenuOpen && (
        <div className="w-full max-w-7xl mt-2 pointer-events-auto md:hidden backdrop-blur-3xl bg-[#080d1e]/98 border border-white/15 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-3 animate-fadeIn">
          {/* Header Info */}
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <span className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider">Navigation Menu</span>
            <span className={`font-label-caps text-[10px] px-2.5 py-1 rounded-full border ${roleBadges[role].bg} ${roleBadges[role].border} ${roleBadges[role].text} font-bold`}>
              {roleBadges[role].label}
            </span>
          </div>

          <nav className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                isActive('/') 
                  ? 'bg-white text-black font-bold shadow-md' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-lg">home</span>
              <span className="text-sm font-medium">Home</span>
            </Link>

            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                isActive('/events') 
                  ? 'bg-white text-black font-bold shadow-md' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-lg">event</span>
              <span className="text-sm font-medium">Events & Workshops</span>
            </Link>

            <Link
              to="/opportunities"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                isActive('/opportunities') 
                  ? 'bg-white text-black font-bold shadow-md' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-lg">radar</span>
              <span className="text-sm font-medium">Opportunity Radar</span>
            </Link>

            <Link
              to="/idea-hub"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                isActive('/idea-hub') 
                  ? 'bg-white text-black font-bold shadow-md' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-lg">hub</span>
              <span className="text-sm font-medium">Student Idea Hub</span>
            </Link>

            {user && (
              <Link
                to="/my-registrations"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive('/my-registrations') 
                    ? 'bg-white text-black font-bold shadow-md' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-lg">confirmation_number</span>
                <span className="text-sm font-medium">My Tickets & Passes</span>
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive('/admin') 
                    ? 'bg-neon-purple text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                    : 'text-neon-purple hover:bg-neon-purple/20'
                }`}
              >
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                <span className="text-sm font-bold">Admin Command Center</span>
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-white/10">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                  <img
                    src={user.photoURL || '/default-avatar.svg'}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full border border-neon-purple object-cover"
                  />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-white truncate">{user.displayName || 'Member'}</span>
                    <span className="text-[10px] text-white/50 truncate font-mono">{user.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { signOutUser(); setMobileMenuOpen(false); }}
                  className="w-full bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/10 text-white/90 py-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                className="w-full bg-gradient-to-r from-neon-purple to-electric-cyan hover:opacity-95 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Sign In / Join</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Authentication Modal (Google & Email/Password) */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
};
