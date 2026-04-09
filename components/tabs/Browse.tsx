
import React, { useEffect, useState } from 'react';
import { Play, ChevronRight } from 'lucide-react';
import { musicApi } from '../../services/api';
import { Album, Playlist, Category } from '../../types';

const Browse = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ newReleases: Album[], featured: Playlist[], categories: Category[] }>({
      newReleases: [],
      featured: [],
      categories: []
  });

  useEffect(() => {
    const loadData = async () => {
        try {
            const result = await musicApi.getHomeData();
            setData(result);
        } catch (e) {
            console.error("Browse fetch failed", e);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  if (loading) return (
      <div className="h-full bg-[#1C1C1E] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white/20 border-white"></div>
      </div>
  );

  return (
    <div className="h-full overflow-y-auto pb-32 md:pb-10 no-scrollbar bg-[#1C1C1E]">
      <div className="pt-12 px-6 md:px-10">
        <h1 className="text-[32px] font-bold mb-6 text-white tracking-tight border-b border-white/5 pb-4">Browse</h1>
        
        {/* Featured Carousel - Hero Banner Style */}
        <div className="flex overflow-x-auto snap-x no-scrollbar -mx-6 px-6 md:-mx-10 md:px-10 pb-10 space-x-5">
           {data.featured.slice(0, 5).map((playlist, i) => (
             <div key={playlist.id} className="snap-center shrink-0 w-[90%] md:w-[48%] aspect-[16/9] md:aspect-[2.1/1] relative rounded-[12px] overflow-hidden group cursor-pointer shadow-lg border border-white/5">
                <img src={playlist.coverUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 w-full max-w-lg">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1.5 block">Featured</span>
                   <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">{playlist.title}</h2>
                   <p className="text-white/90 text-[15px] leading-snug truncate">{playlist.description}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Browse by Category */}
        <section className="mb-12">
           <SectionHeader title="Browse by Category" />
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {data.categories.length > 0 ? data.categories.map((cat) => (
               <div key={cat.id} className="h-24 md:h-28 rounded-[8px] relative overflow-hidden cursor-pointer group border border-white/5 shadow-sm">
                  <img src={cat.icon} className="absolute inset-0 w-full h-full object-cover brightness-[0.6] group-hover:brightness-[0.5] transition-all group-hover:scale-105 duration-500" />
                  <span className="absolute bottom-2 left-3 text-white font-bold text-[16px] tracking-tight">{cat.name}</span>
               </div>
             )) : (
                 // Fallback if no categories loaded
                 ['Hits', 'Chill', 'R&B', 'Classic Rock'].map((cat, i) => (
                    <div key={i} className="h-24 md:h-28 rounded-[8px] relative overflow-hidden cursor-pointer group border border-white/5 shadow-sm bg-[#333]">
                        <span className="absolute bottom-2 left-3 text-white font-bold text-[16px] tracking-tight">{cat}</span>
                    </div>
                 ))
             )}
           </div>
        </section>

        {/* New Releases */}
        <section className="mb-10">
           <SectionHeader title="New Music" action="See All" />
           <div className="flex space-x-4 overflow-x-auto no-scrollbar -mx-6 px-6 md:-mx-10 md:px-10 pb-4">
              {data.newReleases.map(album => (
                <div key={album.id} className="w-40 md:w-48 shrink-0 cursor-pointer group">
                  <div className="relative mb-2 aspect-square rounded-[8px] overflow-hidden bg-[#222] shadow-sm border border-white/5 group-hover:shadow-md transition-shadow">
                    <img src={album.coverUrl} className="w-full h-full object-cover transition-opacity hover:opacity-80" />
                  </div>
                  <p className="text-white text-[14px] font-medium truncate leading-tight">{album.title}</p>
                  <p className="text-gray-500 text-[13px] truncate leading-tight mt-0.5">{album.artist.name}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Global Charts */}
        <section>
            <SectionHeader title="Daily Top 100" action="See All" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center bg-white/5 hover:bg-white/10 transition-colors rounded-[8px] p-3 cursor-pointer group">
                     <div className="w-14 h-14 rounded-[4px] bg-[#333] shrink-0 mr-3 overflow-hidden relative shadow-sm">
                        <img src={`https://picsum.photos/id/${300+i}/100/100`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Play size={18} fill="white" className="text-white" />
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-[14px] truncate">Top 100: Global</h4>
                        <p className="text-gray-500 text-[12px] truncate">Apple Music</p>
                     </div>
                     <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                  </div>
               ))}
            </div>
        </section>

      </div>
    </div>
  );
};

const SectionHeader = ({ title, action }: { title: string, action?: string }) => (
  <div className="flex items-center justify-between mb-4 mt-2">
     <h2 className="text-[20px] font-bold text-white tracking-tight">{title}</h2>
     {action && (
       <div className="flex items-center text-[#FA233B] cursor-pointer hover:opacity-80 transition-opacity group">
         <span className="text-[14px] font-medium">{action}</span>
         <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
       </div>
     )}
  </div>
);

export default Browse;
