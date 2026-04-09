
import { Track, TrackType, Playlist, Album } from './types';

// Helper to generate fake lyrics
const generateLyrics = (duration: number): {time: number, text: string}[] => {
  const lines = [
    "Lost in the echo of the night",
    "Shadows dancing in the light",
    "Can you hear the rhythm calling?",
    "Every moment, we are falling",
    "Into the deep, into the blue",
    "Searching for a sign of you",
    "(Instrumental Break)",
    "Time stands still when you are near",
    "Fading away, the doubt and fear",
    "Let the music take control",
    "Resonating in your soul"
  ];
  return lines.map((text, index) => ({
    time: (index * (duration / lines.length)),
    text
  }));
};

// Using high-speed sample assets from Google Cloud Storage
export const MOCK_TRACKS: Track[] = [
  {
    id: 't1',
    title: 'Midnight City',
    artist: { id: 'a1', name: 'M83' },
    album: {
      id: 'al1',
      title: 'Hurry Up, We\'re Dreaming',
      artist: { id: 'a1', name: 'M83' },
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&h=800&fit=crop',
      motionCoverUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      colors: {
        primary: '#FF4D4D',
        secondary: '#1A1A2E',
        tertiary: '#9D4EDD',
        background: '#0F0F1A'
      }
    },
    duration: 243,
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
    type: TrackType.SONG,
    lyrics: generateLyrics(243)
  },
  {
    id: 't2',
    title: 'Classical Bliss',
    workTitle: 'Symphony No. 9',
    movementTitle: 'IV. Presto',
    artist: { id: 'a2', name: 'Berlin Philharmonic' },
    album: {
      id: 'al2',
      title: 'Beethoven: The Symphonies',
      artist: { id: 'a2', name: 'Berlin Philharmonic' },
      coverUrl: 'https://images.unsplash.com/photo-1507838596018-ac9468b17919?w=800&h=800&fit=crop',
      isClassical: true,
      colors: {
        primary: '#DAA520',
        secondary: '#2C3E50',
        tertiary: '#BDC3C7',
        background: '#1a1a1a'
      }
    },
    duration: 320,
    url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Erica-Douglass/Instrumental.mp3',
    type: TrackType.WORK_MOVEMENT,
    lyrics: [
      { time: 10, text: "O Freunde, nicht diese Töne!" },
      { time: 20, text: "Sondern laßt uns angenehmere" },
      { time: 30, text: "anstimmen und freudenvollere." }
    ]
  },
  {
    id: 't3',
    title: 'Blinding Lights',
    artist: { id: 'a3', name: 'The Weeknd' },
    album: {
      id: 'al3',
      title: 'After Hours',
      artist: { id: 'a3', name: 'The Weeknd' },
      coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&h=800&fit=crop',
      colors: {
        primary: '#E50914',
        secondary: '#000000',
        tertiary: '#FFFFFF',
        background: '#121212'
      }
    },
    duration: 200,
    url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__Gliese_710.mp3',
    type: TrackType.SONG,
    lyrics: generateLyrics(200)
  }
];

export const TOP_PICKS: Playlist[] = [
  {
    id: 'p1',
    title: 'Chill Mix',
    description: 'Mellow tunes for the evening.',
    coverUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=600&h=600&fit=crop',
    tracks: [MOCK_TRACKS[0], MOCK_TRACKS[2]]
  },
  {
    id: 'p2',
    title: 'Classical Essentials',
    description: 'The best of the best.',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=600&fit=crop',
    tracks: [MOCK_TRACKS[1]]
  },
  {
    id: 'p3',
    title: 'New Releases',
    description: 'Fresh out of the oven.',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop',
    tracks: [MOCK_TRACKS[2], MOCK_TRACKS[0]]
  }
];

export const HEAVY_ROTATION: Album[] = [
  MOCK_TRACKS[0].album,
  MOCK_TRACKS[1].album,
  MOCK_TRACKS[2].album,
];
