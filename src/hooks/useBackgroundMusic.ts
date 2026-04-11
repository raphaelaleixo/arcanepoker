import { useEffect } from 'react';
import { useSettings } from '../store/SettingsContext';

export function useBackgroundMusic(src: string): void {
  const { musicEnabled } = useSettings();

  useEffect(() => {
    if (!musicEnabled) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;

    let cancelled = false;
    const unlockFns: (() => void)[] = [];

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (cancelled) return;
        // Autoplay blocked — wait for first user gesture and retry
        const unlock = () => {
          if (!cancelled) audio.play().catch(() => {});
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
        unlockFns.push(
          () => document.removeEventListener('click', unlock),
          () => document.removeEventListener('keydown', unlock),
        );
      });
    }

    return () => {
      cancelled = true;
      audio.pause();
      unlockFns.forEach((fn) => fn());
    };
  }, [src, musicEnabled]);
}
