import React, { useRef, useEffect, useState, useCallback } from 'react';

interface YouTubeAudioPlayerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  seekTo?: number;
  onProgress: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onError?: () => void;
}

// Declare the YT types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiLoaded && window.YT?.Player) {
      resolve();
      return;
    }

    ytApiCallbacks.push(resolve);

    if (ytApiLoading) return;
    ytApiLoading = true;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiCallbacks.forEach(cb => cb());
      ytApiCallbacks.length = 0;
    };
  });
}

const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
  videoId,
  isPlaying,
  volume,
  seekTo,
  onProgress,
  onEnded,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const currentVideoRef = useRef<string>('');
  const [ready, setReady] = useState(false);
  const targetSeekRef = useRef<number | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const seekTimeoutRef = useRef<number | null>(null);

  // Preload API on mount
  useEffect(() => {
    loadYTApi();
  }, []);


  // Progress tracking
  const startProgressTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (isSeekingRef.current) return; // Pause updates while seeking
      
      if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
        const ct = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        if (dur > 0) {
          onProgress(ct, dur);
        }
      }
    }, 250);
  }, [onProgress]);


  const stopProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initialize YT player
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await loadYTApi();
      if (cancelled) return;

      // If videoId was cleared, just stop the video to keep iframe warm
      if (!videoId) {
        if (playerRef.current?.stopVideo) {
           try { playerRef.current.stopVideo(); } catch(e) {}
        }
        currentVideoRef.current = '';
        return;
      }

      // If player already exists and video changed, load new video
      if (playerRef.current && currentVideoRef.current !== videoId) {
        currentVideoRef.current = videoId;
        playerRef.current.loadVideoById(videoId);
        return;
      }

      // If player already exists and same video, skip
      if (playerRef.current && currentVideoRef.current === videoId) return;

      // Create new player
      if (!containerRef.current) return;

      // Create a div for the player
      const div = document.createElement('div');
      div.id = 'yt-player-' + Date.now();
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(div);

      currentVideoRef.current = videoId;

      playerRef.current = new window.YT.Player(div.id, {
        height: '200',
        width: '320',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            if (cancelled) return;
            setReady(true);
            event.target.setVolume(volume * 100);
            
            // If we have a pending seek, apply it now
            if (targetSeekRef.current !== null) {
                event.target.seekTo(targetSeekRef.current, true);
                targetSeekRef.current = null;
            }

            if (isPlaying) {
              event.target.playVideo();
            }
            startProgressTracking();
          },

          onStateChange: (event: any) => {
            if (cancelled) return;
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              stopProgressTracking();
              onEnded();
            }
            // YT.PlayerState.PLAYING = 1
            if (event.data === 1) {
              startProgressTracking();
            }
          },
          onError: (event: any) => {
            console.warn('YouTube Player Error:', event.data);
            if (onError) onError();
          }
        }
      });
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [videoId]); // Only re-init when videoId changes

  // Handle play/pause
  useEffect(() => {
    if (!playerRef.current?.getPlayerState) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
        startProgressTracking();
      } else {
        playerRef.current.pauseVideo();
        stopProgressTracking();
      }
    } catch (e) {
      // Player might not be ready yet
    }
  }, [isPlaying, ready]);

  // Handle volume
  useEffect(() => {
    if (!playerRef.current?.setVolume) return;
    try {
      playerRef.current.setVolume(volume * 100);
    } catch (e) {}
  }, [volume]);

  // Handle seek
  useEffect(() => {
    if (seekTo !== undefined && seekTo !== null) {
      if (playerRef.current?.seekTo && ready) {
        try {
          isSeekingRef.current = true;
          playerRef.current.seekTo(seekTo, true);
          targetSeekRef.current = null;
          
          if (seekTimeoutRef.current) window.clearTimeout(seekTimeoutRef.current);
          seekTimeoutRef.current = window.setTimeout(() => {
              isSeekingRef.current = false;
          }, 800); // 800ms pause to let YouTube buffer and report new time
        } catch (e) {}
      } else {
        // Player not ready yet, store for later
        targetSeekRef.current = seekTo;
      }
    }
  }, [seekTo, ready]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (seekTimeoutRef.current) window.clearTimeout(seekTimeoutRef.current);
      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, []);

  return (

    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '-2000px',
        left: '-2000px',
        width: '320px',
        height: '200px',
        opacity: 0.01,
        pointerEvents: 'none',
        zIndex: -1
      }}
    />
  );
};

export default YouTubeAudioPlayer;
