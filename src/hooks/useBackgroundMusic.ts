import { useEffect, useRef } from "react";
import { useSettings } from "../store/SettingsContext";

export function useBackgroundMusic(src: string): void {
  const { musicEnabled } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }
    const audio = audioRef.current;

    if (!musicEnabled) {
      audio.pause();
      return;
    }

    let cancelled = false;
    const unlockFns: (() => void)[] = [];

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (cancelled) return;
        const unlock = () => {
          if (!cancelled) audio.play().catch(() => {});
        };
        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("keydown", unlock, { once: true });
        unlockFns.push(
          () => document.removeEventListener("click", unlock),
          () => document.removeEventListener("keydown", unlock),
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
