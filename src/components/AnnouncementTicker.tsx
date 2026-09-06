import React, { useEffect, useState } from 'react';
import { subscribeClubSettingsService, subscribeEventsService } from '../services/dataService';
import { ClubSettings, EventItem } from '../types';

export const AnnouncementTicker: React.FC = () => {
  const [settings, setSettings] = useState<ClubSettings>({
    announcementActive: true,
    announcementText: ''
  });
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const unsubSettings = subscribeClubSettingsService((newSettings) => {
      setSettings(newSettings);
    });
    const unsubEvents = subscribeEventsService((newEvents) => {
      setEvents(newEvents);
    });

    return () => {
      unsubSettings();
      unsubEvents();
    };
  }, []);

  // If announcement ticker has been explicitly disabled by admin
  if (settings.announcementActive === false) {
    return null;
  }

  // Compile dynamic list of broadcast messages
  const announcements: string[] = [];

  // 1. Custom admin broadcast (if configured in Firestore)
  if (settings.announcementText && settings.announcementText.trim()) {
    announcements.push(settings.announcementText.trim());
  }

  // 2. Real-time announcement derived from active upcoming events in Firestore
  const openEvents = events.filter(e => (e.registered_count || 0) < (e.max_seats || 999));
  if (openEvents.length > 0) {
    const primaryEvent = openEvents[0];
    announcements.push(`🚀 Registrations are now LIVE for "${primaryEvent.title}"!`);
  } else if (events.length > 0) {
    announcements.push(`📅 Next Event: "${events[0].title}"`);
  }

  // 3. Platform community prompt
  announcements.push(`💡 Upvote and propose community workshops in the Idea Hub!`);

  if (!announcements.length) return null;

  return (
    <div className="bg-[#0b1326]/95 border-b border-white/10 text-xs font-code-sm py-1.5 px-4 overflow-hidden relative z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <span className="flex items-center gap-1.5 bg-neon-purple/20 text-neon-purple px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest shrink-0 border border-neon-purple/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE RADAR
          </span>
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap text-white/80 text-xs">
            {announcements.map((text, idx) => (
              <span key={idx} className="flex items-center gap-3 shrink-0">
                <span className="hover:text-white transition-colors">{text}</span>
                <span className="text-white/20">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
