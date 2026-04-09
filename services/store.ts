
import { create } from 'zustand';
import { Track, Tab, PartySession, User } from '../types';
import { musicApi } from './api';
import { AudioSource } from '../types';
import { MOCK_TRACKS } from '../constants';

// --- AUDIO CONTROLLER (Singleton) ---
const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "auto";

// Web Audio API State
let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;

const initAudioContext = () => {
    if (!audioCtx && typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        // Check if available
        if (AudioContext) {
            audioCtx = new AudioContext();
            gainNode = audioCtx.createGain();
            const source = audioCtx.createMediaElementSource(audio);
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
        }
    }
};

const SILENT_AUDIO_URI = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTRVAAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq//OEAAABAAAAAgAAAysAAAEAAAKjAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEABAAAAABIAAAACAAAgAAAAALKAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

interface PlayerState {
  // Playback State
  isPlaying: boolean;
  currentTrack: Track;
  queue: Track[];
  queueIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  
  // Advanced Audio
  activeYoutubeId: string | null;
  seekTarget: number | null;
  
  // Social/Party
  isHost: boolean;
  activeParty: PartySession | null;
  
  // Actions
  playTrack: (track: Track, context?: Track[]) => Promise<void>;
  togglePlay: () => void;
  seek: (time: number) => void;
  next: () => void;
  prev: () => void;
  setVolume: (val: number) => void;
  setQueueIndex: (idx: number) => void;
  startParty: (user: User) => void;
  joinParty: (session: PartySession) => void;
  leaveParty: () => void;
}


interface UIState {
  activeTab: Tab;
  isPlayerExpanded: boolean;
  currentView: { type: 'tab' | 'artist' | 'album', id?: string };
  isPartyRoomOpen: boolean;
  activeParty: PartySession | null;
  
  // Actions
  setActiveTab: (tab: Tab) => void;
  setPlayerExpanded: (expanded: boolean) => void;
  setView: (view: { type: 'tab' | 'artist' | 'album', id?: string }) => void;
  setPartyRoomOpen: (open: boolean) => void;
  setActiveParty: (session: PartySession | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    activeTab: 'listen-now',
    isPlayerExpanded: false,
    currentView: { type: 'tab' },
    isPartyRoomOpen: false,
    activeParty: null,

    setActiveTab: (tab) => set({ activeTab: tab, currentView: { type: 'tab' } }),
    setPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
    setView: (view) => set({ currentView: view }),
    setPartyRoomOpen: (open) => set({ isPartyRoomOpen: open }),
    setActiveParty: (session) => set({ activeParty: session })
}));

export const usePlayerStore = create<PlayerState>((set, get) => {
    
    // Setup Audio Event Listeners once
    audio.ontimeupdate = () => {
        const { activeYoutubeId } = get();
        if (!activeYoutubeId) {
            set({ currentTime: audio.currentTime, duration: audio.duration || 0 });
        }
    };
    
    audio.onended = () => {
       const { next } = get();
       next();
    };

    return {
        isPlaying: false,
        currentTrack: MOCK_TRACKS[0],
        queue: MOCK_TRACKS,
        queueIndex: 0,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        isLoading: false,
        activeYoutubeId: null,
        seekTarget: null,
        isHost: false,
        activeParty: null,

        playTrack: async (track: Track, context?: Track[]) => {
            const state = get();
            
            // If we are a follower in a party, we usually don't initiate playback 
            // unless the UI allows "requesting" or the host is us.
            // For now, if in a party and NOT host, we ignore manual play attempts from search?
            // Actually, let's allow it but it will "break" the sync until the host plays something else.
            // Better: If in party and NOT host, we leave current party to play our own thing.
            if (state.activeParty && !state.isHost) {
                get().leaveParty();
            }

            // 1. Party Mode Check
            // If we are host, we will broadcast via the effects later
            // If we are follower, we've already handled leaving above


            // 2. Queue Management
            let newQueue = state.queue;
            let newIndex = state.queueIndex;

            if (context) {
                newQueue = context;
                newIndex = context.findIndex(t => t.id === track.id);
            } else {
                 // Add to queue if not present or just play
                 const idx = state.queue.findIndex(t => t.id === track.id);
                 if (idx !== -1) {
                     newIndex = idx;
                 } else {
                     newQueue = [...state.queue];
                     newQueue.splice(state.queueIndex + 1, 0, track);
                     newIndex = state.queueIndex + 1;
                 }
            }

            set({ 
                currentTrack: track, 
                queue: newQueue, 
                queueIndex: newIndex, 
                isPlaying: false, 
                isLoading: true,
                currentTime: 0,
                duration: 0
            });
            
            // 3. Audio Source Resolution
            try {
                // Reset Audio
                audio.pause();
                audio.src = SILENT_AUDIO_URI; // Reset src
                
                // Get Source
                let source = await musicApi.getAudioSource(track);
                
                // Fallback / Robustness Check
                if (!source) {
                    const ytId = await musicApi.findYoutubeVideoId(track);
                    if (ytId) source = { type: 'youtube', value: ytId };
                }

                if (!source) throw new Error("No source found");

                if (source.type === 'direct') {
                    set({ activeYoutubeId: null });
                    audio.src = source.value;
                    
                    initAudioContext();
                    audioCtx?.resume();

                    if (gainNode && audioCtx) {
                        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(state.volume, audioCtx.currentTime + 0.2); // 200ms fade in
                    } else {
                        audio.volume = state.volume;
                    }

                    await audio.play();
                    set({ isPlaying: true, isLoading: false });
                } else {
                    set({ activeYoutubeId: source.value, isPlaying: true, isLoading: false });
                    // audio element stays silent/paused for YouTube player to take over
                }

                // Setup Media Session API
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: track.title,
                        artist: track.artist.name,
                        album: track.album?.title,
                        artwork: [{ src: track.album?.coverUrl || '', sizes: '512x512', type: 'image/jpeg' }]
                    });
                    
                    navigator.mediaSession.setActionHandler('play', () => get().togglePlay());
                    navigator.mediaSession.setActionHandler('pause', () => get().togglePlay());
                    navigator.mediaSession.setActionHandler('previoustrack', () => get().prev());
                    navigator.mediaSession.setActionHandler('nexttrack', () => get().next());
                    navigator.mediaSession.setActionHandler('seekto', (details) => {
                        if (details.seekTime !== undefined) get().seek(details.seekTime);
                    });
                }

                // Prefetch Next Track for smooth and instant skipping
                const { queue, queueIndex } = get();
                if (queueIndex + 1 < queue.length) {
                    musicApi.getAudioSource(queue[queueIndex + 1]).catch(() => {});
                }
            } catch (e) {
                console.error('Playback error:', e);
                set({ isLoading: false });
                // Auto-skip to next track on error after a brief delay
                setTimeout(() => {
                    const { queue, queueIndex } = get();
                    if (queueIndex + 1 < queue.length) {
                        get().playTrack(queue[queueIndex + 1]);
                    }
                }, 1000);
            }
        },

        togglePlay: () => {
            const { isPlaying, activeYoutubeId, isHost, activeParty, currentTrack, currentTime } = get();

            const newPlaying = !isPlaying;
            
            if (isHost && activeParty) {
                import('./supabase').then(({ partyService }) => {
                    partyService.broadcastState({
                        isPlaying: newPlaying,
                        currentTrack,
                        currentTime,
                        lastUpdated: Date.now()
                    });
                });
            }

            if (isPlaying) {
                if (!activeYoutubeId) {
                    if (gainNode && audioCtx) {
                        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2); // 200ms fade out
                        setTimeout(() => audio.pause(), 200);
                    } else {
                        audio.pause();
                    }
                }
                set({ isPlaying: false });
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            } else {
                if (!activeYoutubeId) {
                    audioCtx?.resume();
                    if (gainNode && audioCtx) {
                        const { volume } = get();
                        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.2); // 200ms fade in
                    }
                    audio.play();
                }
                set({ isPlaying: true });
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            }
        },

        seek: (time: number) => {
            const { activeYoutubeId, isHost, activeParty, currentTrack, isPlaying } = get();
            set({ currentTime: time, seekTarget: time });
            if (!activeYoutubeId) {
                audio.currentTime = time;
            }

            if (isHost && activeParty) {
                import('./supabase').then(({ partyService }) => {
                    partyService.broadcastState({
                        isPlaying,
                        currentTrack,
                        currentTime: time,
                        lastUpdated: Date.now()
                    });
                });
            }

            // For YouTube, the seekTarget is passed to the component
            // Clear seekTarget after a frame so it doesn't re-trigger
            setTimeout(() => set({ seekTarget: null }), 100);
        },

        next: () => {
            const { queue, queueIndex, playTrack } = get();
            const nextIndex = queueIndex + 1;
            if (nextIndex < queue.length) {
                set({ queueIndex: nextIndex });
                playTrack(queue[nextIndex], queue);
            } else {
                // End of queue — stop playing
                set({ isPlaying: false });
            }
        },

        prev: () => {
            const { queue, queueIndex, playTrack, currentTime } = get();
            if (currentTime > 3) {
                get().seek(0);
            } else if (queueIndex > 0) {
                set({ queueIndex: queueIndex - 1 });
                playTrack(queue[queueIndex - 1], queue);
            }
        },

        setVolume: (val: number) => {
            audio.volume = val;
            set({ volume: val });
        },
        
        setQueueIndex: (idx: number) => set({ queueIndex: idx }),

        startParty: (user) => {
            const partyId = user.id;
            const session: PartySession = {
                id: partyId,
                hostId: user.id,
                hostName: user.name,
                listeners: [user],
                messages: []
            };

            set({ isHost: true, activeParty: session });
            
            import('./supabase').then(async ({ partyService }) => {
                const dbRecord = await partyService.createParty(user); // Persist to DB
                
                // Update session with the generated party code
                if (dbRecord?.code) {
                    set(state => ({
                        activeParty: state.activeParty ? { ...state.activeParty, code: dbRecord.code } : null
                    }));
                }
                
                partyService.subscribe(
                    partyId,
                    user,
                    () => {}, // Host doesn't need to sync to themselves
                    (msg) => {
                        const { activeParty } = get();
                        if (activeParty) {
                            set({ activeParty: { ...activeParty, messages: [...activeParty.messages, msg] } });
                        }
                    },
                    (listeners) => {
                        const { activeParty } = get();
                        if (activeParty) {
                            set({ activeParty: { ...activeParty, listeners } });
                        }
                    }
                );
            });

        },


        joinParty: (session) => {
            // Don't set isLoading — it triggers the global overlay which blocks PartyRoom
            set({ isHost: false, activeParty: session, isPlaying: false });

            import('./supabase').then(async ({ partyService, authService }) => {
                // Resolve the real user identity
                let joinerUser = { id: 'usr_' + Math.random().toString(36).substring(2, 9), name: 'Guest', avatar: '' };
                try {
                    const authUser = await authService.getUser();
                    if (authUser) {
                        joinerUser = {
                            id: authUser.id,
                            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Guest',
                            avatar: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`
                        };
                    }
                } catch {}

                // Load existing messages from DB
                const existingMessages = await partyService.getPartyMessages(session.id);
                if (existingMessages.length > 0) {
                    set(state => ({
                        activeParty: state.activeParty ? {
                            ...state.activeParty,
                            messages: [...existingMessages, ...state.activeParty.messages]
                        } : null
                    }));
                }

                // Fetch initial party state from DB and start playback
                const dbState = await partyService.getPartyState(session.id);
                let initialSyncDone = false;

                if (dbState && dbState.currentTrack) {
                    // Play the track — this resolves audio source + starts playback
                    await get().playTrack(dbState.currentTrack);
                    
                    // Now that playTrack has resolved, do the precise seek
                    const elapsed = (Date.now() - (dbState.lastUpdated || Date.now())) / 1000;
                    const targetTime = dbState.currentTime + (dbState.isPlaying ? elapsed : 0);
                    if (targetTime > 1) {
                        get().seek(targetTime);
                    }
                    // Match play/pause state absolutely (not via toggle)
                    if (!dbState.isPlaying && get().isPlaying) {
                        audio.pause();
                        set({ isPlaying: false });
                    }
                    
                    initialSyncDone = true;
                }

                // Subscribe to realtime updates
                partyService.subscribe(
                    session.id,
                    joinerUser,
                    (state) => {
                        // Skip realtime sync for the first 3 seconds to let initial sync settle
                        if (!initialSyncDone) return;
                        
                        const local = get();
                        
                        // Sync track if host changes song
                        if (state.currentTrack && (!local.currentTrack || state.currentTrack.id !== local.currentTrack.id)) {
                            get().playTrack(state.currentTrack);
                        } else {
                            // Same track — drift check with a generous 3-second threshold
                            // to avoid constant micro-seeking that causes stutter
                            const now = Date.now();
                            const messageAge = (now - (state.lastUpdated || now)) / 1000;
                            const targetTime = state.currentTime + (state.isPlaying ? messageAge : 0);
                            
                            if (Math.abs(local.currentTime - targetTime) > 3) {
                                get().seek(targetTime);
                            }
                            
                            // Set play/pause state absolutely — never use togglePlay for sync
                            if (state.isPlaying && !local.isPlaying) {
                                audio.play().catch(() => {});
                                set({ isPlaying: true });
                            } else if (!state.isPlaying && local.isPlaying) {
                                audio.pause();
                                set({ isPlaying: false });
                            }
                        }
                    },
                    (msg) => {
                        const { activeParty } = get();
                        if (activeParty) {
                            set({ activeParty: { ...activeParty, messages: [...activeParty.messages, msg] } });
                        }
                    },
                    (listeners) => {
                        const { activeParty } = get();
                        if (activeParty) {
                            set({ activeParty: { ...activeParty, listeners } });
                        }
                    }
                );

                // Mark initial sync as done after a brief settling period
                setTimeout(() => { initialSyncDone = true; }, 3000);
            });
        },

        leaveParty: () => {
            const { isHost, activeParty } = get();
            import('./supabase').then(({ partyService }) => {
                partyService.leave(isHost ? activeParty?.id : undefined);
            });
            set({ isHost: false, activeParty: null });
        }
    };
});
