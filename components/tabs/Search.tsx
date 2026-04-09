
import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResults, Track } from '../../types';
import { triggerHaptic } from '../../utils';
import { musicApi } from '../../services/api';
import { usePlayerStore, useUIStore } from '../../services/store';

const CATEGORIES = [
  { id: 'pop', name: 'Pop', image: 'https://picsum.photos/id/10/300/200', color: 'bg-pink-500' },
  { id: 'hiphop', name: 'Hip-Hop', image: 'https://picsum.photos/id/11/300/200', color: 'bg-orange-500' },
  { id: 'rock', name: 'Rock', image: 'https://picsum.photos/id/12/300/200', color: 'bg-red-600' },
  { id: 'chart', name: 'Charts', image: 'https://picsum.photos/id/13/300/200', color: 'bg-purple-600' },
  { id: 'chill', name: 'Chill', image: 'https://picsum.photos/id/14/300/200', color: 'bg-blue-500' },
  { id: 'focus', name: 'Focus', image: 'https://picsum.photos/id/15/300/200', color: 'bg-indigo-500' },
  { id: 'jazz', name: 'Jazz', image: 'https://picsum.photos/id/16/300/200', color: 'bg-teal-600' },
  { id: 'feel', name: 'Feel Good', image: 'https://picsum.photos/id/17/300/200', color: 'bg-yellow-600' },
];

const Search: React.FC = () => {
  const { playTrack } = usePlayerStore();
  const { setView } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ tracks: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [absorbingTrack, setAbsorbingTrack] = useState<{ id: string, x: number, y: number, cover: string } | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const data = await musicApi.search(query);
          setResults(data);
        } catch (error) {
          // Silent fail
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ tracks: [], artists: [], albums: [] });
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleTrackClick = (e: React.MouseEvent, track: Track) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAbsorbingTrack({
      id: track.id,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      cover: track.album.coverUrl
    });
    
    setTimeout(() => setAbsorbingTrack(null), 800);
    playTrack(track);
  };

  return (
    <div className="h-full overflow-y-auto pb-32 md:pb-10 no-scrollbar bg-[#1C1C1E]">
      <AnimatePresence>
        {absorbingTrack && (
          <motion.div
            initial={{ left: absorbingTrack.x - 24, top: absorbingTrack.y - 24, scale: 1, opacity: 1 }}
            animate={{ left: "50%", top: 20, scale: 0.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.6 }}
            className="fixed w-12 h-12 rounded-xl overflow-hidden z-[200] border-2 border-white shadow-2xl pointer-events-none"
            style={{ marginLeft: -24 }}
          >
            <img src={absorbingTrack.cover} className="w-full h-full object-cover" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-16 md:pt-10 px-5 md:px-8 min-h-full flex flex-col max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">Search</h1>
        
        <div className="sticky top-0 z-30 pb-4 bg-[#1C1C1E]">
            <div className="relative max-w-3xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="text-gray-400" size={18} />
              </div>
              <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Artists, Songs, Lyrics, and More"
                  className="w-full bg-[#2c2c2e] text-white placeholder-gray-500 rounded-lg py-2.5 pl-10 pr-10 focus:outline-none focus:bg-[#3a3a3c] text-[17px] transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                  <div className="bg-gray-600 rounded-full p-0.5"><X size={12} className="text-black" /></div>
                </button>
              )}
            </div>
        </div>

        <div className="flex-1 mt-2">
            {!query ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <section>
                    <h2 className="text-xl font-bold text-white mb-3">Browse Categories</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {CATEGORIES.map((cat) => (
                        <div key={cat.id} className={`h-28 rounded-lg relative overflow-hidden cursor-pointer ${cat.color} hover:opacity-90 active:scale-[0.98] transition-all`} onClick={() => triggerHaptic('light')}>
                          <span className="absolute bottom-3 left-3 font-bold text-white text-[15px] z-10 shadow-black drop-shadow-md">{cat.name}</span>
                          <img src={cat.image} className="absolute right-0 bottom-0 w-16 h-16 rotate-[25deg] translate-x-3 translate-y-3 shadow-lg rounded-sm" alt={cat.name}/>
                        </div>
                      ))}
                    </div>
                  </section>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20 space-y-8">
                  {loading ? (
                    <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>
                  ) : (
                    <>
                      {results.tracks.length > 0 && (
                        <section>
                           <div className="flex items-center justify-between mb-2">
                              <h2 className="text-[20px] font-bold text-white">Songs</h2>
                              <span className="text-[#FA233B] text-sm font-medium cursor-pointer">See All</span>
                           </div>
                           <div className="flex flex-col bg-[#2c2c2e] rounded-xl overflow-hidden">
                              {results.tracks.slice(0, 5).map((track, i) => (
                                <div key={track.id} onClick={(e) => handleTrackClick(e, track)} className={`flex items-center p-3 cursor-pointer hover:bg-white/5 active:bg-white/10 ${i !== results.tracks.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <img src={track.album?.coverUrl} className="w-12 h-12 rounded-[4px] shadow-sm mr-3 object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-[16px] font-medium truncate">{track.title}</h4>
                                        <p className="text-gray-400 text-[14px] truncate">{track.artist?.name}</p>
                                    </div>
                                </div>
                              ))}
                           </div>
                        </section>
                      )}

                      {results.artists.length > 0 && (
                        <section>
                           <h2 className="text-[20px] font-bold text-white mb-2">Artists</h2>
                           <div className="overflow-x-auto no-scrollbar -mx-5 px-5 flex space-x-4 pb-2">
                              {results.artists.map((artist) => (
                                <div key={artist.id} className="flex flex-col items-center w-28 shrink-0 cursor-pointer" onClick={() => setView({ type: 'artist', id: artist.id })}>
                                   <div className="w-24 h-24 rounded-full overflow-hidden bg-[#333] mb-2 border border-white/10">
                                       {artist.image ? <img src={artist.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xl">{artist.name[0]}</div>}
                                   </div>
                                   <span className="text-white text-[14px] font-medium truncate w-full text-center">{artist.name}</span>
                                </div>
                              ))}
                           </div>
                        </section>
                      )}
                      
                      {results.tracks.length === 0 && results.artists.length === 0 && results.albums.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                           <SearchIcon size={48} className="mb-4 opacity-20" />
                           <p className="text-lg">No results found for "{query}"</p>
                        </div>
                      )}
                    </>
                  )}
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Search;
