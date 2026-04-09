
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Clock, Calendar } from 'lucide-react';
import { musicApi } from '../../services/api';
import { Album } from '../../types';
import { formatTime } from '../../utils';
import { usePlayerStore } from '../../services/store';

interface AlbumDetailProps {
  albumId: string;
  onBack: () => void;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({ albumId, onBack }) => {
  const { playTrack } = usePlayerStore();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await musicApi.getAlbumDetails(albumId);
        setAlbum(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [albumId]);

  if (loading) return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
  );

  if (!album) return null;

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#1C1C1E] animate-fade-in">
       {/* Header */}
       <div className="relative pt-16 pb-8 px-6 md:px-10 flex flex-col md:flex-row items-center md:items-end gap-8 bg-gradient-to-b from-[#2a2a2a] to-[#1C1C1E]">
          <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/20 rounded-full hover:bg-black/40 z-20">
              <ArrowLeft size={24} className="text-white" />
          </button>
          
          <div className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-lg overflow-hidden shrink-0">
             <img src={album.coverUrl} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex flex-col text-center md:text-left items-center md:items-start">
             <h4 className="text-[#FA233B] font-bold text-sm uppercase tracking-wider mb-2">Album</h4>
             <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">{album.title}</h1>
             <h2 className="text-xl md:text-2xl text-white/80 font-medium mb-4">{album.artist.name}</h2>
             <div className="flex items-center text-gray-400 text-sm space-x-2">
                 <span className="uppercase font-semibold">{album.artist.name.toUpperCase()}</span>
                 <span>•</span>
                 <span>{album.releaseDate?.split('-')[0]}</span>
             </div>
          </div>
       </div>

       {/* Tracklist */}
       <div className="px-2 md:px-10 pb-32">
          <div className="flex items-center justify-between py-4 px-4">
              <button 
                onClick={() => album.tracks && album.tracks.length > 0 && playTrack(album.tracks[0], album.tracks)}
                className="flex items-center space-x-2 bg-[#FA233B] hover:bg-[#d11e32] text-white px-8 py-3 rounded-full font-semibold transition-transform active:scale-95 shadow-lg"
              >
                 <Play fill="currentColor" size={18} />
                 <span>Play</span>
              </button>
          </div>

          <div className="flex flex-col">
             {album.tracks?.map((track, i) => (
                <div 
                    key={track.id} 
                    onClick={() => playTrack(track, album.tracks)}
                    className="flex items-center p-3 rounded-lg hover:bg-white/5 cursor-pointer group border-b border-white/5 last:border-0 transition-colors"
                >
                    <div className="w-8 text-center text-gray-500 font-medium group-hover:hidden">{i + 1}</div>
                    <div className="w-8 text-center hidden group-hover:block text-white">
                        <Play size={16} fill="white" />
                    </div>
                    <div className="flex-1 min-w-0 mx-4">
                        <div className="text-white font-medium text-[15px] truncate">{track.title}</div>
                        <div className="text-gray-500 text-[13px]">{track.artist.name}</div>
                    </div>
                    <div className="text-gray-500 text-[13px] font-variant-numeric">{formatTime(track.duration)}</div>
                </div>
             ))}
          </div>
          
          <div className="mt-8 text-gray-500 text-sm px-4 pb-8">
             <p>{album.tracks?.length} Songs</p>
          </div>
       </div>
    </div>
  );
};

export default AlbumDetail;
