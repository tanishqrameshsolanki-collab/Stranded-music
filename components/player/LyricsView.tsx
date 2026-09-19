import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../../types';
import { triggerHaptic } from '../../utils';
import { useProgress } from '../../services/progress';

interface LyricsViewProps {
  lyrics?: LyricLine[];
  onSeek?: (time: number) => void;
}

const findActiveIndex = (lyrics: LyricLine[], currentTime: number) => {
  // Lines are sorted by time; binary search for the last line that has started.
  let lo = 0, hi = lyrics.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lyrics[mid].time <= currentTime) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  return ans;
};

const LyricsView: React.FC<LyricsViewProps> = ({ lyrics, onSeek }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTime } = useProgress();

  const activeIndex = lyrics && lyrics.length ? findActiveIndex(lyrics, currentTime) : -1;

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
            className={`text-2xl md:text-4xl font-bold transition-[color,transform,opacity] duration-500 ease-out origin-left cursor-pointer select-none active:opacity-60
              ${isActive ? 'text-white scale-100' : 'text-white/40 scale-95 hover:text-white/60'}
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
