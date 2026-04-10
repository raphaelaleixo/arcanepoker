import { useEffect } from 'react';

export function useBackgroundMusic(src: string): void {
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — no-op, music silently skipped
      });
    }
    return () => {
      audio.pause();
    };
  }, [src]);
}
