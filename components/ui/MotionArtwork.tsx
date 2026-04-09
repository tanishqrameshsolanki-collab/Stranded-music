import React from 'react';

interface MotionArtworkProps {
  coverUrl: string;
  motionUrl?: string;
  isPlaying: boolean;
  className?: string;
}

const MotionArtwork: React.FC<MotionArtworkProps> = ({ coverUrl, motionUrl, isPlaying, className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className} shadow-2xl`}>
      <img 
        src={coverUrl} 
        alt="Album Art" 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isPlaying && motionUrl ? 'opacity-0' : 'opacity-100'}`}
      />
      {motionUrl && (
        <video
          src={motionUrl}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {/* Gloss overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
    </div>
  );
};

export default MotionArtwork;