
import React, { useEffect, useState } from 'react';
import { PlayCircle, LayoutGrid, Search as SearchIcon, Library, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tab, ChatMessage, User } from './types';
import { triggerHaptic } from './utils';
import { authService, partyService } from './services/supabase';
import { usePlayerStore, useUIStore } from './services/store';

import MiniPlayer from './components/player/MiniPlayer';
import DesktopPlayer from './components/player/DesktopPlayer';
import FullScreenPlayer from './components/player/FullScreenPlayer';
import ListenNow from './components/tabs/ListenNow';
import Browse from './components/tabs/Browse';
import LibraryTab from './components/tabs/Library';
import Search from './components/tabs/Search';
import Connect from './components/tabs/Connect';
import Sidebar from './components/nav/Sidebar';
import YouTubeAudioPlayer from './components/player/YouTubeAudioPlayer';
import ArtistDetail from './components/details/ArtistDetail';
import AlbumDetail from './components/details/AlbumDetail';
import Login from './components/auth/Login';
import DynamicIsland from './components/player/DynamicIsland';
import PartyRoom from './components/player/PartyRoom';

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Global Player State
  const { 
      isPlaying, currentTrack, currentTime, duration, volume, 
      activeYoutubeId, seekTarget, isHost, activeParty, isLoading,
      togglePlay, next, prev, seek, setVolume, joinParty, leaveParty 
  } = usePlayerStore();

  
  const { 
      activeTab, setActiveTab, 
      isPlayerExpanded, setPlayerExpanded, 
      currentView, setView,
      isPartyRoomOpen, setPartyRoomOpen 
  } = useUIStore();


  // --- Auth Initialization ---
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
        const timeout = new Promise(resolve => setTimeout(() => resolve(null), 3000));
        try {
            const userOrNull = await Promise.race([
                authService.getUser().catch(() => null),
                timeout
            ]);
            if (mounted) setUser(userOrNull);
        } catch (e) { 
            // Silent fail
        } 
        finally { if (mounted) setIsAuthLoading(false); }
    };
    initAuth();
    const { data } = authService.onAuthStateChange((u) => {
        if (mounted) { setUser(u); setIsAuthLoading(false); }
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  const handleManualLogin = (u: any) => { setUser(u); setIsAuthLoading(false); };

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        switch (e.key) {
            case ' ':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowRight':
                if (e.metaKey || e.ctrlKey) next();
                else seek(Math.min(currentTime + 10, duration));
                break;
            case 'ArrowLeft':
                if (e.metaKey || e.ctrlKey) prev();
                else seek(Math.max(0, currentTime - 10));
                break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, next, prev, seek, currentTime, duration]);

  // --- Party Logic: URL Joining & Heartbeat ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partyIdValue = params.get('partyId');
    if (partyIdValue && user && !activeParty) {
        joinParty({
            id: partyIdValue,
            hostId: partyIdValue,
            hostName: 'Friend',
            listeners: [],
            messages: []
        });
        setPartyRoomOpen(true);
    }
  }, [user]);

  useEffect(() => {
      if (!activeParty || !isHost) return;

      let lastBroadcastTrackId = currentTrack?.id || '';
      let lastBroadcastPlaying = isPlaying;

      const broadcastInterval = setInterval(() => {
          const store = usePlayerStore.getState();
          partyService.broadcastState({ 
              isPlaying: store.isPlaying, 
              currentTrack: store.currentTrack, 
              currentTime: store.currentTime, 
              lastUpdated: Date.now() 
          });
      }, 2000); // Tighter 2s heartbeat for smoother sync

      const dbSyncInterval = setInterval(() => {
          const store = usePlayerStore.getState();
          if (store.activeParty) {
              // Only write to DB when state actually changes
              const trackChanged = store.currentTrack?.id !== lastBroadcastTrackId;
              const playChanged = store.isPlaying !== lastBroadcastPlaying;
              if (trackChanged || playChanged) {
                  lastBroadcastTrackId = store.currentTrack?.id || '';
                  lastBroadcastPlaying = store.isPlaying;
                  partyService.updatePartyStateDB(store.activeParty.id, {
                      isPlaying: store.isPlaying,
                      currentTrack: store.currentTrack,
                      currentTime: store.currentTime,
                      lastUpdated: Date.now()
                  });
              }
          }
      }, 5000); // Check every 5s but only write if changed

      return () => {
          clearInterval(broadcastInterval);
          clearInterval(dbSyncInterval);
      };
  }, [activeParty?.id, isHost]);




  // --- View Helpers ---
  const handleTabChange = (tab: Tab) => { setActiveTab(tab); };

  if (isAuthLoading) return (
    <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center z-50">
         <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
    </div>
  );

  if (!user) return <Login onLogin={handleManualLogin} />;

  return (
    <div className="h-screen w-full bg-black text-white relative flex flex-col font-sans overflow-hidden">
      {/* Hidden YouTube Player controlled by Store State */}
      <YouTubeAudioPlayer 
        videoId={activeYoutubeId || ''} 
        isPlaying={isPlaying && !!activeYoutubeId} 
        volume={volume}
        seekTo={seekTarget !== null ? seekTarget : undefined}
        onProgress={(curr, dur) => { 
            usePlayerStore.setState({ currentTime: curr, duration: dur });
            if (isLoading && dur > 0) usePlayerStore.setState({ isLoading: false });
        }} 
        onEnded={next} 
        onError={next}
      />



      {/* Removed Universal Top Player Bar - iOS Dynamic Island Replaces It */}

      {/* Main Body Layout */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 h-full flex-shrink-0 z-20">
           <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="flex-1 flex flex-col relative min-w-0">
          
          {/* Global Dynamic Island Player */}
          <AnimatePresence>
            {currentTrack && !isPlayerExpanded && (
                <DynamicIsland 
                    track={currentTrack} 
                    isPlaying={isPlaying} 
                    onClick={() => setPlayerExpanded(true)} 
                    onTogglePlay={(e) => { e.stopPropagation(); togglePlay(); }}
                    onPartyClick={(e) => { e.stopPropagation(); setPartyRoomOpen(true); }}
                    isPartyActive={!!activeParty}
                />
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="flex-1 relative z-0 h-full overflow-hidden bg-black">
            {currentView.type === 'tab' ? (
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full w-full">
                        {activeTab === 'listen-now' && <ListenNow />}
                        {activeTab === 'browse' && <Browse />}
                        {activeTab === 'radio' && <Connect />}
                        {activeTab === 'library' && <LibraryTab />}
                        {activeTab === 'search' && <Search />}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <AnimatePresence mode="wait">
                   {currentView.type === 'artist' && currentView.id ? (
                        <motion.div key="artist" className="h-full" initial={{opacity:0}} animate={{opacity:1}}>
                            <ArtistDetail artistId={currentView.id} onBack={() => setView({type: 'tab'})} />
                        </motion.div>
                    ) : currentView.type === 'album' && currentView.id ? (
                        <motion.div key="album" className="h-full" initial={{opacity:0}} animate={{opacity:1}}>
                            <AlbumDetail albumId={currentView.id} onBack={() => setView({type: 'tab'})} />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Mini Player */}
      {!isPlayerExpanded && !activeParty && (
        <div className="md:hidden">
          <MiniPlayer />
        </div>
      )}

      {/* Full Screen Player */}
      <AnimatePresence>
        {isPlayerExpanded && !activeParty && (
          <FullScreenPlayer />
        )}
      </AnimatePresence>

      {/* Party Room Modal */}
      <AnimatePresence>
        {isPartyRoomOpen && activeParty && (
            <PartyRoom 
                session={activeParty} 
                track={currentTrack} 
                isPlaying={isPlaying} 
                currentTime={currentTime} 
                duration={duration} 
                isHost={isHost} 
                onClose={() => { setPartyRoomOpen(false); leaveParty(); }} 
                onTogglePlay={togglePlay} 
                onSeek={seek} 
                onSendMessage={(text) => {
                    if (user) {
                        const msg: ChatMessage = { 
                            id: Date.now().toString(), 
                            user: { 
                                id: user.id, 
                                name: user.user_metadata?.full_name || 'Me', 
                                avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                            }, 
                            text, 
                            timestamp: Date.now() 
                        };
                        // Optimistic update for host/sender
                        usePlayerStore.setState(state => ({
                            activeParty: state.activeParty ? {
                                ...state.activeParty,
                                messages: [...state.activeParty.messages, msg]
                            } : null
                        }));
                        // Broadcast to other listeners & persist to DB
                        partyService.broadcastMessage(msg);
                        if (activeParty) {
                            partyService.saveMessage(activeParty.id, { user: msg.user, text: msg.text });
                        }
                    }
                }} 
            />
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <nav className="md:hidden h-[84px] bg-[#1C1C1E]/85 backdrop-blur-xl border-t border-white/10 flex items-start justify-between px-6 pt-2 z-40 fixed bottom-0 left-0 right-0 pb-safe">
        <TabButton active={activeTab === 'listen-now'} onClick={() => handleTabChange('listen-now')} icon={<PlayCircle size={26} />} label="Listen Now" />
        <TabButton active={activeTab === 'browse'} onClick={() => handleTabChange('browse')} icon={<LayoutGrid size={26} />} label="Browse" />
        <TabButton active={activeTab === 'radio'} onClick={() => handleTabChange('radio')} icon={<Users size={26} />} label="Connect" />
        <TabButton active={activeTab === 'library'} onClick={() => handleTabChange('library')} icon={<Library size={26} />} label="Library" />
        <TabButton active={activeTab === 'search'} onClick={() => handleTabChange('search')} icon={<SearchIcon size={26} />} label="Search" />
      </nav>
      {/* Global Loader Overlay — suppressed during party mode to prevent flashing */}
      <AnimatePresence>
        {isLoading && !activeParty && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex flex-col items-center justify-center pointer-events-none"
            >
                <div className="w-10 h-10 border-4 border-white/20 border-t-[#FA233B] rounded-full animate-spin mb-4" />
                <span className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">Syncing State</span>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
;

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={() => { onClick(); triggerHaptic('light'); }} className={`flex flex-col items-center justify-center space-y-[4px] w-16 transition-colors ${active ? 'text-[#FA233B]' : 'text-[#9ca3af]'}`}>
    <div className="mb-0.5">{icon}</div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
