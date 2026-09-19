
import { create } from 'zustand';
import { Track, Tab, PartySession, User } from '../types';
import { musicApi } from './api';
import { MOCK_TRACKS } from '../constants';
import { progressStore } from './progress';
import { youtubeEngine } from './youtube';

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
        if (AudioContext) {
            audioCtx = new AudioContext();
            gainNode = audioCtx.createGain();
            const source = audioCtx.createMediaElementSource(audio);
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
        }
    }
};

const FADE_SECONDS = 0.2;
const fadeGain = (to: number) => {
    if (!gainNode || !audioCtx) return false;
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(to, now + FADE_SECONDS);
    return true;
};

// Incremented on every playTrack so late-resolving async work from a superseded
// track (source lookup, YouTube search, error fallback) is ignored.
let playSession = 0;
let pauseFadeTimer: ReturnType<typeof setTimeout> | null = null;
let errorSkipTimer: ReturnType<typeof setTimeout> | null = null;
let mediaSessionHandlersBound = false;

interface PlayerState {
  // Playback State
  isPlaying: boolean;
  currentTrack: Track;
  queue: Track[];
  queueIndex: number;
  volume: number;
  isLoading: boolean;

  // Advanced Audio
  activeYoutubeId: string | null;

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

  // Actions
  setActiveTab: (tab: Tab) => void;
  setPlayerExpanded: (expanded: boolean) => void;
  setView: (view: { type: 'tab' | 'artist' | 'album', id?: string }) => void;
  setPartyRoomOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    activeTab: 'listen-now',
    isPlayerExpanded: false,
    currentView: { type: 'tab' },
    isPartyRoomOpen: false,

    setActiveTab: (tab) => set({ activeTab: tab, currentView: { type: 'tab' } }),
    setPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
    setView: (view) => set({ currentView: view }),
    setPartyRoomOpen: (open) => set({ isPartyRoomOpen: open }),
}));

export const usePlayerStore = create<PlayerState>((set, get) => {

    // --- Audio element events (direct playback) ---
    audio.ontimeupdate = () => {
        if (!get().activeYoutubeId) {
            progressStore.set(audio.currentTime, audio.duration || 0);
        }
    };
    audio.ondurationchange = () => {
        if (!get().activeYoutubeId) {
            progressStore.set(audio.currentTime, audio.duration || 0);
        }
    };
    audio.onended = () => { get().next(); };
    audio.onerror = () => {
        if (get().activeYoutubeId) return;
        set({ isLoading: false, isPlaying: false });
        scheduleErrorSkip();
    };

    // --- YouTube engine events (hidden iframe playback) ---
    youtubeEngine.setHandlers({
        onProgress: (t, d) => {
            if (!get().activeYoutubeId) return;
            progressStore.set(t, d);
            if (get().isLoading && d > 0) set({ isLoading: false });
        },
        onEnded: () => { if (get().activeYoutubeId) get().next(); },
        onError: () => { if (get().activeYoutubeId) scheduleErrorSkip(); },
        onStateChange: (playing) => {
            if (!get().activeYoutubeId) return;
            if (get().isPlaying !== playing) set({ isPlaying: playing });
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
        }
    });

    const scheduleErrorSkip = () => {
        if (errorSkipTimer) clearTimeout(errorSkipTimer);
        const session = playSession;
        errorSkipTimer = setTimeout(() => {
            errorSkipTimer = null;
            if (session !== playSession) return;
            const { queue, queueIndex } = get();
            if (queueIndex + 1 < queue.length) get().next();
        }, 1000);
    };

    const bindMediaSession = () => {
        if (!('mediaSession' in navigator) || mediaSessionHandlersBound) return;
        mediaSessionHandlersBound = true;
        navigator.mediaSession.setActionHandler('play', () => { if (!get().isPlaying) get().togglePlay(); });
        navigator.mediaSession.setActionHandler('pause', () => { if (get().isPlaying) get().togglePlay(); });
        navigator.mediaSession.setActionHandler('previoustrack', () => get().prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => get().next());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) get().seek(details.seekTime);
        });
    };

    const broadcastIfHost = (patch?: Partial<{ isPlaying: boolean; currentTime: number }>) => {
        const { isHost, activeParty, currentTrack, isPlaying } = get();
        if (!isHost || !activeParty) return;
        import('./supabase').then(({ partyService }) => {
            partyService.broadcastState({
                isPlaying: patch?.isPlaying ?? isPlaying,
                currentTrack,
                currentTime: patch?.currentTime ?? progressStore.get().currentTime,
                lastUpdated: Date.now()
            });
        });
    };

    const attachPartyChannel = (partyId: string, user: User, onStateChange: (state: any) => void) => {
        import('./supabase').then(({ partyService }) => {
            partyService.subscribe(
                partyId,
                user,
                onStateChange,
                (msg) => {
                    const { activeParty } = get();
                    if (activeParty) set({ activeParty: { ...activeParty, messages: [...activeParty.messages, msg] } });
                },
                (listeners) => {
                    const { activeParty } = get();
                    if (activeParty) set({ activeParty: { ...activeParty, listeners } });
                }
            );
        });
    };

    return {
        isPlaying: false,
        currentTrack: MOCK_TRACKS[0],
        queue: MOCK_TRACKS,
        queueIndex: 0,
        volume: 0.8,
        isLoading: false,
        activeYoutubeId: null,
        isHost: false,
        activeParty: null,

        playTrack: async (track: Track, context?: Track[]) => {
            const state = get();
            const session = ++playSession;
            if (pauseFadeTimer) { clearTimeout(pauseFadeTimer); pauseFadeTimer = null; }
            if (errorSkipTimer) { clearTimeout(errorSkipTimer); errorSkipTimer = null; }

            // A follower who picks their own track leaves the party (breaks sync otherwise).
            if (state.activeParty && !state.isHost) {
                get().leaveParty();
            }

            // Queue management
            let newQueue = state.queue;
            let newIndex = state.queueIndex;

            if (context) {
                newQueue = context;
                newIndex = context.findIndex(t => t.id === track.id);
            } else {
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
            });
            progressStore.reset();

            // Stop whatever is currently producing sound before resolving the new source.
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            youtubeEngine.stop();

            try {
                let source = await musicApi.getAudioSource(track);
                if (session !== playSession) return;

                if (!source) {
                    const ytId = await musicApi.findYoutubeVideoId(track);
                    if (session !== playSession) return;
                    if (ytId) source = { type: 'youtube', value: ytId };
                }

                if (!source || !source.value) throw new Error("No source found");

                if (source.type === 'direct') {
                    set({ activeYoutubeId: null });
                    audio.src = source.value;

                    initAudioContext();
                    audioCtx?.resume();

                    if (gainNode && audioCtx) {
                        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(get().volume, audioCtx.currentTime + FADE_SECONDS);
                    } else {
                        audio.volume = get().volume;
                    }

                    await audio.play();
                    if (session !== playSession) return;
                    set({ isPlaying: true, isLoading: false });
                } else {
                    set({ activeYoutubeId: source.value, isPlaying: true });
                    youtubeEngine.load(source.value, { autoplay: true, volume: get().volume });
                }

                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: track.title,
                        artist: track.artist.name,
                        album: track.album?.title,
                        artwork: track.album?.coverUrl ? [{ src: track.album.coverUrl, sizes: '512x512', type: 'image/jpeg' }] : []
                    });
                    navigator.mediaSession.playbackState = 'playing';
                    bindMediaSession();
                }

                // Warm the source cache for the next track so skipping is instant.
                const { queue, queueIndex } = get();
                if (queueIndex + 1 < queue.length) {
                    musicApi.getAudioSource(queue[queueIndex + 1]).catch(() => {});
                }
            } catch (e) {
                if (session !== playSession) return;
                console.error('Playback error:', e);
                set({ isLoading: false, isPlaying: false });
                scheduleErrorSkip();
            }
        },

        togglePlay: () => {
            const { isPlaying, activeYoutubeId } = get();
            const newPlaying = !isPlaying;
            broadcastIfHost({ isPlaying: newPlaying });

            if (pauseFadeTimer) { clearTimeout(pauseFadeTimer); pauseFadeTimer = null; }

            if (isPlaying) {
                if (activeYoutubeId) {
                    youtubeEngine.pause();
                } else if (fadeGain(0)) {
                    pauseFadeTimer = setTimeout(() => { pauseFadeTimer = null; audio.pause(); }, FADE_SECONDS * 1000);
                } else {
                    audio.pause();
                }
                set({ isPlaying: false });
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            } else {
                if (activeYoutubeId) {
                    youtubeEngine.play();
                } else {
                    audioCtx?.resume();
                    if (gainNode && audioCtx) {
                        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(get().volume, audioCtx.currentTime + FADE_SECONDS);
                    }
                    audio.play().catch(() => {});
                }
                set({ isPlaying: true });
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            }
        },

        seek: (time: number) => {
            const { activeYoutubeId } = get();
            progressStore.set(time, progressStore.get().duration);
            if (activeYoutubeId) {
                youtubeEngine.seek(time);
            } else {
                audio.currentTime = time;
            }
            broadcastIfHost({ currentTime: time });
        },

        next: () => {
            const { queue, queueIndex, playTrack } = get();
            const nextIndex = queueIndex + 1;
            if (nextIndex < queue.length) {
                playTrack(queue[nextIndex], queue);
            } else {
                // End of queue — stop playing
                audio.pause();
                youtubeEngine.pause();
                set({ isPlaying: false });
            }
        },

        prev: () => {
            const { queue, queueIndex, playTrack } = get();
            if (progressStore.get().currentTime > 3) {
                get().seek(0);
            } else if (queueIndex > 0) {
                playTrack(queue[queueIndex - 1], queue);
            }
        },

        setVolume: (val: number) => {
            if (gainNode && audioCtx) {
                gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                gainNode.gain.setValueAtTime(val, audioCtx.currentTime);
            } else {
                audio.volume = val;
            }
            youtubeEngine.setVolume(val);
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
                const dbRecord = await partyService.createParty(user);
                if (dbRecord?.code) {
                    set(state => ({
                        activeParty: state.activeParty ? { ...state.activeParty, code: dbRecord.code } : null
                    }));
                }
                attachPartyChannel(partyId, user, () => {}); // Host doesn't sync to itself
            });
        },


        joinParty: (session) => {
            // Don't set isLoading — it triggers the global overlay which blocks PartyRoom
            set({ isHost: false, activeParty: session, isPlaying: false });

            import('./supabase').then(async ({ partyService, authService }) => {
                let joinerUser: User = { id: 'usr_' + Math.random().toString(36).substring(2, 9), name: 'Guest', avatar: '' };
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

                if (get().activeParty?.id !== session.id) return; // left before setup finished

                const [existingMessages, dbState] = await Promise.all([
                    partyService.getPartyMessages(session.id),
                    partyService.getPartyState(session.id)
                ]);
                if (get().activeParty?.id !== session.id) return;

                if (existingMessages.length > 0) {
                    set(state => ({
                        activeParty: state.activeParty ? {
                            ...state.activeParty,
                            messages: [...existingMessages, ...state.activeParty.messages]
                        } : null
                    }));
                }

                let initialSyncDone = false;

                if (dbState && dbState.currentTrack) {
                    await get().playTrack(dbState.currentTrack);
                    if (get().activeParty?.id !== session.id) return;

                    const elapsed = (Date.now() - (dbState.lastUpdated || Date.now())) / 1000;
                    const targetTime = dbState.currentTime + (dbState.isPlaying ? elapsed : 0);
                    if (targetTime > 1) get().seek(targetTime);
                    if (!dbState.isPlaying && get().isPlaying) get().togglePlay();

                    initialSyncDone = true;
                }

                attachPartyChannel(session.id, joinerUser, (state) => {
                    // Skip realtime sync briefly so the initial sync can settle
                    if (!initialSyncDone) return;
                    const local = get();

                    if (state.currentTrack && (!local.currentTrack || state.currentTrack.id !== local.currentTrack.id)) {
                        get().playTrack(state.currentTrack);
                        return;
                    }

                    // Same track — generous drift threshold avoids micro-seek stutter
                    const now = Date.now();
                    const messageAge = (now - (state.lastUpdated || now)) / 1000;
                    const targetTime = state.currentTime + (state.isPlaying ? messageAge : 0);
                    if (Math.abs(progressStore.get().currentTime - targetTime) > 3) {
                        get().seek(targetTime);
                    }
                    if (state.isPlaying !== local.isPlaying) get().togglePlay();
                });

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
