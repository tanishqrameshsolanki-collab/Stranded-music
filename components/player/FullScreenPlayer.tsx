
import React, { useState } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { MoreHorizontal, Play, Pause, SkipBack, SkipForward, Volume2, Mic2, ListMusic, Airplay, Volume1, Loader2, Sliders } from 'lucide-react';
import { AppSettings, TrackType } from '../../types';
import MeshGradient from '../ui/MeshGradient';
import MotionArtwork from '../ui/MotionArtwork';
import LyricsView from './LyricsView';
import QueueView from './QueueView';
import SettingsModal from '../modals/SettingsModal';
import Scrubber from './Scrubber';
import { triggerHaptic } from '../../utils';
import { usePlayerStore, useUIStore } from '../../services/store';

type PlayerView = 'artwork' | 'lyrics' | 'queue';

const FullScreenPlayer: React.FC = () => {
  const track = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const isLoading = usePlayerStore(s => s.isLoading);
  const queue = usePlayerStore(s => s.queue);
  const queueIndex = usePlayerStore(s => s.queueIndex);
  const volume = usePlayerStore(s => s.volume);
  const { togglePlay, seek, next, prev, setVolume, playTrack } = usePlayerStore.getState();
  const setPlayerExpanded = useUIStore(s => s.setPlayerExpanded);

  const [activeView, setActiveView] = useState<PlayerView>('artwork');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
      highQuality: true, lossless: true, spatialAudio: true, crossfade: 2, eqMode: 'Balanced', sleepTimer: 0
  });

  const controls = useAnimation();

  const toggleView = (view: PlayerView) => {
      triggerHaptic('light');
      setActiveView(activeView === view ? 'artwork' : view);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 150 || info.velocity.y > 500) {
      setPlayerExpanded(false);
    } else {
      controls.start({ y: 0 });
    }
  };

  if (!track || !track.album) return null;
  const isClassical = track.type === TrackType.WORK_MOVEMENT || track.album.isClassical;

  return (
    <motion.div
      layoutId="player-container"
      className="fixed inset-0 z-[100] flex flex-col bg-[#050505] overflow-hidden"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.2 }}
      onDragEnd={handleDragEnd}
    >
      <MeshGradient colors={track.album.colors} imageUrl={track.album.coverUrl} intensity={activeView !== 'artwork' ? 0.3 : 1.5} isPlaying={isPlaying} />

      <AnimatePresence>
          {showSettings && (
              <SettingsModal settings={settings} onUpdate={setSettings} onClose={() => setShowSettings(false)} />
          )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 z-20 flex items-center justify-between px-6 pt-safe">
        <div className="w-10"></div>
        <button
            aria-label="Close player"
            className="w-11 h-1.5 bg-white/20 rounded-full cursor-pointer active:bg-white/40 transition-colors"
            onClick={() => setPlayerExpanded(false)}
        />
        <button
            aria-label="Audio settings"
            onClick={() => setShowSettings(true)}
            className={`p-2 transition-colors active:scale-95 ${settings.eqMode !== 'Balanced' || settings.sleepTimer > 0 ? 'text-[#FA233B]' : 'text-white/40 hover:text-white'}`}
        >
            <Sliders size={20} />
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row w-full max-w-[1400px] mx-auto px-8 md:px-16 pt-4 pb-safe flex-shrink-0 md:items-center md:h-full gap-8 md:gap-16">

        {/* Dynamic Gap based on orientation or space (Mobile Only) */}
        <div className="flex-1 min-h-[5vh] md:hidden" />

        {/* --- VIEW CONTENT (Artwork / Lyrics / Queue) --- */}
        <div className="flex-[4] md:flex-1 w-full flex flex-col items-center justify-center relative min-h-0 md:h-auto">
          <AnimatePresence mode="wait">
            {activeView === 'artwork' ? (
              <motion.div
                key="artwork"
                initial={{ opacity: 1, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full aspect-square relative flex items-center justify-center p-4"
              >
                <motion.div
                  layoutId="album-art"
                  className={`w-full max-w-[320px] md:max-w-[440px] aspect-square relative rounded-2xl md:rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:shadow-[0_40px_80px_rgba(0,0,0,0.6)] z-10 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isPlaying ? 'scale-105' : 'scale-95 opacity-80'}`}
                >
                  <MotionArtwork coverUrl={track.album.coverUrl} motionUrl={track.album.motionCoverUrl} isPlaying={isPlaying} className="w-full h-full" />
                </motion.div>
              </motion.div>
            ) : activeView === 'lyrics' ? (
               <motion.div key="lyrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 h-full overflow-hidden">
                 <LyricsView lyrics={track.lyrics} onSeek={seek} />
               </motion.div>
            ) : (
                <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 h-full overflow-hidden">
                    <QueueView queue={queue} currentIndex={queueIndex} onPlayTrack={(idx) => playTrack(queue[idx], queue)} />
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- INFORMATION & CONTROLS --- */}
        <div className="flex-shrink-0 mt-6 pb-2 md:mt-0 w-full md:w-[460px] md:bg-white/5 md:border md:border-white/10 md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] md:p-10 md:rounded-[40px] flex flex-col">

          {/* Track Info */}
          <div className="flex justify-between items-center mb-7">
              <motion.div layoutId="track-info" className="flex flex-col text-left pr-4 min-w-0">
                  <h2 className={`font-bold text-white leading-tight truncate tracking-tight drop-shadow-md ${isClassical ? 'text-[22px] md:text-[28px]' : 'text-[24px] md:text-[32px]'}`}>
                    {isClassical && track.workTitle ? track.workTitle : track.title}
                  </h2>
                  <p className={`text-white/70 font-medium truncate tracking-tight mt-0.5 drop-shadow-sm ${isClassical ? 'text-[16px]' : 'text-[17px]'}`}>
                    {isClassical && track.movementTitle ? track.movementTitle : track.artist.name}
                  </p>
              </motion.div>
              <div className="flex items-center space-x-1">
                 <button aria-label="More" className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/10 transition-colors shadow-sm cursor-pointer" onClick={() => triggerHaptic('light')}>
                   <MoreHorizontal size={20} className="text-white drop-shadow-sm" />
                 </button>
              </div>
          </div>

          {/* Progress Bar + Labels */}
          <Scrubber
            onSeek={seek}
            className="w-full mb-8 group relative"
            trackClassName="h-[5px] bg-white/20 shadow-inner"
            fillClassName="bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />

          {/* Playback Controls */}
          <div className="flex items-center justify-center space-x-14 mb-10">
            <button aria-label="Previous track" className="text-white active:text-white/40 active:scale-90 transition-[transform,color] drop-shadow-lg" onClick={prev}>
              <SkipBack size={38} fill="currentColor" strokeWidth={1} />
            </button>
            <button aria-label={isPlaying ? 'Pause' : 'Play'} className="text-white active:scale-95 active:opacity-60 transition-[transform,opacity] flex items-center justify-center min-w-[72px] drop-shadow-2xl" onClick={togglePlay}>
              {isLoading ? (
                  <Loader2 size={56} className="animate-spin text-white/50" />
              ) : isPlaying ? (
                  <Pause size={56} fill="currentColor" strokeWidth={1} />
              ) : (
                  <Play size={56} fill="currentColor" strokeWidth={1} />
              )}
            </button>
            <button aria-label="Next track" className="text-white active:text-white/40 active:scale-90 transition-[transform,color] drop-shadow-lg" onClick={next}>
              <SkipForward size={38} fill="currentColor" strokeWidth={1} />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex flex-col space-y-5 pb-6">
             <div className="flex items-center space-x-4 pt-2">
               <Volume1 size={16} className="text-white/40 drop-shadow-sm" />
               <div className="flex-1 h-[6px] bg-white/20 rounded-full relative group shadow-inner">
                  <div className="absolute top-0 left-0 h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ width: `${volume * 100}%` }} />
                  <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="absolute inset-x-0 -inset-y-3 w-full opacity-0 cursor-pointer" />
               </div>
               <Volume2 size={16} className="text-white/40 drop-shadow-sm" />
             </div>

             {/* Footer Toolbar */}
             <div className="flex justify-between items-center px-4 pt-2">
                <button
                  aria-label="Lyrics"
                  className={`transition-[transform,background-color,color] active:scale-90 flex items-center justify-center p-3 rounded-full ${activeView === 'lyrics' ? 'bg-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}
                  onClick={() => toggleView('lyrics')}
                >
                   <Mic2 size={20} strokeWidth={2.5} />
                </button>

                <button aria-label="AirPlay" className="text-white/50 hover:text-white/80 active:scale-90 transition-[transform,color] p-3 rounded-full hover:bg-white/10">
                    <Airplay size={20} strokeWidth={2.5} />
                </button>

                <button
                  aria-label="Queue"
                  className={`transition-[transform,background-color,color] active:scale-90 flex items-center justify-center p-3 rounded-full ${activeView === 'queue' ? 'bg-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}
                  onClick={() => toggleView('queue')}
                >
                   <ListMusic size={20} strokeWidth={2.5} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FullScreenPlayer;
