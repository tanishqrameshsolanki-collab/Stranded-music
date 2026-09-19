import React, { useEffect, useRef } from 'react';
import { Colors } from '../../types';
import { artworkUrl } from '../../services/api';

interface MeshGradientProps {
  colors?: Colors;
  className?: string;
  intensity?: number;
  isPlaying?: boolean;
  imageUrl?: string;
}

// Ambient backdrop. A CSS `filter: blur()` on a layer whose transform animates is
// re-rasterised every frame (measured 9 FPS in the full-screen player). Instead the
// blur is baked once into a tiny canvas, and only `transform` animates, so the
// rotation is pure compositor work.
const BLUR_SOURCE_PX = 24;
const BLUR_CANVAS_PX = 128;
const blurCache = new Map<string, HTMLCanvasElement>();

const bakeBlurredArtwork = (url: string): Promise<HTMLCanvasElement> => {
  const cached = blurCache.get(url);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // Downscale hard, then upscale with smoothing (+ a canvas blur where supported).
      const small = document.createElement('canvas');
      small.width = small.height = BLUR_SOURCE_PX;
      small.getContext('2d')!.drawImage(img, 0, 0, BLUR_SOURCE_PX, BLUR_SOURCE_PX);

      const out = document.createElement('canvas');
      out.width = out.height = BLUR_CANVAS_PX;
      const ctx = out.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if ('filter' in ctx) ctx.filter = 'blur(8px) saturate(160%)';
      ctx.drawImage(small, -12, -12, BLUR_CANVAS_PX + 24, BLUR_CANVAS_PX + 24);
      // Feather the edge so the rotating copy has no visible rim.
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'destination-in';
      const half = BLUR_CANVAS_PX / 2;
      const fade = ctx.createRadialGradient(half, half, half * 0.45, half, half, half);
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, BLUR_CANVAS_PX, BLUR_CANVAS_PX);
      ctx.globalCompositeOperation = 'source-over';

      if (blurCache.size > 24) blurCache.delete(blurCache.keys().next().value!);
      blurCache.set(url, out);
      resolve(out);
    };
    img.onerror = () => reject(new Error('artwork load failed'));
    img.src = url;
  });
};

const BlurredArtwork: React.FC<{ url: string; className?: string }> = ({ url, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    bakeBlurredArtwork(url).then((baked) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      canvas.width = canvas.height = BLUR_CANVAS_PX;
      canvas.getContext('2d')!.drawImage(baked, 0, 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [url]);
  return <canvas ref={canvasRef} aria-hidden="true" width={BLUR_CANVAS_PX} height={BLUR_CANVAS_PX} className={className} />;
};

const MeshGradient: React.FC<MeshGradientProps> = ({ colors, className = '', intensity = 1, isPlaying = true, imageUrl }) => {
  const ambient = artworkUrl(imageUrl, 60);
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none bg-[#050505] ${className}`}>

      {ambient ? (
        <div
           className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full min-w-[120vw] min-h-[120vh] transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-110' : 'scale-100'}`}
        >
           <BlurredArtwork
              url={ambient}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220vmax] h-[220vmax] opacity-70 will-change-transform"
           />
           {/* The "living" layer is a modest square blob, not a viewport-sized sheet: fill
               rate is what limits low-end GPUs when a huge layer rotates every frame. */}
           <BlurredArtwork
              url={ambient}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vmax] h-[70vmax] opacity-50 rounded-full will-change-transform motion-reduce:animate-none ${isPlaying ? 'animate-[spin_50s_linear_infinite]' : ''}`}
           />
        </div>
      ) : colors ? (
        <>
          {/* Radial gradients give the blurred-blob look without a per-frame filter pass. */}
          <div
            className={`absolute top-[-50%] left-[-50%] w-[150%] h-[150%] rounded-full opacity-60 mix-blend-screen will-change-transform motion-reduce:animate-none transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-110' : 'scale-100'}`}
            style={{
              background: `radial-gradient(circle at center, ${colors.primary} 0%, transparent 70%)`,
              animation: 'aurora-1 20s infinite alternate ease-in-out'
            }}
          />
          <div
            className={`absolute top-[20%] right-[-20%] w-[120%] h-[120%] rounded-full opacity-50 mix-blend-screen will-change-transform motion-reduce:animate-none transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-110' : 'scale-100'}`}
            style={{
              background: `radial-gradient(circle at center, ${colors.secondary} 0%, transparent 70%)`,
              animation: 'aurora-2 25s infinite alternate ease-in-out'
            }}
          />
           <div
            className={`absolute bottom-[-20%] left-[20%] w-[100%] h-[100%] rounded-full opacity-40 mix-blend-screen will-change-transform motion-reduce:animate-none transition-transform duration-[4000ms] ease-in-out ${isPlaying ? 'scale-125' : 'scale-100'}`}
            style={{
              background: `radial-gradient(circle at center, ${colors.tertiary} 0%, transparent 70%)`,
              animation: 'aurora-1 30s infinite alternate-reverse ease-in-out'
            }}
          />
        </>
      ) : null}

      {/* Dim overlay; intensity tweaks opacity. A plain tint avoids a full-viewport backdrop-filter. */}
      <div
         className="absolute inset-0"
         style={{ backgroundColor: `rgba(0, 0, 0, ${Math.min(0.85, 0.4 * (1 / intensity))})` }}
      />
    </div>
  );
};

export default MeshGradient;
