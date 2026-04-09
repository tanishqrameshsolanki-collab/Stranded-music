
import React from 'react';
import { Track } from '../../types';
import { Play, AlignJustify } from 'lucide-react';
import { formatTime } from '../../utils';

interface QueueViewProps {
  queue: Track[];
  currentIndex: number;
  onPlayTrack: (index: number) => void;
}

const QueueView: React.FC<QueueViewProps> = ({ queue, currentIndex, onPlayTrack }) => {
  
  // Split queue into "Now Playing" and "Up Next"
  const history = queue.slice(0, currentIndex);
  const current = queue[currentIndex];
  const upNext = queue.slice(currentIndex + 1);

  return (
    <div className="flex flex-col h-full px-4 overflow-y-auto no-scrollbar mask-gradient-top-bottom">
       <div className="pt-2 pb-8">
            <h3 className="text-white font-bold text-xl mb-4">Playing Next</h3>
            
            {/* Current Track */}
            {current && current.album && (
                <div className="mb-6 bg-white/10 rounded-xl p-3 flex items-center border border-white/10">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#333] shrink-0 relative">
                         <img src={current.album.coverUrl} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full bg-[#FA233B] animate-pulse" />
                         </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-white font-semibold text-[15px] truncate">{current.title}</p>
                        <p className="text-white/60 text-[13px] truncate">{current.artist.name}</p>
                    </div>
                    <span className="text-xs font-medium text-white/40">Now Playing</span>
                </div>
            )}

            {/* Up Next List */}
            <div className="space-y-1">
                {upNext.length === 0 ? (
                    <div className="text-white/30 text-center py-10 font-medium">End of Queue</div>
                ) : (
                    upNext.map((track, i) => {
                        if (!track || !track.album) return null;
                        return (
                            <div 
                                key={`${track.id}-${i}`}
                                onClick={() => onPlayTrack(currentIndex + 1 + i)}
                                className="flex items-center p-2 rounded-lg hover:bg-white/5 active:bg-white/10 cursor-pointer group transition-colors"
                            >
                                <div className="w-4 text-xs text-gray-500 font-medium mr-3 text-center group-hover:hidden">{i + 1}</div>
                                <div className="w-4 mr-3 hidden group-hover:flex justify-center text-white">
                                    <Play size={12} fill="white" />
                                </div>
                                
                                <div className="w-10 h-10 rounded-[6px] overflow-hidden bg-[#333] shrink-0 mr-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <img src={track.album.coverUrl} className="w-full h-full object-cover" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/90 font-medium text-[14px] truncate">{track.title}</p>
                                    <p className="text-white/50 text-[12px] truncate">{track.artist.name}</p>
                                </div>
                                
                                <div className="text-xs text-white/30 group-hover:text-white/60 font-variant-numeric">
                                    {formatTime(track.duration)}
                                </div>
                                <div className="ml-3 text-white/20 group-hover:text-white/50 cursor-grab active:cursor-grabbing">
                                    <AlignJustify size={14} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* History (Optional/Collapsible could be added) */}
            {history.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/5 opacity-50">
                    <h4 className="text-white/60 font-bold text-sm mb-4 uppercase tracking-wider">History</h4>
                    <div className="space-y-1">
                        {history.map((track, i) => {
                             if (!track || !track.album) return null;
                             return (
                                 <div 
                                    key={`hist-${track.id}-${i}`}
                                    onClick={() => onPlayTrack(i)}
                                    className="flex items-center p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                                 >
                                     <div className="w-10 h-10 rounded-[6px] overflow-hidden bg-[#333] shrink-0 mr-3 grayscale">
                                         <img src={track.album.coverUrl} className="w-full h-full object-cover" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <p className="text-white/90 font-medium text-[14px] truncate decoration-white/30">{track.title}</p>
                                        <p className="text-white/50 text-[12px] truncate">{track.artist.name}</p>
                                     </div>
                                 </div>
                             );
                        })}
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default QueueView;
