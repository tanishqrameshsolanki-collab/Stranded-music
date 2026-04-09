
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Heart, Send, Users, Play, Pause, SkipForward, SkipBack, MoreHorizontal, ChevronDown, Copy } from 'lucide-react';
import { Track, PartySession } from '../../types';
import MeshGradient from '../ui/MeshGradient';
import MotionArtwork from '../ui/MotionArtwork';
import { formatTime } from '../../utils';

interface PartyRoomProps {
  session: PartySession;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isHost: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSendMessage: (text: string) => void;
}

const PartyRoom: React.FC<PartyRoomProps> = ({ 
  session, track, isPlaying, currentTime, duration, isHost, onClose, onTogglePlay, onSeek, onSendMessage 
}) => {
  const [inputText, setInputText] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [session.messages]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (inputText.trim()) {
          onSendMessage(inputText);
          setInputText('');
      }
  };

  if (!track || !track.album) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
      className="fixed inset-0 z-[110] bg-[#0a0a0a] flex flex-col overflow-hidden font-sans"
    >
        {/* Dynamic Background — use album art for rich blurred ambient */}
        <MeshGradient colors={track.album.colors} imageUrl={track.album.coverUrl} intensity={0.8} isPlaying={isPlaying} className="opacity-70" />
        
        {/* Top Header */}
        <div className="relative z-20 flex items-center justify-between px-5 md:px-8 pt-5 pb-3 flex-shrink-0">
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors border border-white/5"
            >
                <ChevronDown size={18} strokeWidth={2.5} />
            </button>
            
            <div className="flex flex-col items-center">
                <div className="flex items-center space-x-2 mb-0.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FF2D55] animate-pulse shadow-[0_0_8px_#FF2D55]" />
                     <span className="text-[10px] font-bold text-[#FF2D55] tracking-[0.15em] uppercase">Live Party</span>
                </div>
                {session.code ? (
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(session.code!);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mt-1 hover:bg-white/20 transition-colors"
                    >
                        <span className="text-white/90 text-[13px] font-bold tracking-[0.25em] font-mono">{session.code}</span>
                        <Copy size={12} className={`transition-colors ${copied ? 'text-green-400' : 'text-white/40'}`} />
                    </button>
                ) : (
                    <span className="text-white/70 text-[12px] font-medium tracking-tight">{session.hostName}'s Party</span>
                )}
            </div>
            
            <button 
                onClick={() => {
                    if (session.code) {
                        navigator.clipboard.writeText(session.code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    } else {
                        const url = `${window.location.origin}${window.location.pathname}?partyId=${session.id}`;
                        navigator.clipboard.writeText(url);
                    }
                }}
                className="px-4 h-8 rounded-full bg-[#FF2D55] text-white text-[11px] font-bold hover:bg-[#FF375F] transition-colors shadow-lg shadow-[#FF2D55]/20 tracking-wide uppercase"
            >
                {copied ? 'Copied!' : 'Share'}
            </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 relative z-10 flex flex-col md:flex-row items-stretch w-full max-w-6xl mx-auto px-4 md:px-8 pb-safe gap-4 md:gap-8 min-h-0">
            
            {/* LEFT: Player Area — Glassmorphic Card */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8 md:bg-white/5 md:backdrop-blur-3xl md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex-shrink-0">
                {/* Album Art */}
                <div className="w-full max-w-[200px] md:max-w-[320px] aspect-square rounded-[20px] md:rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden mb-5 md:mb-6 relative group bg-[#222]">
                    <MotionArtwork coverUrl={track.album.coverUrl} isPlaying={isPlaying} className="w-full h-full" />
                    
                    {/* Listener Avatar Bubbles */}
                    <div className="absolute top-3 right-3 flex -space-x-2 p-1 rounded-full backdrop-blur-md bg-black/20 border border-white/10">
                        {session.listeners.slice(0, 4).map((u, i) => (
                            <img key={i} src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-6 h-6 md:w-7 md:h-7 rounded-full border border-white/20" alt={u.name} />
                        ))}
                        {session.listeners.length > 4 && (
                            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black/40 flex items-center justify-center text-[10px] text-white font-bold border border-white/20">
                                +{session.listeners.length - 4}
                            </div>
                        )}
                    </div>
                </div>

                {/* Track Details */}
                <div className="w-full max-w-[320px] text-center mb-4">
                    <h1 className="text-xl md:text-2xl font-bold text-white mb-0.5 truncate leading-tight tracking-tight drop-shadow-md">{track.title}</h1>
                    <p className="text-sm md:text-base text-white/60 font-medium truncate drop-shadow-sm">{track.artist.name}</p>
                </div>

                {/* Scrubber */}
                <div className="w-full max-w-[320px] mb-4 md:mb-6">
                     <div className="relative h-[4px] w-full bg-white/20 rounded-full overflow-hidden mb-1.5 backdrop-blur-sm shadow-inner">
                        <div 
                            className="absolute top-0 left-0 h-full bg-white/80 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                         {isHost && (
                            <input 
                                type="range" 
                                min={0} 
                                max={duration || 100} 
                                value={currentTime}
                                onChange={(e) => onSeek(Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        )}
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-white/40 tracking-wide">
                        <span>{formatTime(currentTime)}</span>
                        <span>-{formatTime(duration - currentTime)}</span>
                    </div>
                </div>

                {/* Transport Controls */}
                <div className="w-full max-w-[320px] flex items-center justify-center space-x-10 md:space-x-12 mb-2">
                     <button 
                        className={`text-white/70 hover:text-white transition-colors active:scale-95 ${!isHost && 'opacity-30 cursor-not-allowed'}`} 
                        disabled={!isHost}
                    >
                        <SkipBack size={28} fill="currentColor" />
                    </button>
                    
                    <button 
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/15 backdrop-blur-3xl flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all shadow-lg border border-white/10 ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                        onClick={onTogglePlay}
                        disabled={!isHost}
                    >
                        {isPlaying ? (
                            <Pause size={28} fill="white" className="text-white" />
                        ) : (
                            <Play size={28} fill="white" className="text-white ml-1" />
                        )}
                    </button>
                    
                    <button 
                        className={`text-white/70 hover:text-white transition-colors active:scale-95 ${!isHost && 'opacity-30 cursor-not-allowed'}`} 
                        disabled={!isHost}
                    >
                        <SkipForward size={28} fill="currentColor" />
                    </button>
                </div>
            </div>

            {/* RIGHT: Chat Panel — Always Visible */}
            <div className="flex flex-col w-full md:w-1/2 flex-1 min-h-0 bg-white/5 backdrop-blur-3xl rounded-t-[28px] md:rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
                <div className="h-12 md:h-14 border-b border-white/5 flex items-center justify-between px-5 flex-shrink-0 bg-white/5">
                    <div className="flex items-center space-x-2">
                        <MessageCircle size={16} className="text-white/80" />
                        <span className="font-semibold text-[14px] text-white/90">Party Chat</span>
                    </div>
                    <div className="flex items-center text-white/40 text-xs font-medium">
                        <Users size={11} className="mr-1.5" />
                        <span>{session.listeners.length} online</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 no-scrollbar">
                     {session.messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-white/20">
                            <MessageCircle size={36} strokeWidth={1} className="mb-2" />
                            <p className="text-sm">Start the conversation...</p>
                        </div>
                    )}
                    {session.messages.map((msg) => {
                        const isMe = msg.user.id === 'me' || (session.hostId === 'me' && msg.user.id === session.hostId);
                        return (
                            <div key={msg.id} className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {!isMe && (
                                    <img src={msg.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user.name}`} className="w-6 h-6 rounded-full bg-gray-600 flex-shrink-0" />
                                )}
                                <div className={`px-3.5 py-2 rounded-[18px] text-[13px] leading-snug max-w-[80%] ${
                                    isMe ? 'bg-[#FF2D55] text-white' : 'bg-white/10 text-white/90 backdrop-blur-md'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-black/20 backdrop-blur-md flex items-center space-x-2 flex-shrink-0">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Say something..."
                        className="flex-1 h-9 bg-white/10 hover:bg-white/15 focus:bg-white/15 rounded-full px-4 text-white placeholder-white/30 text-sm focus:outline-none transition-colors border border-white/5"
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            inputText.trim() ? 'bg-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/20' : 'bg-transparent text-white/20'
                        }`}
                    >
                        <Send size={15} fill="currentColor" />
                    </button>
                </form>
            </div>
        </div>
    </motion.div>
  );
};

export default PartyRoom;
