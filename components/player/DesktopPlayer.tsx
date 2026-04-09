import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Mic2, ListMusic, Loader2, Volume1 } from 'lucide-react';
import { TrackType } from '../../types';
import { formatTime } from '../../utils';
import { usePlayerStore, useUIStore } from '../../services/store';

const DesktopPlayer: React.FC = () => {
  const { currentTrack: track, isPlaying, isLoading, currentTime, duration, volume, togglePlay, seek, next, prev, setVolume } = usePlayerStore();
  const { setPlayerExpanded } = useUIStore();

  if (!track || !track.album) return null;

  const isClassical = track.type === TrackType.WORK_MOVEMENT || track.album.isClassical;

  return (
    <div className="w-full h-full flex items-center justify-between px-6 select-none shadow-sm pointer-events-auto">
      
      {/* Left: Playback Controls */}
      <div className="flex items-center w-[30%] min-w-[200px] justify-start space-x-5">
         <div className="flex items-center space-x-5">
             <button className="text-[#a1a1a1] hover:text-[#FA243C] transition-colors active:scale-95"><Shuffle size={16} strokeWidth={2.5} /></button>
             <button onClick={(e) => { e.stopPropagation(); prev(); }} className="text-[#a1a1a1] hover:text-white transition-colors active:scale-95"><SkipBack size={20} fill="currentColor" /></button>
             <button 
                className="w-[34px] h-[34px] flex items-center justify-center bg-[#ffffff15] border border-white/5 rounded-full hover:bg-[#ffffff25] active:bg-[#ffffff10] transition-all text-white shadow-sm"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
             >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-[#a1a1a1]" />
                ) : isPlaying ? (
                    <Pause size={16} fill="currentColor" className="ml-0.5" />
                ) : (
                    <Play size={16} fill="currentColor" className="ml-1" />
                )}
             </button>
             <button onClick={(e) => { e.stopPropagation(); next(); }} className="text-[#a1a1a1] hover:text-white transition-colors active:scale-95"><SkipForward size={20} fill="currentColor" /></button>
             <button className="text-[#a1a1a1] hover:text-[#FA243C] transition-colors active:scale-95"><Repeat size={16} strokeWidth={2.5} /></button>
         </div>
      </div>

      {/* Center: LCD Scrubber (Track Info + Scrubber) */}
      <div 
        className="flex flex-col items-center justify-center w-[40%] max-w-[540px] bg-[#00000040] border border-white/5 rounded-[6px] h-[40px] cursor-pointer group hover:bg-[#00000060] transition-colors px-3 relative overflow-hidden shadow-inner" 
        onClick={() => setPlayerExpanded(true)}
      >
          <div className="w-full flex items-center justify-between mt-[2px]">
             {/* Thumbnail & Text */}
             <div className="flex items-center space-x-2.5 w-full">
                <div className="w-6 h-6 rounded-[3px] bg-white/5 overflow-hidden flex-shrink-0 shadow-sm border border-white/10">
                    <img src={track.album.coverUrl || ''} className="w-full h-full object-cover" alt="Art" />
                </div>
                <div className="flex items-center justify-center w-full pr-8 space-x-1.5 overflow-hidden">
                    <span className="text-[12px] font-bold text-white/95 truncate mix-blend-plus-lighter tracking-tight">
                        {isClassical && track.workTitle ? track.workTitle : track.title}
                    </span>
                    <span className="text-[11px] text-[#888] truncate">—</span>
                    <span className="text-[12px] text-[#a1a1a1] font-medium truncate group-hover:underline mix-blend-plus-lighter tracking-tight">
                        {isClassical && track.movementTitle ? track.movementTitle : track.artist?.name}
                    </span>
                </div>
             </div>
          </div>
          
          {/* Apple LCD scrubber thin bar at the bottom */}
          <div className="absolute bottom-[2px] w-[calc(100%-16px)] flex items-center h-1.5 space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
             <span className="text-[9px] text-[#888] w-7 text-right tabular-nums font-semibold tracking-wide">{formatTime(currentTime)}</span>
             <div className="flex-1 h-[2px] bg-[#ffffff15] rounded-full relative overflow-hidden">
                 <div className="absolute top-0 left-0 h-full bg-[#a1a1a1] group-hover:bg-[#FA243C] rounded-full transition-colors" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                 <input 
                    type="range" 
                    min={0} max={duration || 1} 
                    value={currentTime} 
                    onChange={(e) => seek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
             </div>
             <span className="text-[9px] text-[#888] w-7 tabular-nums font-semibold tracking-wide">-{formatTime(duration - currentTime)}</span>
          </div>
      </div>

      {/* Right: Volume & Extras */}
      <div className="flex items-center justify-end w-[30%] space-x-5">
         <button 
            className="text-[#a1a1a1] hover:text-[#FA243C] transition-colors active:scale-95" 
            onClick={() => setPlayerExpanded(true)}
            title="Lyrics"
         >
            <Mic2 size={16} strokeWidth={2.5} />
         </button>
         <button className="text-[#a1a1a1] hover:text-[#FA243C] transition-colors active:scale-95">
            <ListMusic size={16} strokeWidth={2.5} />
         </button>
         
         <div className="flex items-center space-x-2 w-28 group relative pl-2">
             <Volume1 size={14} className="text-[#888]" />
             <div className="flex-1 h-[3px] bg-[#ffffff15] rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-[#a1a1a1] group-hover:bg-white rounded-full transition-colors" style={{ width: `${volume * 100}%` }} />
                <input 
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
             </div>
             <Volume2 size={14} className="text-[#888]" />
         </div>
      </div>

    </div>
  );
};

export default DesktopPlayer;
