import { useSyncExternalStore } from 'react';

// High-frequency playback position lives outside zustand so ~4 updates/sec never
// re-render the app tree. Only the few widgets that draw a scrubber subscribe.
export interface Progress {
  currentTime: number;
  duration: number;
}

let progress: Progress = { currentTime: 0, duration: 0 };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const progressStore = {
  get: (): Progress => progress,
  set: (currentTime: number, duration: number) => {
    const dur = Number.isFinite(duration) ? duration : 0;
    if (progress.currentTime === currentTime && progress.duration === dur) return;
    progress = { currentTime, duration: dur };
    emit();
  },
  reset: () => progressStore.set(0, 0),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

export const useProgress = (): Progress =>
  useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.get);
