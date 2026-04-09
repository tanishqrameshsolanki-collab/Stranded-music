import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../../types';

interface LyricsViewProps {
  lyrics?: LyricLine[];
  currentTime: number;
}

const LyricsView: React.FC<LyricsViewProps> = ({ lyrics, currentTime }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active line index
  const activeIndex = lyrics 
    ? lyrics.findIndex((line, i) => {
        const nextLine = lyrics[i + 1];
        return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
      })
    : -1;

  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeEl = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex]);

  if (!lyrics) return (
    <div className="flex items-center justify-center h-full text-white/50 text-lg font-medium">
      No lyrics available
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="flex flex-col space-y-8 px-8 py-12 overflow-y-auto h-full no-scrollbar mask-gradient"
      style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        
        return (
          <p 
            key={index}
            className={`text-2xl md:text-4xl font-bold transition-all duration-500 ease-out origin-left cursor-pointer
              ${isActive ? 'text-white scale-100 blur-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]' : 'text-white/30 scale-[0.98] blur-[1px]'}
              ${isPast ? 'text-white/20' : ''}
            `}
            onClick={() => {
              // In a real app, this would seek the audio
            }}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
};

export default LyricsView;