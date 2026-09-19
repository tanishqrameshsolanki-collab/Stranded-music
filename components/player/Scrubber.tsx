import React, { useState } from 'react';
import { useProgress } from '../../services/progress';
import { formatTime } from '../../utils';

interface ScrubberProps {
  onSeek?: (time: number) => void;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  labelClassName?: string;
  showLabels?: boolean;
  disabled?: boolean;
}

// The only component (besides lyrics) that re-renders on playback ticks. While the user
// drags, the local value wins so the bar doesn't fight incoming progress updates.
const Scrubber: React.FC<ScrubberProps> = ({
  onSeek,
  className = '',
  trackClassName = 'h-[5px] bg-white/20',
  fillClassName = 'bg-white/90',
  labelClassName = 'text-[11px] text-white/60 font-medium mt-2 tracking-wide',
  showLabels = true,
  disabled = false,
}) => {
  const { currentTime, duration } = useProgress();
  const [dragValue, setDragValue] = useState<number | null>(null);

  const shown = dragValue ?? currentTime;
  const pct = duration > 0 ? Math.min(100, (shown / duration) * 100) : 0;

  const commit = (value: number) => {
    setDragValue(null);
    onSeek?.(value);
  };

  return (
    <div className={className}>
      <div className={`relative w-full rounded-full overflow-visible ${trackClassName}`}>
        <div className={`absolute top-0 left-0 h-full rounded-full ${fillClassName}`} style={{ width: `${pct}%` }} />
        {!disabled && (
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={shown}
            aria-label="Seek"
            onChange={(e) => setDragValue(Number(e.target.value))}
            onPointerUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
            onKeyUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
            onBlur={() => { if (dragValue !== null) commit(dragValue); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        )}
      </div>
      {showLabels && (
        <div className={`flex justify-between tabular-nums ${labelClassName}`}>
          <span>{formatTime(shown)}</span>
          <span>-{formatTime(Math.max(0, duration - shown))}</span>
        </div>
      )}
    </div>
  );
};

export default Scrubber;
