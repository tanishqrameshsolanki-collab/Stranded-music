
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../../utils';
import { usePlayerStore, useUIStore } from '../../services/store';

const MiniPlayer: React.FC = () => {
  const { currentTrack: track, isPlaying, isLoading, currentTime, duration, togglePlay, next, prev } = usePlayerStore();
  const { setPlayerExpanded } = useUIStore();

  if (!track || !track.album) return null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div 
      layoutId="player-container"
      className="fixed bottom-[94px] left-3 right-3 bg-[#2c2c2e]/80 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 rounded-xl h-[64px] flex items-center pr-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
      onClick={() => setPlayerExpanded(true)}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {/* Artwork */}
      <div className="h-full aspect-square p-2 flex-shrink-0">
         <motion.img 
            layoutId="album-art"
            src={track.album.coverUrl || ''} 
            alt={track.title} 
            className="w-full h-full rounded-[8px] object-cover bg-[#333] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
         />
      </div>

      <div className="flex-1 flex items-center justify-between min-w-0 px-2.5">
        <motion.div layoutId="track-info" className="flex flex-col min-w-0 pr-4">
          <span className="text-white/95 text-[15px] font-semibold truncate leading-tight">{track.title}</span>
          <span className="text-white/45 text-[13px] font-medium truncate leading-tight mt-0.5">{track.artist?.name}</span>
        </motion.div>

        <div className="flex items-center space-x-5 pl-2">
          <button 
            className="text-white/95 active:opacity-40 transition-all flex items-center justify-center w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
              triggerHaptic('medium');
            }}
          >
            {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
            ) : isPlaying ? (
                <Pause size={24} fill="currentColor" strokeWidth={1} />
            ) : (
                <Play size={24} fill="currentColor" strokeWidth={1} />
            )}
          </button>
          <button 
            className="text-white/95 active:opacity-40 transition-all flex items-center justify-center w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              next();
              triggerHaptic('light');
            }}
          >
            <SkipForward size={24} fill="currentColor" strokeWidth={1} />
          </button>
        </div>
      </div>
      
      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 overflow-hidden">
        <div 
            className="h-full bg-white/40 rounded-r-full transition-[width] duration-300 ease-linear" 
            style={{ width: `${progress}%` }} 
        />
      </div>
    </motion.div>
  );
};

export default MiniPlayer;
