
export enum TrackType {
  SONG = 'SONG',
  WORK_MOVEMENT = 'WORK_MOVEMENT', 
}

export interface Colors {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface Artist {
  id: string;
  name: string;
  image?: string;
  followers?: number;
}

export interface AudioSource {
  type: 'direct' | 'youtube';
  value: string;
}

export interface Album {
  id: string;
  title: string;
  artist: Artist;
  coverUrl: string;
  motionCoverUrl?: string;
  colors: Colors;
  isClassical?: boolean;
  releaseDate?: string;
  trackCount?: number;
  description?: string;
  tracks?: Track[];
}

export interface Track {
  id: string;
  title: string;
  artist: Artist;
  album: Album;
  duration: number;
  url: string; // Keep for fallback/mock
  youtubeId?: string; // New: For Hybrid Playback
  type: TrackType;
  workTitle?: string;
  movementTitle?: string;
  lyrics?: LyricLine[];
  isLive?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  type?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
}

// Social Types
export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: string;
}

export interface Island {
  id: string;
  host: User;
  currentTrack: Track;
  listeners: User[];
  isActive: boolean;
}

export interface Post {
  id: string;
  user: User;
  type: 'crate' | 'drift' | 'echo';
  timestamp: string;
  content: any;
}

export interface ChatMessage {
  id: string;
  user: User;
  text: string;
  timestamp: number;
}

export interface PartyState {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  lastUpdated: number;
}

export interface PartySession {
  id: string;
  hostId: string;
  hostName: string;
  code?: string;
  listeners: User[];
  messages: ChatMessage[];
}

// Settings
export type EQMode = 'Balanced' | 'Bass Boost' | 'Vocal' | 'Electronic';

export interface AppSettings {
  highQuality: boolean;
  lossless: boolean;
  spatialAudio: boolean;
  crossfade: number;
  eqMode: EQMode;
  sleepTimer: number; // minutes, 0 = off
}

// Apple Music exact tab structure
export type Tab = 'listen-now' | 'browse' | 'radio' | 'library' | 'search';
