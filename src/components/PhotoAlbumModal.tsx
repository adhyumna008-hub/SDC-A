import React, { useState, useEffect } from 'react';
import { EventItem } from '../types';

interface PhotoAlbumModalProps {
  event: EventItem;
  initialIndex?: number;
  onClose: () => void;
}

export const PhotoAlbumModal: React.FC<PhotoAlbumModalProps> = ({ event, initialIndex = 0, onClose }) => {
  const images = event.galleryImages && event.galleryImages.length > 0
    ? event.galleryImages
    : [event.image];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-deep-black/90 backdrop-blur-2xl animate-fadeIn">
      <div className="relative max-w-5xl w-full h-[90vh] flex flex-col justify-between bg-[#0b1326]/95 border border-white/20 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-neon-purple/20 text-neon-purple border border-neon-purple/30 text-[10px] font-label-caps uppercase px-2.5 py-0.5 rounded-lg font-bold">
                Event Photo Album
              </span>
              <span className="text-xs font-code-sm text-on-surface-variant">
                Photo {currentIndex + 1} of {images.length}
              </span>
            </div>
            <h3 className="font-headline-lg text-lg sm:text-xl font-bold text-white mt-1 truncate max-w-xl">
              {event.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-on-surface-variant hover:text-white flex items-center justify-center border border-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Main Stage Image with Carousel Controls */}
        <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-2xl bg-deep-black/60 border border-white/10 group">
          <img
            src={images[currentIndex]}
            alt={`${event.title} photo ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300 select-none"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-deep-black/70 hover:bg-neon-purple text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all shadow-lg hover:scale-110"
                title="Previous Photo (Left Arrow)"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>

              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-deep-black/70 hover:bg-neon-purple text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all shadow-lg hover:scale-110"
                title="Next Photo (Right Arrow)"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {/* Bottom Thumbnail Filmstrip */}
        {images.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 relative z-10 no-scrollbar">
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-14 sm:w-20 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.6)] scale-105 opacity-100'
                    : 'border-white/15 opacity-50 hover:opacity-100 hover:border-white/40'
                }`}
              >
                <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
