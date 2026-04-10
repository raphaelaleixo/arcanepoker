import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AudioPreferences {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
}

const AudioPreferencesContext = createContext<AudioPreferences | null>(null);

export function AudioPreferencesProvider({ children }: { children: ReactNode }) {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  return (
    <AudioPreferencesContext.Provider
      value={{
        musicEnabled,
        sfxEnabled,
        toggleMusic: () => setMusicEnabled((v) => !v),
        toggleSfx: () => setSfxEnabled((v) => !v),
      }}
    >
      {children}
    </AudioPreferencesContext.Provider>
  );
}

export function useAudioPreferences(): AudioPreferences {
  const ctx = useContext(AudioPreferencesContext);
  if (!ctx) throw new Error("useAudioPreferences must be used inside <AudioPreferencesProvider>");
  return ctx;
}
