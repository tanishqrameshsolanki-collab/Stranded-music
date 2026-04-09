
import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../../types';
import { triggerHaptic } from '../../utils';

interface LyricsViewProps {
  lyrics?: LyricLine[];
  currentTime: number;
  onSeek?: (time: number) => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({ lyrics, currentTime, onSeek }) => {
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

  if (!lyrics || lyrics.length === 0) return (
    <div className="flex items-center justify-center h-full text-white/50 text-lg font-medium">
      No lyrics available
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="flex flex-col space-y-8 px-8 py-24 overflow-y-auto h-full no-scrollbar mask-gradient"
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        
        return (
          <p 
            key={index}
            className={`text-2xl md:text-4xl font-bold transition-all duration-500 ease-out origin-left cursor-pointer select-none active:opacity-60
              ${isActive ? 'text-white scale-100 blur-0' : 'text-white/40 scale-95 blur-[0.5px] hover:text-white/60'}
              ${isPast ? 'text-white/20' : ''}
            `}
            onClick={() => {
              if (onSeek) {
                  onSeek(line.time);
                  triggerHaptic('light');
              }
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
