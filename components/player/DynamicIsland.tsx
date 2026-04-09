
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Loader2, Mic2, Users } from 'lucide-react';
import { Track } from '../../types';
import { triggerHaptic } from '../../utils';

interface DynamicIslandProps {
  track: Track | null;
  isPlaying: boolean;
  isLoading?: boolean;
  isSearching?: boolean;
  onClick: () => void;
  onTogglePlay?: (e: React.MouseEvent) => void;
  onPartyClick?: (e: React.MouseEvent) => void;
  isPartyActive?: boolean;
}

const DynamicIsland: React.FC<DynamicIslandProps> = ({ 
  track, 
  isPlaying, 
  isLoading, 
  isSearching,
  onClick,
  onTogglePlay,
  onPartyClick,
  isPartyActive
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    pill: {
      width: 180,
      height: 38,
      borderRadius: 40,
      transition: { type: "spring", stiffness: 400, damping: 30 }
    },
    expanded: {
      width: 360,
      height: 72,
      borderRadius: 28,
      transition: { type: "spring", stiffness: 400, damping: 30 }
    },
    search: {
      width: 220,
      height: 44,
      borderRadius: 22,
      transition: { type: "spring", stiffness: 400, damping: 30 }
    }
  };

  const currentVariant = isSearching ? 'search' : (isExpanded ? 'expanded' : 'pill');

  if (!track) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-3 pointer-events-none">
      <motion.div
        layout
        variants={variants}
        animate={currentVariant}
        className="bg-black shadow-[0_4px_30px_rgba(0,0,0,0.5)] pointer-events-auto cursor-pointer relative overflow-hidden flex items-center justify-center border border-white/5"
        onClick={() => {
          if (!isExpanded) {
             setIsExpanded(true);
          } else {
             onClick(); // If already expanded, clicking opens full screen player
          }
          triggerHaptic('light');
        }}
        whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      >
        <div 
          className="absolute inset-0 opacity-20 blur-xl pointer-events-none"
          style={{ backgroundColor: track.album.colors.primary }}
        />

        <div className="relative z-10 w-full h-full flex items-center px-3">
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div 
                key="search-state"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center w-full space-x-3"
              >
                <div className="flex space-x-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-1 bg-[#FA233B] rounded-full"
                    />
                  ))}
                </div>
                <span className="text-white/90 text-sm font-bold tracking-tight">Listening...</span>
              </motion.div>
            ) : isExpanded ? (
              <motion.div 
                key="expanded-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center w-full h-full space-x-4 px-1"
              >
                <motion.div 
                  layoutId="island-art"
                  className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10"
                >
                  <img src={track.album.coverUrl} className="w-full h-full object-cover" />
                </motion.div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <motion.span className="text-white text-[15px] font-bold truncate leading-tight tracking-tight">
                    {track.title}
                  </motion.span>
                  <motion.span className="text-white/60 text-[13px] font-medium truncate tracking-tight">
                    {track.artist.name}
                  </motion.span>
                </div>

                <div className="flex items-center space-x-2 pr-1">
                   {onPartyClick && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); onPartyClick(e); triggerHaptic('light'); }}
                         className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform ${isPartyActive ? 'bg-[var(--color-apple-red)] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                       >
                         <Users size={16} fill={isPartyActive ? "currentColor" : "none"} />
                       </button>
                   )}
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlay?.(e);
                      triggerHaptic('medium');
                    }}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform hover:bg-white/20"
                   >
                     {isLoading ? (
                       <Loader2 size={20} className="animate-spin" />
                     ) : isPlaying ? (
                       <Pause size={20} fill="currentColor" />
                     ) : (
                       <Play size={20} fill="currentColor" className="ml-1" />
                     )}
                   </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="pill-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full h-full"
              >
                <motion.div 
                  layoutId="island-art"
                  className="w-7 h-7 rounded-full overflow-hidden bg-[#222] border border-white/10"
                  animate={isPlaying ? { rotate: 360 } : {}}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <img src={track.album.coverUrl} className="w-full h-full object-cover" />
                </motion.div>

                <div className="flex items-center space-x-[2.5px] pr-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={isPlaying ? { height: [4, 12, 6, 14, 4] } : { height: 4 }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      className={`w-[3px] rounded-full ${i === 1 ? 'bg-[#FA233B]' : 'bg-[#3B82F6]'}`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default DynamicIsland;
