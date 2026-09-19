// Imperative wrapper around the hidden YouTube IFrame player. Lives outside React so
// playback never depends on component lifecycles or re-renders.

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface Handlers {
  onProgress: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onError: () => void;
  onStateChange: (playing: boolean) => void;
}

const PROGRESS_INTERVAL_MS = 250;
const SEEK_SETTLE_MS = 800;

let apiPromise: Promise<void> | null = null;
let player: any = null;
let playerReady = false;
let container: HTMLDivElement | null = null;
let handlers: Handlers | null = null;
let progressTimer: number | null = null;
let seekSettleTimer: number | null = null;
let seeking = false;
let currentVideoId = '';
let constructedVideoId = '';
let pendingVolume = 0.8;
let pendingSeek: number | null = null;
let pendingAutoplay = false;
let loadToken = 0;

const loadApi = (): Promise<void> => {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  });
  return apiPromise;
};

const ensureContainer = () => {
  if (container) return container;
  container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, {
    position: 'fixed', top: '-2000px', left: '-2000px', width: '320px', height: '200px',
    opacity: '0.01', pointerEvents: 'none', zIndex: '-1',
  } as CSSStyleDeclaration);
  document.body.appendChild(container);
  return container;
};

const stopProgress = () => {
  if (progressTimer !== null) { window.clearInterval(progressTimer); progressTimer = null; }
};

const startProgress = () => {
  stopProgress();
  progressTimer = window.setInterval(() => {
    if (seeking || !player?.getCurrentTime || document.hidden) return;
    const dur = player.getDuration?.() || 0;
    if (dur > 0) handlers?.onProgress(player.getCurrentTime() || 0, dur);
  }, PROGRESS_INTERVAL_MS);
};

// Progress ticks are only for the visible scrubber; catch up once the tab is visible again.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && player?.getPlayerState?.() === 1) {
      const dur = player.getDuration?.() || 0;
      if (dur > 0) handlers?.onProgress(player.getCurrentTime() || 0, dur);
    }
  });
}

const applyPending = () => {
  if (!player) return;
  try {
    player.setVolume(Math.round(pendingVolume * 100));
    if (pendingSeek !== null) { player.seekTo(pendingSeek, true); pendingSeek = null; }
    if (pendingAutoplay) player.playVideo();
  } catch {}
};

const createPlayer = async (videoId: string, token: number) => {
  await loadApi();
  if (token !== loadToken) return;
  const host = ensureContainer();
  const div = document.createElement('div');
  host.replaceChildren(div);
  constructedVideoId = videoId;

  player = new window.YT.Player(div, {
    height: '200',
    width: '320',
    videoId,
    playerVars: {
      autoplay: pendingAutoplay ? 1 : 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3,
      modestbranding: 1, rel: 0, playsinline: 1, origin: window.location.origin,
    },
    events: {
      onReady: () => {
        playerReady = true;
        // The track may have changed while the iframe API was still bootstrapping.
        if (currentVideoId && currentVideoId !== constructedVideoId) {
          try { pendingAutoplay ? player.loadVideoById(currentVideoId) : player.cueVideoById(currentVideoId); } catch {}
        }
        applyPending();
      },
      onStateChange: (event: any) => {
        // YT.PlayerState: ENDED=0 PLAYING=1 PAUSED=2 BUFFERING=3
        if (event.data === 1) { startProgress(); handlers?.onStateChange(true); }
        else if (event.data === 2) { stopProgress(); handlers?.onStateChange(false); }
        else if (event.data === 0) { stopProgress(); handlers?.onEnded(); }
      },
      onError: (event: any) => {
        console.warn('YouTube Player Error:', event.data);
        handlers?.onError();
      },
    },
  });
};

export const youtubeEngine = {
  setHandlers: (h: Handlers) => { handlers = h; },

  load: (videoId: string, opts: { autoplay: boolean; volume: number }) => {
    const token = ++loadToken;
    pendingVolume = opts.volume;
    pendingAutoplay = opts.autoplay;
    pendingSeek = null;
    seeking = false;
    if (player && playerReady) {
      if (currentVideoId !== videoId) {
        currentVideoId = videoId;
        try { opts.autoplay ? player.loadVideoById(videoId) : player.cueVideoById(videoId); } catch {}
      } else if (opts.autoplay) {
        try { player.seekTo(0, true); player.playVideo(); } catch {}
      }
      try { player.setVolume(Math.round(opts.volume * 100)); } catch {}
      return;
    }
    currentVideoId = videoId;
    if (!player) createPlayer(videoId, token);
  },

  play: () => { if (!player) return; playerReady ? player.playVideo?.() : (pendingAutoplay = true); },
  pause: () => { pendingAutoplay = false; if (playerReady) try { player?.pauseVideo?.(); } catch {} },

  // Keep the iframe warm; a stopped player resumes far faster than a fresh one.
  stop: () => {
    stopProgress();
    pendingAutoplay = false;
    if (playerReady && currentVideoId) { try { player?.stopVideo?.(); } catch {} }
    currentVideoId = '';
  },

  seek: (seconds: number) => {
    if (!playerReady) { pendingSeek = seconds; return; }
    seeking = true;
    try { player.seekTo(seconds, true); } catch {}
    if (seekSettleTimer !== null) window.clearTimeout(seekSettleTimer);
    seekSettleTimer = window.setTimeout(() => { seeking = false; seekSettleTimer = null; }, SEEK_SETTLE_MS);
  },

  setVolume: (value: number) => {
    pendingVolume = value;
    if (playerReady) try { player?.setVolume?.(Math.round(value * 100)); } catch {}
  },

  destroy: () => {
    stopProgress();
    if (seekSettleTimer !== null) { window.clearTimeout(seekSettleTimer); seekSettleTimer = null; }
    try { player?.destroy?.(); } catch {}
    player = null; playerReady = false; currentVideoId = '';
    container?.remove(); container = null;
  },
};
