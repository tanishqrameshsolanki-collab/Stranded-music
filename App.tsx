
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { PlayCircle, LayoutGrid, Search as SearchIcon, Library, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tab, ChatMessage } from './types';
import { triggerHaptic } from './utils';
import { authService, partyService } from './services/supabase';
import { usePlayerStore, useUIStore } from './services/store';
import { progressStore } from './services/progress';

import MiniPlayer from './components/player/MiniPlayer';
import ListenNow from './components/tabs/ListenNow';
import Browse from './components/tabs/Browse';
import LibraryTab from './components/tabs/Library';
import Search from './components/tabs/Search';
import Connect from './components/tabs/Connect';
import Sidebar from './components/nav/Sidebar';
import ArtistDetail from './components/details/ArtistDetail';
import AlbumDetail from './components/details/AlbumDetail';
import Login from './components/auth/Login';
import DynamicIsland from './components/player/DynamicIsland';

// Only mounted on demand; keeps their heavy visuals out of the initial bundle.
const FullScreenPlayer = lazy(() => import('./components/player/FullScreenPlayer'));
const PartyRoom = lazy(() => import('./components/player/PartyRoom'));

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Narrow subscriptions: App only re-renders for track / play-state / party changes,
  // never for playback position (see services/progress.ts).
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isHost = usePlayerStore(s => s.isHost);
  const activeParty = usePlayerStore(s => s.activeParty);
  const isLoading = usePlayerStore(s => s.isLoading);
  const { togglePlay, next, prev, seek, joinParty, leaveParty } = usePlayerStore.getState();

  const activeTab = useUIStore(s => s.activeTab);
  const isPlayerExpanded = useUIStore(s => s.isPlayerExpanded);
  const currentView = useUIStore(s => s.currentView);
  const isPartyRoomOpen = useUIStore(s => s.isPartyRoomOpen);
  const { setActiveTab, setPlayerExpanded, setView, setPartyRoomOpen } = useUIStore.getState();

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
        const { currentTime, duration } = progressStore.get();
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
  }, [togglePlay, next, prev, seek]);

  // --- Party Logic: URL Joining & Heartbeat ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partyIdValue = params.get('partyId');
    if (partyIdValue && user && !usePlayerStore.getState().activeParty) {
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

      const snapshot = () => {
          const store = usePlayerStore.getState();
          return {
              isPlaying: store.isPlaying,
              currentTrack: store.currentTrack,
              currentTime: progressStore.get().currentTime,
              lastUpdated: Date.now()
          };
      };

      const broadcastInterval = setInterval(() => {
          partyService.broadcastState(snapshot());
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
                  partyService.updatePartyStateDB(store.activeParty.id, snapshot());
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
                    isLoading={isLoading}
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
                <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} transition={{ duration: 0.15 }} className="h-full w-full">
                    {activeTab === 'listen-now' && <ListenNow />}
                    {activeTab === 'browse' && <Browse />}
                    {activeTab === 'radio' && <Connect />}
                    {activeTab === 'library' && <LibraryTab />}
                    {activeTab === 'search' && <Search />}
                </motion.div>
            ) : (
                <>
                   {currentView.type === 'artist' && currentView.id ? (
                        <motion.div key={`artist-${currentView.id}`} className="h-full" initial={{opacity:0}} animate={{opacity:1}} transition={{ duration: 0.15 }}>
                            <ArtistDetail artistId={currentView.id} onBack={() => setView({type: 'tab'})} />
                        </motion.div>
                    ) : currentView.type === 'album' && currentView.id ? (
                        <motion.div key={`album-${currentView.id}`} className="h-full" initial={{opacity:0}} animate={{opacity:1}} transition={{ duration: 0.15 }}>
                            <AlbumDetail albumId={currentView.id} onBack={() => setView({type: 'tab'})} />
                        </motion.div>
                    ) : null}
                </>
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
      <Suspense fallback={null}>
        <AnimatePresence>
          {isPlayerExpanded && !activeParty && (
            <FullScreenPlayer />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Party Room Modal */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {isPartyRoomOpen && activeParty && (
              <PartyRoom
                  session={activeParty}
                  track={currentTrack}
                  isPlaying={isPlaying}
                  isHost={isHost}
                  onClose={() => { setPartyRoomOpen(false); leaveParty(); }}
                  onTogglePlay={togglePlay}
                  onSeek={seek}
                  onSendMessage={(text) => {
                      if (!activeParty) return;
                      const msg: ChatMessage = {
                          id: Math.random().toString(36).substring(2, 9),
                          user: { id: 'me', name: 'You', avatar: '' },
                          text,
                          timestamp: Date.now()
                      };
                      usePlayerStore.setState(state => ({
                          activeParty: state.activeParty ? {
                              ...state.activeParty,
                              messages: [...state.activeParty.messages, msg]
                          } : null
                      }));
                      partyService.broadcastMessage(msg);
                      partyService.saveMessage(activeParty.id, { user: msg.user, text: msg.text });
                  }}
              />
          )}
        </AnimatePresence>
      </Suspense>

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
                className="fixed inset-0 bg-black/40 z-[100] flex flex-col items-center justify-center pointer-events-none"
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

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button onClick={() => { onClick(); triggerHaptic('light'); }} className={`flex flex-col items-center justify-center space-y-[4px] w-16 transition-colors ${active ? 'text-[#FA233B]' : 'text-[#9ca3af]'}`}>
    <div className="mb-0.5">{icon}</div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
