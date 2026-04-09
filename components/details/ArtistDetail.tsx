import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Shuffle, ChevronRight, MoreHorizontal } from 'lucide-react';
import { musicApi } from '../../services/api';
import { Artist, Track, Album } from '../../types';
import { usePlayerStore, useUIStore } from '../../services/store';

interface ArtistDetailProps {
  artistId: string;
  onBack: () => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ artistId, onBack }) => {
  const { playTrack } = usePlayerStore();
  const { setView } = useUIStore();
  const [data, setData] = useState<{ id: string; name: string; image: string; topTracks: Track[]; albums: Album[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await musicApi.getArtistDetails(artistId);
        if (res.albums && res.albums.length > 0) {
            res.albums.sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime());
        }
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [artistId]);

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#1C1C1E]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white/20 border-white"></div>
    </div>
  );

  if (!data) return (
      <div className="h-full flex items-center justify-center bg-[#1C1C1E] flex-col space-y-4">
          <p className="text-gray-400">Failed to load artist details.</p>
          <button onClick={onBack} className="text-[#FA233B] hover:underline">Go Back</button>
      </div>
  );

  const latestAlbum = data.albums[0];
  const essentialAlbums = data.albums; 

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#1C1C1E] animate-fade-in relative font-sans pb-32">
       
       <button 
         onClick={onBack} 
         className="absolute top-6 left-6 z-40 flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full transition-colors"
       >
           <ArrowLeft size={20} className="text-white" />
       </button>

       {/* Hero Banner Header */}
       <div className="relative w-full h-[60vh] md:h-[50vh] min-h-[350px]">
           <img src={data.image} alt={data.name} className="absolute inset-0 w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/60 to-transparent" />
           <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between">
               
               <div className="flex-1">
                   <h1 className="text-6xl md:text-8xl text-white tracking-tighter mb-6 drop-shadow-lg font-bold" style={{ fontWeight: 800 }}>{data.name}</h1>
                   <div className="flex items-center space-x-4">
                       <button 
                          onClick={() => data.topTracks[0] && playTrack(data.topTracks[0], data.topTracks)}
                          className="flex items-center justify-center space-x-2 bg-[#FA233B] hover:scale-105 text-white px-8 py-3.5 rounded-full font-bold transition-transform active:scale-95 shadow-xl"
                       >
                          <Play fill="currentColor" size={24} />
                          <span className="text-[17px]">Play</span>
                       </button>
                       <button className="flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full text-white transition-colors active:scale-95">
                          <Shuffle size={24} />
                       </button>
                   </div>
               </div>
           </div>
       </div>

       <div className="px-6 md:px-10 mt-6 lg:mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             
             {/* Left Col: Top Songs */}
             <div className="lg:col-span-8">
                 <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                     <h2 className="text-[24px] font-bold text-white tracking-tight flex items-center cursor-pointer group">
                        Top Songs <ChevronRight size={22} className="ml-1 text-gray-500 group-hover:text-white transition-colors" />
                     </h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                     {data.topTracks.slice(0, 8).map((track, i) => {
                         if (!track || !track.album) return null;
                         return (
                           <div 
                             key={track.id}
                             className="flex items-center p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors"
                             onClick={() => playTrack(track, data.topTracks)}
                           >
                               <div className="w-6 text-center text-gray-500 font-medium text-[14px] group-hover:hidden">{i + 1}</div>
                               <div className="w-6 justify-center hidden group-hover:flex">
                                  <Play size={14} fill="white" className="text-white" />
                               </div>
                               <div className="relative w-12 h-12 shrink-0 mx-3 rounded-[6px] overflow-hidden shadow-sm bg-[#333]">
                                   <img src={track.album?.coverUrl || ''} className="w-full h-full object-cover" alt={track.title} />
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                               <div className="flex-1 min-w-0 pr-4">
                                   <div className="text-white font-medium text-[16px] truncate leading-snug">{track.title}</div>
                                   <div className="text-gray-400 text-[14px] truncate leading-snug mt-0.5">
                                       {track.album?.title || 'Unknown Album'}
                                   </div>
                               </div>
                               <MoreHorizontal className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         );
                     })}
                 </div>
             </div>

             {/* Right Col: Latest Release */}
             <div className="lg:col-span-4 flex flex-col pt-2 lg:pt-0">
                 <h2 className="text-[24px] font-bold text-white mb-4 tracking-tight border-b border-white/10 pb-3">Latest Release</h2>
                 {latestAlbum ? (
                     <div 
                        className="group cursor-pointer rounded-2xl hover:bg-white/5 p-4 -mx-4 transition-colors duration-200 flex flex-col space-y-4"
                        onClick={() => setView({ type: 'album', id: latestAlbum.id })}
                     >
                        <div className="w-full aspect-square rounded-[12px] overflow-hidden bg-[#333] shadow-2xl relative">
                            <img src={latestAlbum.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={latestAlbum.title} />
                            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Play fill="white" size={20} className="text-white ml-1" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                           <span className="text-gray-400 text-[12px] font-bold uppercase tracking-wider mb-1">
                               {latestAlbum.releaseDate ? new Date(latestAlbum.releaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown Date'}
                           </span>
                           <span className="text-white font-bold text-[20px] truncate leading-tight mb-1">{latestAlbum.title}</span>
                           <span className="text-gray-400 text-[15px] leading-snug">
                               {latestAlbum.trackCount ? `${latestAlbum.trackCount} songs` : 'Album'}
                           </span>
                        </div>
                     </div>
                 ) : (
                    <p className="text-gray-500">No releases found.</p>
                 )}
             </div>
          </div>

          <div className="mt-14 mb-10">
               <div className="flex items-center justify-between mb-5">
                   <h2 className="text-[24px] font-bold text-white tracking-tight">Essential Albums</h2>
                   <span className="text-[#FA233B] text-[15px] font-medium cursor-pointer hover:underline">See All</span>
               </div>
               
               <div className="flex overflow-x-auto pb-6 -mx-6 px-6 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 md:overflow-visible md:p-0 md:mx-0 snap-x no-scrollbar">
                   {essentialAlbums.map(album => (
                       <div 
                         key={album.id} 
                         onClick={() => setView({ type: 'album', id: album.id })}
                         className="cursor-pointer group shrink-0 w-[160px] md:w-auto mr-5 md:mr-0 snap-start active:opacity-75 transition-opacity"
                       >
                           <div className="aspect-square rounded-[10px] overflow-hidden bg-[#333] shadow-lg mb-3 border border-white/5 relative">
                               <img src={album.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={album.title} />
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                           <h3 className="text-white font-semibold text-[15px] leading-tight mb-0.5 line-clamp-1 group-hover:text-[#FA233B] transition-colors">{album.title}</h3>
                           <p className="text-gray-400 text-[14px] truncate">{album.releaseDate?.split('-')[0]} • Album</p>
                       </div>
                   ))}
               </div>
          </div>
       </div>
    </div>
  );
};

export default ArtistDetail;
