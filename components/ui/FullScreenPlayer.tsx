import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { MoreHorizontal, Play, Pause, SkipBack, SkipForward, Volume2, Mic2, ListMusic, Airplay, Volume1, Plus, Check } from 'lucide-react';
import { Track } from '../../types';
import MeshGradient from '../ui/MeshGradient';
import MotionArtwork from '../ui/MotionArtwork';
import LyricsView from './LyricsView';
import { formatTime, triggerHaptic } from '../../utils';
import { libraryService } from '../../services/supabase';

interface FullScreenPlayerProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onCollapse: () => void;
  onSeek: (time: number) => void;
}

const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ 
  track, isPlaying, currentTime, duration, onTogglePlay, onCollapse, onSeek 
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [inLibrary, setInLibrary] = useState(false);
  const controls = useAnimation();

  // Check if track is in library on load
  useEffect(() => {
    const checkLibrary = async () => {
      const exists = await libraryService.checkIsSaved(track.id);
      setInLibrary(exists);
    };
    checkLibrary();
  }, [track.id]);

  const toggleLibrary = async () => {
    triggerHaptic('medium');
    if (inLibrary) {
      setInLibrary(false);
      await libraryService.removeTrack(track.id);
    } else {
      setInLibrary(true);
      await libraryService.saveTrack(track);
    }
  };

  // Handle Drag to Dismiss (iOS Physics)
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 150 || info.velocity.y > 500) {
      onCollapse();
    } else {
      controls.start({ y: 0 });
    }
  };

  return (
    <motion.div 
      layoutId="player-container"
      className="fixed inset-0 z-[100] flex flex-col bg-transparent overflow-hidden"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", damping: 35, stiffness: 400, mass: 0.9 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.2 }}
      onDragEnd={handleDragEnd}
    >
      <MeshGradient colors={track.album.colors} intensity={showLyrics ? 0.3 : 0.8} isPlaying={isPlaying} />
      
      {/* Grab Handle */}
      <div 
        className="absolute top-0 left-0 right-0 h-12 z-20 flex items-center justify-center cursor-pointer active:opacity-50"
        onClick={onCollapse}
      >
        <div className="w-10 h-1.5 bg-white/20 rounded-full mt-3 backdrop-blur-md" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex-1 flex flex-col w-full max-w-2xl mx-auto px-6 md:px-12 pt-8 pb-8 md:pb-12 min-h-0">
        
        <div className="flex-1 flex flex-col justify-center relative min-h-0">
          <AnimatePresence mode="wait">
            {!showLyrics ? (
                <motion.div 
                  key="artwork"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full flex-1 min-h-0 flex items-center justify-center mb-6 md:mb-10 mt-2"
                >
                  <div className="relative h-full aspect-square max-h-[50vh] max-w-full">
                    <motion.div 
                      layoutId="album-art" 
                      className={`absolute inset-0 w-full h-full rounded-[3xl] md:rounded-[40px] overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isPlaying ? 'scale-100 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)]' : 'scale-[0.80] shadow-none opacity-80'}`}
                    >
                  <MotionArtwork 
                    coverUrl={track.album.coverUrl} 
                    motionUrl={track.album.motionCoverUrl}
                    isPlaying={isPlaying}
                    className="w-full h-full" 
                  />
                    </motion.div>
                  </div>
                </motion.div>
            ) : (
               <motion.div 
                key="lyrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex-1 h-full overflow-hidden"
               >
                 <LyricsView lyrics={track.lyrics} currentTime={currentTime} />
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Controls Section */}
        <div className="flex-shrink-0 mb-2">
          
          {/* Metadata */}
          {!showLyrics && (
            <div className="flex justify-between items-end mb-6">
              <motion.div layoutId="track-info" className="flex flex-col text-left pr-4 min-w-0">
                  <h2 className="text-[24px] font-bold text-white leading-tight truncate tracking-tight">
                    {track.title}
                  </h2>
                  <p className="text-[20px] text-white/60 font-medium truncate tracking-tight mt-0.5">
                    {track.artist.name}
                  </p>
              </motion.div>
              
              <div className="flex space-x-4">
                 <button 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${inLibrary ? 'bg-white text-[#FA243C]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLibrary();
                  }}
                >
                  {inLibrary ? <Check size={18} strokeWidth={3} /> : <Plus size={20} />}
                </button>
                <button 
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  onClick={() => triggerHaptic('light')}
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Scrubber */}
          <div className="w-full mb-6 group cursor-pointer mt-2">
            <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            {/* Hit area for scrubber input */}
            <div className="relative h-4 -mt-3">
                 <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={(e) => {
                    onSeek(Number(e.target.value));
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
            </div>

            <div className="flex justify-between text-[12px] text-white/50 font-medium mt-2.5 tracking-wide">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </div>
          </div>

          {/* Main Transport Controls */}
          <div className="flex items-center justify-center space-x-12 md:space-x-16 mb-8 mt-4">
            <button 
                className="text-white/90 hover:text-white hover:scale-105 active:scale-95 transition-all"
                onClick={() => {
                    // Logic for prev
                    triggerHaptic('light');
                }}
            >
              <SkipBack size={38} fill="currentColor" />
            </button>
            <button 
              className="text-white hover:scale-105 active:scale-90 transition-all shadow-xl rounded-full"
              onClick={() => {
                onTogglePlay();
                triggerHaptic('medium');
              }}
            >
              {isPlaying ? (
                <Pause size={64} fill="currentColor" />
              ) : (
                <Play size={64} fill="currentColor" />
              )}
            </button>
            <button 
                className="text-white/90 hover:text-white hover:scale-105 active:scale-95 transition-all"
                onClick={() => {
                    // Logic for next
                    triggerHaptic('light');
                }}
            >
              <SkipForward size={38} fill="currentColor" />
            </button>
          </div>
          
          {/* Volume Slider & Footer Actions */}
          <div className="flex flex-col space-y-6">
             <div className="flex items-center space-x-4">
               <Volume1 size={18} className="text-white/50" />
               <div className="flex-1 h-1.5 bg-white/20 rounded-full relative group">
                  <div className="absolute top-0 left-0 h-full bg-white/90 rounded-full" style={{ width: `${volume * 100}%` }} />
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
               </div>
               <Volume2 size={18} className="text-white/50" />
             </div>

             <div className="flex justify-center items-center space-x-12 md:space-x-20 pt-2 pb-2">
                <button 
                  className={`transition-all active:scale-90 ${showLyrics ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                  onClick={() => {
                      setShowLyrics(!showLyrics);
                      triggerHaptic('light');
                  }}
                >
                   <div className={`p-2.5 rounded-xl ${showLyrics ? 'bg-white/20 backdrop-blur-md' : ''}`}>
                      <Mic2 size={24} />
                   </div>
                </button>
                <button className="text-white/40 hover:text-white/60 active:scale-90 transition-all">
                   <Airplay size={24} />
                </button>
                <button className="text-white/40 hover:text-white/60 active:scale-90 transition-all">
                   <ListMusic size={24} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FullScreenPlayer;