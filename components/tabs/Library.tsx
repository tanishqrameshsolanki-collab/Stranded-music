
import React, { useEffect, useState } from 'react';
import { ChevronRight, WifiOff, Music2, Mic2, Disc, ListMusic, User, Clock, MonitorPlay, Music } from 'lucide-react';
import { libraryService } from '../../services/supabase';
import { Track } from '../../types';

const Library = () => {
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const tracks = await libraryService.getSavedTracks();
        setSavedTracks(tracks);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load library", err);
        setError(err.message || "Failed to connect to Supabase");
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  return (
    <div className="h-full overflow-y-auto pb-32 no-scrollbar bg-[#1C1C1E]">
      <div className="pt-12 px-6 md:px-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[32px] font-bold text-white tracking-tight">Library</h1>
          <button className="text-[#FA233B] text-[16px] font-medium hover:underline">Edit</button>
        </div>

        {/* Connection Status Debugger (Hidden if clean) */}
        {error && (
            <div className={`mb-6 p-3 rounded-lg border flex items-center space-x-3 bg-red-500/10 border-red-500/50`}>
                <div className={`p-1.5 rounded-full bg-red-500/20`}>
                    <WifiOff size={16} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider text-red-400`}>Connection Failed</p>
                    <p className="text-xs text-white/60 truncate">{error}</p>
                </div>
            </div>
        )}

        {/* Apple Music Library Menu List (Visual Match) */}
        <div className="flex flex-col mb-10 border-t border-white/5">
          <MenuItem label="Playlists" icon={ListMusic} />
          <MenuItem label="Artists" icon={Mic2} />
          <MenuItem label="Albums" icon={Disc} />
          <MenuItem label="Songs" icon={Music2} />
          <MenuItem label="Made For You" icon={User} />
          <MenuItem label="TV & Movies" icon={MonitorPlay} />
          <MenuItem label="Music Videos" icon={Music} />
        </div>

        {/* Recently Added Section */}
        <section>
          <h2 className="text-[20px] font-bold text-white mb-4 tracking-tight">Recently Added</h2>
          {loading ? (
             <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white/20 border-white"></div>
             </div>
          ) : savedTracks.length === 0 && !error ? (
             <div className="py-16 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music2 size={32} className="text-white/50" />
                </div>
                <p className="text-[20px] font-bold text-white mb-2">Looking for your music?</p>
                <p className="text-[15px] text-gray-500 max-w-xs mx-auto">Music you add from Apple Music will appear here.</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
              {savedTracks.map(track => {
                if (!track || !track.album) return null;
                return (
                  <div key={track.id} className="flex flex-col cursor-pointer group active:opacity-75 transition-opacity">
                     <div className="aspect-square bg-[#222] rounded-[8px] overflow-hidden shadow-sm mb-2 relative border border-white/5 group-hover:shadow-md transition-shadow">
                        <img src={track.album.coverUrl} className="w-full h-full object-cover" alt={track.album.title} />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                     <div>
                        <h3 className="text-white text-[14px] font-medium truncate leading-tight">{track.title}</h3>
                        <p className="text-gray-500 text-[13px] truncate leading-tight mt-0.5">{track.artist.name}</p>
                     </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{ label: string, icon: any }> = ({ label, icon: Icon }) => (
  <div className="flex items-center py-[11px] active:bg-[#2c2c2e] transition-colors cursor-pointer group -mx-6 px-6 border-b border-white/5 last:border-0 hover:bg-white/5">
    <Icon size={22} className="text-[#FA233B] mr-4" />
    <span className="text-[19px] text-white font-normal flex-1 tracking-tight">{label}</span>
  </div>
);

export default Library;
