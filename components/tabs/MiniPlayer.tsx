import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, FastForward } from 'lucide-react';
import { Track } from '../../types';
import { triggerHaptic } from '../../utils';

interface MiniPlayerProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExpand: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ track, isPlaying, onTogglePlay, onExpand }) => {
  return (
    <motion.div 
      layoutId="player-container"
      className="fixed bottom-[84px] md:bottom-6 left-2 right-2 md:left-auto md:right-auto md:w-96 bg-[#282828]/80 backdrop-blur-3xl backdrop-saturate-150 border border-white/5 rounded-xl h-[58px] flex items-center pr-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden cursor-pointer"
      onClick={onExpand}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Artwork */}
      <div className="h-full aspect-square p-1.5">
         <motion.img 
            layoutId="album-art"
            src={track.album.coverUrl} 
            alt={track.title} 
            className="w-full h-full rounded-[6px] object-cover bg-[#333] shadow-md"
         />
      </div>

      <div className="flex-1 flex items-center justify-between min-w-0 pr-1 pl-1">
        <motion.div layoutId="track-info" className="flex items-center min-w-0 pr-4">
          <span className="text-white/95 text-[16px] font-medium truncate mr-1.5 leading-snug">{track.title}</span>
          <span className="text-white/50 text-[16px] truncate hidden sm:inline leading-snug">&bull; {track.artist.name}</span>
        </motion.div>

        <div className="flex items-center space-x-5">
          <button 
            className="text-white/90 hover:scale-105 active:scale-90 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
              triggerHaptic('medium');
            }}
          >
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button 
            className="text-white/90 hover:scale-105 active:scale-90 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
            }}
          >
            <FastForward size={22} fill="currentColor" />
          </button>
        </div>
      </div>
      
      {/* Progress Bar overlay on bottom - iOS Detail */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
        <div className="h-full bg-white/50 w-1/3 rounded-r-full" />
      </div>
    </motion.div>
  );
};

export default MiniPlayer;