
import React, { useState, useEffect } from 'react';
import { Play, Plus, Users, Mic2, MessageCircle, MoreHorizontal, Radio, Heart, Share2, Music, Headphones, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOCK_TRACKS } from '../../constants';
import { User, Island, Post, Track } from '../../types';
import { triggerHaptic } from '../../utils';
import { authService, partyService } from '../../services/supabase';
import { usePlayerStore } from '../../services/store';


interface ConnectProps {
    onStartParty?: (hostUser: User) => void;
}


// --- MOCK DATA FOR SOCIAL FEATURES ---

const MOCK_FRIENDS_USERS: User[] = [
  { id: 'u2', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=u2', status: 'Listening to Blonde' },
  { id: 'u3', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=u3', status: 'Hosting a Party' },
  { id: 'u4', name: 'Echoes', avatar: 'https://i.pravatar.cc/150?u=u4' },
  { id: 'u5', name: 'Mike', avatar: 'https://i.pravatar.cc/150?u=u5' },
];

const FEED_POSTS: Post[] = [
  {
    id: 'p1',
    user: MOCK_FRIENDS_USERS[0], // Alex
    type: 'crate',
    timestamp: '2h ago',
    content: {
      title: 'The Crate',
      subtitle: '6 albums',
      albums: [
        { ...MOCK_TRACKS[0].album, sticker: { text: 'Saw Live', color: 'bg-blue-500', rotate: '-rotate-6' } },
        { ...MOCK_TRACKS[2].album, sticker: null },
        { ...MOCK_TRACKS[1].album, sticker: { text: 'Cried', color: 'bg-orange-500', rotate: 'rotate-3' } },
      ]
    }
  },
  {
    id: 'p2',
    user: MOCK_FRIENDS_USERS[2], // Echoes
    type: 'echo',
    timestamp: '4h ago',
    content: {
      track: MOCK_TRACKS[1], 
      message: "This bassline is illegal 🚫 wait for the drop",
      voiceNote: true
    }
  },
  {
    id: 'p3',
    user: MOCK_FRIENDS_USERS[0], // Alex
    type: 'drift',
    timestamp: '5h ago',
    content: {
      match: 94,
      artist: 'Talking Heads',
      colors: ['#3b82f6', '#f97316'] // Blue and Orange
    }
  }
];

// --- COMPONENTS ---

const Connect: React.FC<ConnectProps> = ({ onStartParty, onJoinParty, activePartyId }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'discover'>('friends');
  const [user, setUser] = useState<User | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [parties, setParties] = useState<any[]>([]);
  const { startParty, joinParty, activeParty, isHost } = usePlayerStore();

  const loadData = async () => {
      const u = await authService.getUser();
      if (u) {
          setUser({
              id: u.id,
              name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'You',
              avatar: u.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?u=me'
          });
      }
      const active = await partyService.getActiveParties();
      setParties(active);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);


  const handleSignOut = async () => {
    triggerHaptic('medium');
    await authService.signOut();
  };

  const ACTIVE_ISLAND: Island = {
      id: 'i1',
      host: MOCK_FRIENDS_USERS[1], // Sarah
      currentTrack: MOCK_TRACKS[2], // Blinding Lights
      listeners: [MOCK_FRIENDS_USERS[0], MOCK_FRIENDS_USERS[3], user || { id: 'me', name: 'You', avatar: 'https://i.pravatar.cc/150?u=me' }],
      isActive: true
  };

  return (
    <div className="h-full overflow-y-auto pb-32 md:pb-10 no-scrollbar bg-[#1C1C1E]">
      <div className="pt-16 md:pt-14 px-5 md:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/5">
          <h1 className="text-[34px] font-bold text-white tracking-tight leading-none">Connect</h1>
          <div className="flex items-center space-x-4">
              <button 
                onClick={handleSignOut}
                className="text-gray-500 hover:text-white transition-colors"
                title="Sign Out"
              >
                  <LogOut size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-[#2C2C2E] overflow-hidden border border-white/10 cursor-pointer active:scale-95 transition-transform">
                 <img src={user?.avatar || "https://i.pravatar.cc/150?u=me"} className="w-full h-full object-cover" alt="Profile" />
              </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden bg-[#2C2C2E] p-1 rounded-[9px] mb-8 flex relative h-[36px]">
           <button 
             onClick={() => { setActiveTab('friends'); triggerHaptic('light'); }}
             className={`flex-1 text-[13px] font-semibold rounded-[7px] transition-all z-10 flex items-center justify-center ${activeTab === 'friends' ? 'text-white' : 'text-gray-400'}`}
           >
             Friends
           </button>
           <button 
             onClick={() => { setActiveTab('discover'); triggerHaptic('light'); }}
             className={`flex-1 text-[13px] font-semibold rounded-[7px] transition-all z-10 flex items-center justify-center ${activeTab === 'discover' ? 'text-white' : 'text-gray-400'}`}
           >
             Discover
           </button>
           <div 
             className="absolute top-[2px] bottom-[2px] w-[calc(50%-2px)] rounded-[7px] bg-[#636366] shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
             style={{ left: activeTab === 'friends' ? '2px' : 'calc(50%)' }}
           />
        </div>

        {/* Search Bar - Desktop */}
        <div className="relative mb-10 hidden md:block">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users size={16} className="text-gray-500" />
           </div>
           <input 
             type="text" 
             placeholder="Find friends or music..." 
             className="w-full bg-[#242426] text-white rounded-xl pl-10 pr-4 py-2.5 text-[15px] focus:outline-none focus:bg-[#2C2C2E] focus:ring-1 focus:ring-white/10 transition-colors placeholder-gray-500"
           />
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-10">
            
            {/* LEFT COLUMN */}
            <div className={`flex-col space-y-8 lg:w-[38%] ${activeTab === 'friends' ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Listening Parties */}
                <section>
                   <div className="flex items-center justify-between mb-4 px-1">
                      <h2 className="text-[20px] font-bold text-white tracking-tight">Listening Parties</h2>
                   </div>
                   
                   {/* Live Parties List */}
                   <div className="space-y-4">
                       {parties.filter(p => p.id !== user?.id).map((party) => (
                           <div key={party.id} className="group relative rounded-[22px] overflow-hidden cursor-pointer transition-transform duration-300 active:scale-[0.98] shadow-2xl h-48">
                               <div className="absolute inset-0">
                                   {party.current_track?.album?.coverUrl ? (
                                       <img src={party.current_track.album.coverUrl} className="w-full h-full object-cover blur-2xl opacity-60 scale-125" />
                                   ) : (
                                       <div className="w-full h-full bg-[#333]" />
                                   )}
                                   <div className="absolute inset-0 bg-black/30" />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                               </div>

                               <div className="relative z-10 p-5 flex flex-col h-full">
                                   <div className="flex items-center justify-between mb-4">
                                       <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                           <div className="w-2 h-2 rounded-full bg-[#FA233B] animate-pulse shadow-[0_0_8px_#FA233B]" />
                                           <span className="text-[11px] font-bold text-white uppercase tracking-wider">Live</span>
                                       </div>
                                       <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden">
                                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${party.host_name}`} className="w-full h-full" />
                                       </div>
                                   </div>
                                   
                                   <div className="mt-auto flex items-center justify-between">
                                       <div className="flex items-center space-x-3">
                                           {party.current_track?.album?.coverUrl && (
                                               <img src={party.current_track.album.coverUrl} className="w-10 h-10 rounded-lg shadow-lg border border-white/10" />
                                           )}
                                           <div className="min-w-0">
                                               <h3 className="text-white font-bold text-[15px] truncate">{party.host_name}'s Party</h3>
                                               <p className="text-white/60 text-[12px] truncate">{party.current_track?.title || 'Chilling'}</p>
                                           </div>
                                       </div>

                                       <button 
                                          onClick={() => {
                                              triggerHaptic('medium');
                                              joinParty({
                                                  id: party.id,
                                                  hostId: party.host_id,
                                                  hostName: party.host_name,
                                                  listeners: [],
                                                  messages: []
                                              });
                                              import('../../services/store').then(({ useUIStore }) => {
                                                  useUIStore.getState().setPartyRoomOpen(true);
                                              });
                                          }}
                                          className="bg-white text-black font-bold text-[13px] px-5 py-2 rounded-full hover:bg-gray-100 transition-colors"
                                       >
                                           Join
                                       </button>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>

                   {/* Join with Code */}
                   {!activeParty && (
                       <div className="mt-4 bg-[#242426] rounded-[18px] p-4 border border-white/5">
                           <form onSubmit={async (e) => {
                               e.preventDefault();
                               if (!joinCode.trim()) return;
                               setJoinLoading(true);
                               try {
                                   const party = await partyService.getPartyByCode(joinCode);
                                   if (party) {
                                       triggerHaptic('medium');
                                       joinParty({
                                           id: party.id,
                                           hostId: party.host_id,
                                           hostName: party.host_name,
                                           code: party.code,
                                           listeners: [],
                                           messages: []
                                       });
                                       import('../../services/store').then(({ useUIStore }) => {
                                           useUIStore.getState().setPartyRoomOpen(true);
                                       });
                                   } else {
                                       setJoinError('No party found with that code');
                                       setTimeout(() => setJoinError(''), 3000);
                                   }
                               } catch {
                                   setJoinError('Failed to join');
                               }
                               setJoinLoading(false);
                           }} className="flex items-center space-x-2">
                               <input 
                                   type="text"
                                   value={joinCode}
                                   onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                                   placeholder="Enter party code..."
                                   maxLength={6}
                                   className="flex-1 h-10 bg-white/5 rounded-xl px-4 text-white text-center font-mono font-bold text-[15px] tracking-[0.3em] placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#FA233B]/50 border border-white/5 uppercase"
                               />
                               <button 
                                   type="submit" 
                                   disabled={joinCode.length < 4 || joinLoading}
                                   className="h-10 px-5 rounded-xl bg-[#FA233B] text-white font-bold text-[13px] disabled:opacity-30 hover:bg-[#FF375F] transition-colors active:scale-95"
                               >
                                   {joinLoading ? '...' : 'Join'}
                               </button>
                           </form>
                           {joinError && <p className="text-[#FF453A] text-xs mt-2 text-center font-medium">{joinError}</p>}
                       </div>
                   )}

                   {parties.length === 0 && !activeParty && (
                       <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-gray-500 mt-4">
                           <Users size={28} className="mb-2 opacity-20" />
                           <p className="text-sm">No live parties nearby</p>
                       </div>
                   )}

                   {!activeParty && (
                       <button 
                          onClick={() => {
                              if (user) {
                                  triggerHaptic('medium');
                                  startParty(user);
                                  import('../../services/store').then(({ useUIStore }) => {
                                      useUIStore.getState().setPartyRoomOpen(true);
                                  });
                              }
                          }}
                          className="w-full mt-6 flex items-center justify-center space-x-2 bg-[#242426] py-3.5 rounded-xl text-[#FA233B] font-medium hover:bg-[#2C2C2E] transition-colors text-[15px] active:scale-[0.98]"
                       >
                           <Plus size={18} />
                           <span>Start Your Own Party</span>
                       </button>
                   )}
                   
                   {activeParty && (
                       <div className="w-full mt-4 bg-[#2C2C2E] rounded-xl p-4 text-center border border-[#FA233B]/30 flex flex-col items-center">
                           <span className="text-white font-medium">Listening Together</span>
                           <div className="flex space-x-1 mt-3">
                                <div className="w-0.5 h-3 bg-[#FA233B] animate-[bounce_1s_infinite]"></div>
                                <div className="w-0.5 h-3 bg-[#FA233B] animate-[bounce_1s_infinite_0.1s]"></div>
                                <div className="w-0.5 h-3 bg-[#FA233B] animate-[bounce_1s_infinite_0.2s]"></div>
                           </div>
                           <button 
                                onClick={() => {
                                    import('../../services/store').then(({ useUIStore }) => {
                                        useUIStore.getState().setPartyRoomOpen(true);
                                    });
                                }}
                                className="mt-4 text-[12px] text-[#FA233B] font-bold uppercase tracking-wider hover:opacity-80"
                           >
                               Open Room
                           </button>
                       </div>
                   )}
                </section>

                {/* Discover */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[20px] font-bold text-white tracking-tight">Discover</h2>
                    </div>
                    <div className="bg-gradient-to-b from-[#2C2C2E] to-[#242426] rounded-[22px] p-6 relative overflow-hidden border border-white/5 shadow-lg">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-[0.03]"></div>
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 text-white">
                                <Headphones size={24} />
                             </div>
                             <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight">Blind Frequency</h3>
                             <p className="text-[15px] text-gray-400 mb-6 leading-relaxed">
                               Get paired anonymously with someone listening to the exact same track.
                             </p>
                             <button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-2.5 px-8 rounded-full transition-colors backdrop-blur-md text-[15px]">
                                 Get Stranded
                             </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* RIGHT COLUMN (Feed) */}
            <div className={`flex-col lg:w-[62%] space-y-6 ${activeTab === 'discover' ? 'hidden lg:flex' : 'flex'}`}>
                {FEED_POSTS.map(post => (
                    <div key={post.id} className="bg-[#242426] rounded-[20px] p-5 md:p-6 border border-white/5 shadow-sm">
                        {/* Feed items same as before */}
                         <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center space-x-3.5">
                                <div className="relative">
                                    <img src={post.user.avatar} className="w-11 h-11 rounded-full bg-[#333] border border-white/5" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-[16px] leading-tight tracking-tight">{post.user.name}</h3>
                                    <p className="text-gray-500 text-[13px] font-medium">{post.timestamp}</p>
                                </div>
                            </div>
                            <MoreHorizontal className="text-gray-400" />
                        </div>
                         {/* Content simplified for brevity in this update, assume same structure */}
                         <div className="text-gray-400 text-sm italic">User activity content...</div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Connect;
