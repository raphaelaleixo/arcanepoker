import { useEffect } from 'react';
import { useAudioPreferences } from '../store/AudioPreferencesContext';

export function useBackgroundMusic(src: string): void {
  const { musicEnabled } = useAudioPreferences();

  useEffect(() => {
    if (!musicEnabled) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;

    const tryPlay = () => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked (e.g. page reload with no prior gesture) —
          // wait for the first user interaction and retry.
          const unlock = () => {
            audio.play().catch(() => {});
          };
          document.addEventListener('click', unlock, { once: true });
          document.addEventListener('keydown', unlock, { once: true });
        });
      }
    };

    tryPlay();

    return () => {
      audio.pause();
    };
  }, [src, musicEnabled]);
}
