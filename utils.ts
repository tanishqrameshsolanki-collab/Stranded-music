export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (style) {
      case 'light': navigator.vibrate(5); break;
      case 'medium': navigator.vibrate(10); break;
      case 'heavy': navigator.vibrate(20); break;
    }
  }
};