import React from 'react';
import { Colors } from '../../types';

interface MeshGradientProps {
  colors?: Colors;
  className?: string;
  intensity?: number;
  isPlaying?: boolean;
  imageUrl?: string;
}

const MeshGradient: React.FC<MeshGradientProps> = ({ colors, className = '', intensity = 1, isPlaying = true, imageUrl }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none bg-[#050505] ${className}`}>
      
      {imageUrl ? (
        <div 
           className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full min-w-[120vw] min-h-[120vh] transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-110' : 'scale-100'}`}
        >
           {/* Primary Blurry Artwork Layer */}
           <img 
              src={imageUrl} 
              className="absolute inset-0 w-full h-full object-cover blur-[140px] opacity-60 saturate-[150%]"
           />
           {/* Secondary rotating layer for "Living" feel */}
           <img 
              src={imageUrl} 
              className={`absolute top-[-20%] left-[-20%] w-[140%] h-[140%] object-cover blur-[160px] opacity-40 saturate-200 ${isPlaying ? 'animate-[spin_50s_linear_infinite]' : ''}`}
           />
        </div>
      ) : colors ? (
        <>
          <div 
            className={`absolute top-[-50%] left-[-50%] w-[150%] h-[150%] rounded-full opacity-60 mix-blend-screen blur-[120px] transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-110' : 'scale-100'}`}
            style={{ 
              backgroundColor: colors.primary,
              animation: 'aurora-1 20s infinite alternate ease-in-out'
            }}
          />
          <div 
            className={`absolute top-[20%] right-[-20%] w-[120%] h-[120%] rounded-full opacity-50 mix-blend-screen blur-[100px] transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-110' : 'scale-100'}`}
            style={{ 
              backgroundColor: colors.secondary,
              animation: 'aurora-2 25s infinite alternate ease-in-out'
            }}
          />
           <div 
            className={`absolute bottom-[-20%] left-[20%] w-[100%] h-[100%] rounded-full opacity-40 mix-blend-screen blur-[80px] transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-125' : 'scale-100'}`}
            style={{ 
              backgroundColor: colors.tertiary,
              animation: 'aurora-1 30s infinite alternate-reverse ease-in-out'
            }}
          />
        </>
      ) : null}

      {/* Heavy liquid overlay mapping iOS exact values. Intensity tweaks opacity */}
      <div 
         className="absolute inset-0 backdrop-saturate-[200%] backdrop-blur-[60px]" 
         style={{ backgroundColor: `rgba(0, 0, 0, ${0.4 * (1 / intensity)})` }}
      />
    </div>
  );
};

export default MeshGradient;