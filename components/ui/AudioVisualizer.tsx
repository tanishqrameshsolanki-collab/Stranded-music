
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  color: string;
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, color, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const barCount = 40;
    const barWidth = canvas.width / barCount;
    const bars: number[] = new Array(barCount).fill(0);
    
    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Determine bar height based on playing state
      bars.forEach((height, i) => {
        let targetHeight = 0;
        
        if (isPlaying) {
            // Create a wave-like pattern + random noise
            const time = Date.now() / 300;
            const wave = Math.sin(i * 0.2 + time) * 0.5 + 0.5;
            const noise = Math.random() * 0.3;
            targetHeight = (wave + noise) * canvas.height * 0.6;
        } else {
            targetHeight = 0; // Fix: Set to 0 to remove dashed line artifact when paused
        }

        // Smooth interpolation
        bars[i] += (targetHeight - bars[i]) * 0.1;

        // Draw Bar
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        
        // Rounded caps calculation
        const x = i * barWidth;
        const y = canvas.height - bars[i];
        const h = bars[i];
        const w = barWidth - 2; // gap

        // Only draw if visible to avoid artifacts
        if (h > 0.5) {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 4);
            ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, color]);

  return (
    <canvas 
        ref={canvasRef} 
        width={300} 
        height={100} 
        className={`${className}`}
    />
  );
};

export default AudioVisualizer;
