
import { Track, Album, Playlist, SearchResults, TrackType, Category, AudioSource } from '../types';

// API calls are same-origin: in dev they hit the local Express server,
// in production they hit Vercel Serverless Functions at /api/*
const ITUNES_BASE_URL = 'https://itunes.apple.com';

// --- Cached, deduplicated fetch layer ---
// Catalog data (search results, album/artist lookups) is effectively static for a
// session, so identical requests share one in-flight promise and are cached briefly.
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const responseCache = new Map<string, { expires: number; data: any }>();
const inflight = new Map<string, Promise<any>>();

const rememberResponse = (key: string, data: any) => {
    if (responseCache.size >= CACHE_MAX_ENTRIES) {
        const oldest = responseCache.keys().next().value;
        if (oldest !== undefined) responseCache.delete(oldest);
    }
    responseCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
};

const fetchJsonCached = async (url: string, signal?: AbortSignal): Promise<any> => {
    const cached = responseCache.get(url);
    if (cached && cached.expires > Date.now()) return cached.data;

    const pending = inflight.get(url);
    if (pending) return abortable(pending, signal);

    const request = (async () => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = await res.json();
            rememberResponse(url, data);
            return data;
        } finally {
            inflight.delete(url);
        }
    })();
    inflight.set(url, request);
    return abortable(request, signal);
};

// The shared request keeps running for other consumers; only this caller bails out.
const abortable = <T,>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
    return new Promise<T>((resolve, reject) => {
        const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
};

export const isAbortError = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

const fetchItunes = async (url: string, signal?: AbortSignal) => {
    try {
        return await fetchJsonCached(`/api/itunes?url=${encodeURIComponent(url)}`, signal);
    } catch (proxyError) {
        if (isAbortError(proxyError)) throw proxyError;
        console.error('iTunes Proxy Error:', proxyError);
        // Fallback to direct fetch if proxy fails (might hit CORS but worth a shot)
        return fetchJsonCached(url, signal);
    }
};

// iTunes artwork URLs encode the size; 600px covers the largest artwork we display.
const ARTWORK_SIZE_RE = /\/\d+x\d+bb(-\d+)?\.(jpg|png|webp)$/;
export const artworkUrl = (url: string | undefined, size: number): string => {
    if (!url) return '';
    if (!ARTWORK_SIZE_RE.test(url)) return url;
    return url.replace(ARTWORK_SIZE_RE, `/${size}x${size}bb.webp`);
};

const DEFAULT_COLORS = { primary: '#FA233B', secondary: '#1A1A2E', tertiary: '#8D4EDD', background: '#0F0F1A' };

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
        coverUrl: artworkUrl(item.artworkUrl100, 600),
        colors: DEFAULT_COLORS
    },
    duration: Math.floor((item.trackTimeMillis || 0) / 1000),
    url: item.previewUrl || '',
    type: TrackType.SONG
});

const ytCache = new Map<string, string | null>();
const ytInflight = new Map<string, Promise<string | null>>();

export const musicApi = {
    search: async (query: string, signal?: AbortSignal): Promise<SearchResults> => {
        if (!query) return { tracks: [], artists: [], albums: [] };

        try {
            const data = await fetchItunes(`${ITUNES_BASE_URL}/search?term=${encodeURIComponent(query)}&entity=song&limit=40&market=US`, signal);
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
            if (isAbortError(e)) throw e;
            console.error("Search failed", e);
            return { tracks: [], artists: [], albums: [] };
        }
    },

    getHomeData: async (signal?: AbortSignal) => {
        try {
            const data = await fetchItunes(`${ITUNES_BASE_URL}/search?term=pop+hits&entity=song&limit=25`, signal);
            const tracks = (data.results || []).map(mapItunesTrack);

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
            if (isAbortError(e)) throw e;
            console.warn("Home data fetch failed, using fallback", e);
            return {
                featured: [],
                newReleases: [],
                categories: []
            };
        }
    },

    getArtistDetails: async (artistId: string, signal?: AbortSignal) => {
        try {
            const [songsData, albumsData] = await Promise.all([
                fetchItunes(`${ITUNES_BASE_URL}/lookup?id=${artistId}&entity=song&limit=20`, signal),
                fetchItunes(`${ITUNES_BASE_URL}/lookup?id=${artistId}&entity=album&limit=20`, signal)
            ]);

            const artistInfo = songsData.results?.[0] || albumsData.results?.[0];
            const tracks = (songsData.results?.slice(1) || []).map(mapItunesTrack);

            const albums: Album[] = (albumsData.results?.slice(1) || []).map((item: any) => ({
                id: String(item.collectionId),
                title: item.collectionName || 'Unknown Album',
                artist: { id: String(item.artistId), name: item.artistName },
                coverUrl: artworkUrl(item.artworkUrl100, 600),
                colors: DEFAULT_COLORS,
                releaseDate: item.releaseDate,
                trackCount: item.trackCount
            }));
            albums.sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime());

            return {
                id: String(artistInfo?.artistId || artistId),
                name: artistInfo?.artistName || 'Unknown',
                image: tracks[0]?.album?.coverUrl || albums[0]?.coverUrl || 'https://picsum.photos/300/300?music',
                topTracks: tracks as Track[],
                albums
            };
        } catch (e) {
            if (!isAbortError(e)) console.error("Failed to fetch artist details", e);
            throw e;
        }
    },

    getAlbumDetails: async (albumId: string, signal?: AbortSignal) => {
        const data = await fetchItunes(`${ITUNES_BASE_URL}/lookup?id=${albumId}&entity=song`, signal);
        const albumInfo = data.results?.[0];
        const tracks = data.results?.slice(1).map(mapItunesTrack) || [];

        return {
            id: String(albumInfo?.collectionId),
            title: albumInfo?.collectionName || 'Unknown Album',
            artist: { id: String(albumInfo?.artistId), name: albumInfo?.artistName },
            coverUrl: artworkUrl(albumInfo?.artworkUrl100, 600),
            colors: DEFAULT_COLORS,
            releaseDate: albumInfo?.releaseDate,
            tracks
        } as Album;
    },

    // --- HYBRID AUDIO RESOLVER ---

    getAudioSource: async (track: Track): Promise<AudioSource> => {
        if (track.youtubeId) {
            return { type: 'youtube', value: track.youtubeId };
        }

        try {
            const ytId = await musicApi.findYoutubeVideoId(track);
            if (ytId) {
                return { type: 'youtube', value: ytId };
            }
        } catch (error) {
            console.error('YouTube resolution failed:', error);
        }

        // Fallback to iTunes preview URL
        return { type: 'direct', value: track.url };
    },

    findYoutubeVideoId: async (track: Track): Promise<string | null> => {
        const cacheKey = `${track.id}-${track.title}`;
        if (ytCache.has(cacheKey)) return ytCache.get(cacheKey) ?? null;

        const pending = ytInflight.get(cacheKey);
        if (pending) return pending;

        const lookup = (async () => {
            try {
                const searchQuery = `${track.title} ${track.artist.name} official audio`;
                const res = await fetch(`/api/search-youtube?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                const videoId: string | null = data.videoId || null;
                // Negative results are cached too so a missing track doesn't re-hit the scraper on every skip.
                ytCache.set(cacheKey, videoId);
                return videoId;
            } catch (error) {
                console.error('findYoutubeVideoId failed:', error);
                return null;
            } finally {
                ytInflight.delete(cacheKey);
            }
        })();
        ytInflight.set(cacheKey, lookup);
        return lookup;
    }
};

export default musicApi;
