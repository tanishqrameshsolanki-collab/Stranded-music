
import React, { useRef, useState, useEffect } from 'react';
import { Play, ChevronRight } from 'lucide-react';
import { Playlist, Album } from '../../types';
import { triggerHaptic } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { musicApi } from '../../services/api';
import { usePlayerStore } from '../../services/store';

const ListenNow: React.FC = () => {
  const { playTrack } = usePlayerStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<Playlist[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [greeting, setGreeting] = useState("Listen Now");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const loadData = async () => {
       try {
         const data = await musicApi.getHomeData();
         setFeatured(data.featured);
         setNewReleases(data.newReleases);
       } finally {
         setLoading(false);
       }
    };
    loadData();
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollY = scrollRef.current.scrollTop;
      setShowStickyHeader(scrollY > 40);
    }
  };

  if (loading) {
    return (
        <div className="h-full bg-[#1C1C1E] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white/20 border-white"></div>
        </div>
    );
  }

  return (
    <div className="relative h-full bg-black">
      <AnimatePresence>
        {showStickyHeader && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-[60px] md:h-[64px] bg-black/80 backdrop-blur-2xl border-b border-white/5 z-20 flex items-center px-8"
          >
            <h1 className="text-[20px] font-bold text-white">{greeting}</h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="h-full overflow-y-auto pb-32 md:pb-10 no-scrollbar scroll-smooth"
      >
        <div className="pt-12 px-6 md:px-10">
          
          <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
             <h1 className="text-[34px] font-bold text-white tracking-tight leading-none">{greeting}</h1>
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 border-2 border-black ring-1 ring-white/20 cursor-pointer hover:scale-105 transition-transform" />
          </div>

          {/* Top Picks */}
          <section className="mb-14">
             <SectionHeader title="Top Picks" />
             <div className="flex space-x-6 overflow-x-auto no-scrollbar -mx-6 px-6 md:-mx-10 md:px-10 pb-8 snap-x">
                {featured.slice(0, 3).map((playlist, i) => (
                  <div 
                    key={playlist.id}
                    className="snap-start shrink-0 w-[280px] md:w-[320px] flex flex-col group cursor-pointer"
                    onClick={() => {
                       if(playlist.tracks[0]) playTrack(playlist.tracks[0], playlist.tracks);
                       triggerHaptic('light');
                    }}
                  >
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        {i === 0 ? 'Featured Station' : i === 1 ? 'New Album' : 'Compilation'}
                     </span>
                     <div className="relative aspect-square">
                        <div className="relative z-10 w-full h-full rounded-xl overflow-hidden shadow-sm bg-[#222] border border-white/5 group-active:scale-[0.98] transition-all duration-300">
                            <img src={playlist.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-white text-[20px] font-bold leading-tight mb-1 truncate drop-shadow-md tracking-tight">{playlist.title}</h3>
                                <p className="text-white/80 text-[14px] font-medium truncate drop-shadow-md">Apple Music {playlist.description?.split(' ')[0] || 'Hits'}</p>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-[var(--color-apple-red)] rounded-full p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                               <Play size={18} fill="white" className="text-white ml-0.5" />
                            </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* New Releases */}
          <section className="mb-12">
             <SectionHeader title="New Releases" action="See All" />
             <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 md:-mx-10 md:px-10">
                {newReleases.map((album, idx) => (
                   <div key={idx} className="shrink-0 w-[150px] md:w-[170px] flex flex-col cursor-pointer group active:opacity-80 transition-opacity">
                      <div className="aspect-square rounded-[6px] overflow-hidden mb-2 shadow-md bg-[#222] border border-white/5 group-hover:shadow-xl transition-shadow relative">
                         <img src={album.coverUrl} className="w-full h-full object-cover" loading="lazy" />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Play size={32} fill="white" className="text-white drop-shadow-lg" />
                         </div>
                      </div>
                      <h4 className="text-white text-[15px] font-medium leading-tight truncate group-hover:text-[#FA233B] transition-colors">{album.title}</h4>
                      <p className="text-gray-500 text-[13px] leading-tight truncate mt-0.5">{album.artist.name}</p>
                   </div>
                ))}
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, action }: { title: string, action?: string }) => (
  <div className="flex items-center justify-between mb-4">
     <h2 className="text-[22px] font-bold text-white tracking-tight">{title}</h2>
     {action && (
       <div className="flex items-center text-[var(--color-apple-red)] cursor-pointer hover:opacity-80 transition-opacity group">
         <span className="text-[14px] font-medium">{action}</span>
         <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
       </div>
     )}
  </div>
);

export default ListenNow;
