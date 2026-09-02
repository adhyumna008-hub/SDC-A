import React from 'react';
import { getSystemAnnouncements } from '../services/dataService';

export const AnnouncementTicker: React.FC = () => {
  const announcements = getSystemAnnouncements().filter(a => a.active);

  if (!announcements.length) return null;

  return (
    <div className="bg-surface-gray/90 border-b border-outline-variant/10 text-xs font-code-sm py-1.5 px-4 overflow-hidden relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="flex items-center gap-1 bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest shrink-0 border border-neon-purple/30">
            <span className="w-1.5 h-1.5 rounded-full bg-success-glow animate-pulse"></span>
            LIVE RADAR
          </span>
          <div className="flex items-center gap-6 animate-marquee whitespace-nowrap text-on-surface-variant">
            {announcements.map((ann) => (
              <span key={ann.id} className="flex items-center gap-2">
                <span>{ann.title}</span>
                <span className="text-outline">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
