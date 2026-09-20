
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../../utils';
import { usePlayerStore, useUIStore } from '../../services/store';
import { useProgress } from '../../services/progress';
import Artwork from '../ui/Artwork';

const ProgressBar: React.FC = () => {
  const { currentTime, duration } = useProgress();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 overflow-hidden">
      <div
          className="h-full bg-white/40 rounded-r-full origin-left will-change-transform transition-transform duration-300 ease-linear"
          style={{ transform: `scaleX(${progress / 100})`, width: '100%' }}
      />
    </div>
  );
};

const MiniPlayer: React.FC = () => {
  const track = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const isLoading = usePlayerStore(s => s.isLoading);
  const { togglePlay, next } = usePlayerStore.getState();
  const setPlayerExpanded = useUIStore(s => s.setPlayerExpanded);

  if (!track || !track.album) return null;

  return (
    <motion.div
      layoutId="player-container"
      className="fixed bottom-[94px] left-3 right-3 bg-[#2c2c2e]/95 border border-white/10 rounded-xl h-[64px] flex items-center pr-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => setPlayerExpanded(true)}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {/* Artwork */}
      <div className="h-full aspect-square p-2 flex-shrink-0">
         <motion.div layoutId="album-art" className="w-full h-full rounded-[8px] overflow-hidden bg-[#333] shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
           <Artwork src={track.album.coverUrl} size={100} alt={track.title} className="w-full h-full object-cover" />
         </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-between min-w-0 px-2.5">
        <motion.div layoutId="track-info" className="flex flex-col min-w-0 pr-4">
          <span className="text-white/95 text-[15px] font-semibold truncate leading-tight">{track.title}</span>
          <span className="text-white/45 text-[13px] font-medium truncate leading-tight mt-0.5">{track.artist?.name}</span>
        </motion.div>

        <div className="flex items-center space-x-5 pl-2">
          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="text-white/95 active:opacity-40 transition-opacity flex items-center justify-center w-8 h-8"
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
            aria-label="Next track"
            className="text-white/95 active:opacity-40 transition-opacity flex items-center justify-center w-8 h-8"
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

      <ProgressBar />
    </motion.div>
  );
};

export default MiniPlayer;
