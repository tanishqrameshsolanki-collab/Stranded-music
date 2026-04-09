
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Track, TrackType, User, PartyState } from '../types';

// -----------------------------------------------------------------------------
// SUPABASE CONFIGURATION
// Hardcoded for browser environment where process.env might not be available
// -----------------------------------------------------------------------------
const SUPABASE_URL = 'https://cnwogptcgauvyeptnmxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNud29ncHRjZ2F1dnllcHRubXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjU4NjEsImV4cCI6MjA4MTQ0MTg2MX0.5mIS8dJ3i_Gus-fJh9g9XD-_eOxSflSt3AEekPJGm3U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const sanitizeColors = (colors: any) => ({
  primary: String(colors?.primary || '#000'),
  secondary: String(colors?.secondary || '#000'),
  tertiary: String(colors?.tertiary || '#000'),
  background: String(colors?.background || '#000'),
});

const sanitizeArtist = (artist: any) => ({
  id: String(artist?.id || ''),
  name: String(artist?.name || 'Unknown Artist'),
  image: artist?.image ? String(artist.image) : undefined
});

const sanitizeAlbum = (album: any) => ({
  id: String(album?.id || ''),
  title: String(album?.title || ''),
  artist: sanitizeArtist(album?.artist),
  coverUrl: String(album?.coverUrl || ''),
  motionCoverUrl: album?.motionCoverUrl ? String(album.motionCoverUrl) : undefined,
  colors: sanitizeColors(album?.colors),
  isClassical: Boolean(album?.isClassical)
});

const sanitizeLyrics = (lyrics: any[]) => {
  if (!Array.isArray(lyrics)) return undefined;
  return lyrics.map(l => ({
    time: Number(l.time || 0),
    text: String(l.text || '')
  }));
};

const sanitizeTrack = (track: Track) => {
  // Deep clone and explicit type casting to prevent circular references (DOM nodes, Events)
  return {
    id: String(track.id),
    title: String(track.title),
    artist: sanitizeArtist(track.artist),
    album: sanitizeAlbum(track.album),
    duration: Number(track.duration || 0),
    url: String(track.url || ''),
    youtubeId: track.youtubeId ? String(track.youtubeId) : undefined,
    type: track.type || TrackType.SONG,
    lyrics: sanitizeLyrics(track.lyrics as any),
    isLive: Boolean(track.isLive)
  };
};

export const libraryService = {
  // Save a track to the library
  saveTrack: async (track: Track) => {
    try {
      const cleanTrack = sanitizeTrack(track);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not logged in");

      const { data, error } = await supabase
        .from('saved_tracks')
        .insert([
          { 
            user_id: user.id, // Ensure RLS policies use this
            track_id: cleanTrack.id, 
            track_data: cleanTrack 
          }
        ])
        .select();
      
      if (error) {
        console.error('Error saving track:', error.message);
        return null; 
      }
      return data;
    } catch (err) {
      console.error("Sanitization or Save Error:", err);
      return null;
    }
  },

  // Remove a track from the library
  removeTrack: async (trackId: string) => {
    try {
      const { error } = await supabase
        .from('saved_tracks')
        .delete()
        .eq('track_id', String(trackId));
      
      if (error) {
        console.error('Error removing track:', error.message);
      }
    } catch (e) {
      console.error('Network Error removing track', e);
    }
  },

  // Check if a track is in the library
  checkIsSaved: async (trackId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('saved_tracks')
        .select('id')
        .eq('track_id', String(trackId));
      
      if (error) return false;
      return data && data.length > 0;
    } catch (e) {
      return false;
    }
  },

  // Get all saved tracks
  getSavedTracks: async (): Promise<Track[]> => {
    try {
        const { data, error } = await supabase
          .from('saved_tracks')
          .select('track_data')
          .order('created_at', { ascending: false });

        if (error) {
          // console.error('Error fetching library:', error.message);
          return [];
        }
        
        return (data || [])
          .map((row: any) => row.track_data)
          .filter((track: any) => track && track.album) as Track[];
    } catch (e) {
        // Return empty array on network failure instead of throwing
        return [];
    }
  }
};

// --- REALTIME PARTY SERVICE ---
let partyChannel: RealtimeChannel | null = null;
let lastBroadcastTime = 0;

export const partyService = {
    subscribe: (partyId: string, user: User, onStateChange: (state: PartyState) => void, onMessage: (msg: any) => void, onPresence: (listeners: any[]) => void) => {
        try {
            if (partyChannel) supabase.removeChannel(partyChannel);

            partyChannel = supabase.channel(`party:${partyId}`, {
                config: {
                    broadcast: { self: false },
                    presence: { key: user.id }
                }
            });

            partyChannel
                .on('broadcast', { event: 'sync_state' }, (payload) => {
                    onStateChange(payload.payload as PartyState);
                })
                .on('broadcast', { event: 'chat_message' }, (payload) => {
                    onMessage(payload.payload);
                })
                .on('presence', { event: 'sync' }, () => {
                    const state = partyChannel!.presenceState();
                    const listeners = Object.values(state).flat().map((p: any) => p.user);
                    onPresence(listeners);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await partyChannel!.track({ user });
                    }
                });

            return partyChannel;
        } catch (e) {
            console.warn("Realtime subscription failed", e);
            return null;
        }
    },

    broadcastState: async (state: PartyState) => {
        if (!partyChannel) return;
        // Rate-limit: at most once per second
        const now = Date.now();
        if (now - lastBroadcastTime < 1000) return;
        lastBroadcastTime = now;

        await partyChannel.send({
            type: 'broadcast',
            event: 'sync_state',
            payload: { ...state, lastUpdated: Date.now() }
        });
    },

    broadcastMessage: async (msg: any) => {
        if (!partyChannel) return;
        await partyChannel.send({
            type: 'broadcast',
            event: 'chat_message',
            payload: msg
        });
    },

    // --- Chat Message Persistence ---
    saveMessage: async (partyId: string, msg: { user: User; text: string }) => {
        const { error } = await supabase
            .from('party_messages')
            .insert({
                party_id: partyId,
                user_id: msg.user.id,
                user_name: msg.user.name,
                user_avatar: msg.user.avatar,
                message: msg.text
            });
        if (error) console.warn('Failed to save message:', error.message);
    },

    getPartyMessages: async (partyId: string) => {
        const { data, error } = await supabase
            .from('party_messages')
            .select('*')
            .eq('party_id', partyId)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.warn('Failed to load messages:', error.message);
            return [];
        }
        return (data || []).map((row: any) => ({
            id: row.id,
            user: { id: row.user_id, name: row.user_name, avatar: row.user_avatar || '' },
            text: row.message,
            timestamp: new Date(row.created_at).getTime()
        }));
    },

    // --- Database Persistence ---
    createParty: async (user: User) => {
        // Generate a short 6-character alphanumeric party code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { data, error } = await supabase
            .from('parties')
            .upsert({
                id: user.id as any,
                host_id: user.id,
                host_name: user.name,
                code: code,
                is_playing: false,
                playback_time: 0,
                last_updated: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error('Error creating party record:', error.message);
            return null;
        }
        return data;
    },

    getPartyByCode: async (code: string) => {
        const { data, error } = await supabase
            .from('parties')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();
        
        if (error || !data) return null;
        return data;
    },

    getActiveParties: async () => {
        const minutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('parties')
            .select('*')
            .gt('last_updated', minutesAgo)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching parties:', error.message);
            return [];
        }
        return data || [];
    },

    getPartyState: async (partyId: string) => {
        const { data, error } = await supabase
            .from('parties')
            .select('*')
            .eq('id', partyId)
            .single();

        if (error || !data) return null;
        return {
            currentTrack: data.current_track as Track | null,
            isPlaying: data.is_playing as boolean,
            currentTime: data.playback_time as number,
            lastUpdated: new Date(data.last_updated).getTime()
        } as PartyState;
    },

    updatePartyStateDB: async (partyId: string, state: PartyState) => {
        const { error } = await supabase
            .from('parties')
            .update({
                current_track: state.currentTrack ? sanitizeTrack(state.currentTrack) : null,
                is_playing: state.isPlaying,
                playback_time: state.currentTime,
                last_updated: new Date().toISOString()
            })
            .eq('id', partyId);
        
        if (error) console.warn('Party state update failed (DB)', error.message);
    },

    deleteParty: async (partyId: string) => {
        const { error } = await supabase
            .from('parties')
            .delete()
            .eq('id', partyId);
        
        if (error) console.error('Error deleting party record:', error.message);
    },

    leave: async (partyId?: string) => {
        if (partyId) {
            partyService.deleteParty(partyId);
        }
        if (partyChannel) {
            await supabase.removeChannel(partyChannel);
            partyChannel = null;
        }
    }
};


export const authService = {
  signInWithGoogle: async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
        });
        if (error) throw error;
        return data;
    } catch (e: any) {
        if (e.message === 'Failed to fetch') {
            throw new Error('Network error: Unable to connect to authentication server.');
        }
        throw e;
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
        });
        if (error) throw error;
        return data;
    } catch (e: any) {
        if (e.message === 'Failed to fetch') {
            throw new Error('Network error: Unable to connect to authentication server.');
        }
        throw e;
    }
  },

  signUpWithEmail: async (email: string, password: string, username: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
            full_name: username,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` // Generate random avatar
            }
        }
        });
        if (error) throw error;
        return data;
    } catch (e: any) {
        if (e.message === 'Failed to fetch') {
            throw new Error('Network error: Unable to connect to authentication server.');
        }
        throw e;
    }
  },
  
  // Safe Mock/Anonymous login that falls back gracefully if backend is not configured
  signInWithGuest: async () => {
     try {
         const { data, error } = await supabase.auth.signInAnonymously();
         // If error exists, or if data is missing, we throw to hit the catch block
         if (error || !data.user) throw new Error(error?.message || "Auth failed");
         return data;
     } catch (e) {
         // Fallback for demo: Return a completely valid-looking mock user session
         console.warn("Supabase anonymous auth disabled/failed. Returning mock session.");
         return { 
             user: { 
                 id: 'guest_mock_id', 
                 email: 'guest@stranded.app', 
                 aud: 'authenticated',
                 role: 'authenticated',
                 app_metadata: { provider: 'email' },
                 created_at: new Date().toISOString(),
                 user_metadata: { 
                     full_name: 'Guest User',
                     avatar_url: 'https://i.pravatar.cc/150?u=guest' 
                 } 
             },
             session: null 
         };
     }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    // No error throw here, just clear state in App
  },

  getUser: async () => {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user;
    } catch (e: any) {
        // Silently fail on network errors during initial load
        return null;
    }
  },
  
  onAuthStateChange: (callback: (user: any) => void) => {
      return supabase.auth.onAuthStateChange((_event, session) => {
          callback(session?.user || null);
      });
  }
};
