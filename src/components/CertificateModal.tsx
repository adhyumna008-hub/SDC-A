import React, { useRef } from 'react';
import { EventItem, EventRegistration, EventWinner } from '../types';

interface CertificateModalProps {
  event: EventItem;
  registration?: EventRegistration;
  winnerInfo?: EventWinner;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ event, registration, winnerInfo, onClose }) => {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const recipientName = winnerInfo ? winnerInfo.teamOrName : (registration?.userName || 'Student Developer');
  const certType = winnerInfo ? `OFFICIAL WINNER CERTIFICATE (${winnerInfo.position})` : 'OFFICIAL PARTICIPATION CERTIFICATE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-gray border border-outline-variant/30 rounded-2xl max-w-3xl w-full p-6 md:p-8 relative shadow-2xl overflow-hidden flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-2 text-neon-purple font-headline-lg font-bold">
            <span className="material-symbols-outlined text-2xl">verified</span>
            <span>SDC Verified Credentials</span>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-white p-1 rounded-full hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Printable Certificate Frame */}
        <div 
          ref={certRef}
          className="bg-deep-black border-2 border-neon-purple/50 rounded-xl p-8 text-center relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)]"
        >
          {/* Ambient Glow Corner Accents */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-neon-purple/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-electric-cyan/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Header Stamp */}
            <div className="flex items-center gap-2 text-neon-purple font-label-caps text-xs tracking-widest uppercase mb-4 bg-neon-purple/10 px-3 py-1 rounded-full border border-neon-purple/30">
              <span className="material-symbols-outlined text-sm">terminal</span>
              <span>STUDENT DEVELOPERS CLUB • VARDHAMAN</span>
            </div>

            <h2 className="font-headline-xl text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
              {certType}
            </h2>
            <p className="text-on-surface-variant font-code-sm text-sm mb-6">This credential confirms that</p>

            <div className="font-headline-xl text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-electric-cyan to-primary mb-6 py-1">
              {recipientName}
            </div>

            <p className="text-on-surface-variant font-body-md text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              has successfully participated in and verified attendance at <span className="text-white font-bold">{event.title}</span> held on <span className="text-electric-cyan font-code-sm">{event.date}</span>.
            </p>

            {winnerInfo && (
              <div className="bg-surface-gray/80 border border-tertiary/40 rounded-lg p-3 mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-2xl">emoji_events</span>
                <div className="text-left font-code-sm text-xs">
                  <div className="text-tertiary font-bold">{winnerInfo.position} Winner</div>
                  <div className="text-on-surface-variant">{winnerInfo.projectTitle || 'Outstanding Project Entry'}</div>
                </div>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="w-full grid grid-cols-2 gap-8 pt-6 border-t border-outline-variant/20 mt-4 text-xs font-code-sm text-on-surface-variant">
              <div className="flex flex-col items-center">
                <div className="font-bold text-white mb-1">Dr. Admin Thorne</div>
                <div className="text-[10px] text-outline uppercase">Faculty Coordinator, SDC</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-bold text-electric-cyan mb-1">Credential Hash</div>
                <div className="text-[10px] text-outline font-mono">SDC-VERIFIED-{event.id.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-4 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded font-code-sm text-xs text-on-surface-variant hover:text-white bg-surface-bright"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 rounded font-label-caps text-xs uppercase bg-neon-purple text-white hover:bg-inverse-primary glow-shadow-primary transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};
