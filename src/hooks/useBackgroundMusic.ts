import { useEffect, useRef } from 'react';
import { useAudioPreferences } from '../store/AudioPreferencesContext';

export function useBackgroundMusic(src: string): void {
  const { musicEnabled } = useAudioPreferences();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    if (musicEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — no-op
        });
      }
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [musicEnabled]);
}
