
import { Track, Artist, Album, Playlist, SearchResults, TrackType, Category, AudioSource } from '../types';
import { MOCK_TRACKS } from '../constants';

// API calls are same-origin: in dev they hit the local Express server,
// in production they hit Vercel Serverless Functions at /api/*
const API_BASE_URL = '';
const ITUNES_BASE_URL = 'https://itunes.apple.com';

const fetchItunes = async (url: string) => {
    try {
        const proxyUrl = `/api/itunes?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Proxy response was not ok');
        return await res.json();
    } catch (proxyError) {
        console.error('iTunes Proxy Error:', proxyError);
        // Fallback to direct fetch if proxy fails (might hit CORS but worth a shot)
        const res = await fetch(url);
        return await res.json();
    }
};

const mapItunesTrack = (item: any): Track => ({
    id: String(item.trackId || Math.random().toString(36).substr(2, 9)),
    title: item.trackName || 'Unknown Title',
    artist: {
        id: String(item.artistId),
        name: item.artistName || 'Unknown Artist'
    },
    album: {
        id: String(item.collectionId),
        title: item.collectionName || 'Unknown Album',
        artist: {
            id: String(item.artistId),
            name: item.artistName
        },
        coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
        colors: {
            primary: '#FA233B',
            secondary: '#1A1A2E',
            tertiary: '#8D4EDD',
            background: '#0F0F1A'
        }
    },
    duration: Math.floor((item.trackTimeMillis || 0) / 1000),
    url: item.previewUrl || '',
    type: TrackType.SONG
});

const ytCache = new Map<string, string>();

export const musicApi = {
    search: async (query: string): Promise<SearchResults> => {
        if (!query) return { tracks: [], artists: [], albums: [] };
        
        try {
            const data = await fetchItunes(`${ITUNES_BASE_URL}/search?term=${encodeURIComponent(query)}&entity=song&limit=40&market=US`);
            const tracks = (data.results || []).map(mapItunesTrack);
            
            // Extract unique artists and albums from tracks
            const artistsMap = new Map();
            const albumsMap = new Map();
            
            tracks.forEach((t: Track) => {
                if (t.artist && !artistsMap.has(t.artist.id)) {
                    artistsMap.set(t.artist.id, {
                        id: t.artist.id,
                        name: t.artist.name,
                        image: t.album?.coverUrl || ''
                    });
                }
                if (t.album && !albumsMap.has(t.album.id)) {
                    albumsMap.set(t.album.id, t.album);
                }
            });

            return {
                tracks,
                artists: Array.from(artistsMap.values()),
                albums: Array.from(albumsMap.values())
            };
        } catch (e) {
            console.error("Search failed", e);
            return { tracks: [], artists: [], albums: [] };
        }
    },

    getHomeData: async () => {
        try {
            // Fetch popular tracks for "Listen Now"
            const data = await fetchItunes(`${ITUNES_BASE_URL}/search?term=pop+hits&entity=song&limit=25`);
            const tracks = (data.results || []).map(mapItunesTrack);
            
            // Group into sections
            const featured: Playlist[] = [{
                id: 'p1',
                title: 'Aether Essentials',
                description: 'The very best music, handpicked for you.',
                coverUrl: tracks[0]?.album?.coverUrl || '',
                tracks: tracks.slice(0, 10),
                type: 'playlist'
            }, {
                id: 'p2',
                title: 'New in Spatial Audio',
                description: 'Experience music like never before in Dolby Atmos.',
                coverUrl: tracks[10]?.album?.coverUrl || '',
                tracks: tracks.slice(10, 20),
                type: 'playlist'
            }];

            return {
                featured,
                newReleases: tracks.slice(0, 15).map(t => t.album),
                categories: [
                    { id: '1', name: 'Chill', icon: 'https://picsum.photos/300/300?random=1' },
                    { id: '2', name: 'Focus', icon: 'https://picsum.photos/300/300?random=2' },
                    { id: '3', name: 'Party', icon: 'https://picsum.photos/300/300?random=3' }
                ] as Category[]
            };
        } catch (e) {
            console.warn("Home data fetch failed, using fallback", e);
            return {
                featured: [],
                newReleases: [],
                categories: []
            };
        }
    },

    getArtistDetails: async (artistId: string) => {
        try {
            // Fetch Artist + Top Songs
            const p1 = fetchItunes(`${ITUNES_BASE_URL}/lookup?id=${artistId}&entity=song&limit=20`);
            // Fetch Artist Albums
            const p2 = fetchItunes(`${ITUNES_BASE_URL}/lookup?id=${artistId}&entity=album&limit=20`);
            
            const [songsData, albumsData] = await Promise.all([p1, p2]);
            
            const artistInfo = songsData.results?.[0] || albumsData.results?.[0];
            const tracks = (songsData.results?.slice(1) || []).map(mapItunesTrack);
            
            const albums = (albumsData.results?.slice(1) || []).map((item: any) => ({
                id: String(item.collectionId),
                title: item.collectionName || 'Unknown Album',
                artist: { id: String(item.artistId), name: item.artistName },
                coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
                colors: { primary: '#FA233B', secondary: '#1A1A2E', tertiary: '#8D4EDD', background: '#0F0F1A' },
                releaseDate: item.releaseDate,
                trackCount: item.trackCount
            }));

            return {
                id: String(artistInfo?.artistId || artistId),
                name: artistInfo?.artistName || 'Unknown',
                image: tracks[0]?.album?.coverUrl || albums[0]?.coverUrl || 'https://picsum.photos/300/300?music',
                topTracks: tracks,
                albums: albums
            };
        } catch (e) {
            console.error("Failed to fetch artist details", e);
            throw e;
        }
    },

    getAlbumDetails: async (albumId: string) => {
        const data = await fetchItunes(`${ITUNES_BASE_URL}/lookup?id=${albumId}&entity=song`);
        const albumInfo = data.results?.[0];
        const tracks = data.results?.slice(1).map(mapItunesTrack) || [];
        
        return {
            id: String(albumInfo?.collectionId),
            title: albumInfo?.collectionName || 'Unknown Album',
            artist: { id: String(albumInfo?.artistId), name: albumInfo?.artistName },
            coverUrl: albumInfo?.artworkUrl100 ? albumInfo.artworkUrl100.replace('100x100bb', '600x600bb') : '',
            tracks
        } as Album;
    },

    // --- HYBRID AUDIO RESOLVER ---
    
    getAudioSource: async (track: Track): Promise<AudioSource> => {
        // 1. If track already has a YouTube ID, use it
        if (track.youtubeId) {
            return { type: 'youtube', value: track.youtubeId };
        }

        // 2. Try to find on YouTube
        try {
            const ytId = await musicApi.findYoutubeVideoId(track);
            if (ytId) {
                return { type: 'youtube', value: ytId };
            }
        } catch (error) {
            console.error('YouTube resolution failed:', error);
        }

        // 3. Fallback to iTunes preview URL
        return { type: 'direct', value: track.url };
    },

    findYoutubeVideoId: async (track: Track): Promise<string | null> => {
        const cacheKey = `${track.id}-${track.title}`;
        if (ytCache.has(cacheKey)) {
            return ytCache.get(cacheKey) || null;
        }

        try {
            // Search YouTube for this track
            const searchQuery = `${track.title} ${track.artist.name} official audio`;
            const res = await fetch(`/api/search-youtube?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            
            if (data.videoId) {
                ytCache.set(cacheKey, data.videoId);
                return data.videoId;
            }
            return null;
        } catch (error) {
            console.error('findYoutubeVideoId failed:', error);
            return null;
        }
    }
};

export default musicApi;
