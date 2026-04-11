import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface Settings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  language: "en" | "pt-br";
  devMode: boolean;
  playedTutorial: boolean;
}

interface SettingsContextValue extends Settings {
  toggleMusic: () => void;
  toggleSfx: () => void;
  setLanguage: (lang: "en" | "pt-br") => void;
  toggleDevMode: () => void;
  togglePlayedTutorial: () => void;
  setPlayedTutorial: (val: boolean) => void;
}

const STORAGE_KEY = "arcane-poker-settings";

const DEFAULTS: Settings = {
  musicEnabled: true,
  sfxEnabled: true,
  language: "en",
  devMode: false,
  playedTutorial: false,
};

const VALID_LANGUAGES: ReadonlySet<string> = new Set(["en", "pt-br"]);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;

    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang && VALID_LANGUAGES.has(urlLang)) {
      base.language = urlLang as Settings["language"];
    }

    return base;
  } catch {
    return DEFAULTS;
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value: SettingsContextValue = {
    ...settings,
    toggleMusic: () =>
      setSettings((s) => ({ ...s, musicEnabled: !s.musicEnabled })),
    toggleSfx: () =>
      setSettings((s) => ({ ...s, sfxEnabled: !s.sfxEnabled })),
    setLanguage: (language) => setSettings((s) => ({ ...s, language })),
    toggleDevMode: () =>
      setSettings((s) => ({ ...s, devMode: !s.devMode })),
    togglePlayedTutorial: () =>
      setSettings((s) => ({ ...s, playedTutorial: !s.playedTutorial })),
    setPlayedTutorial: (val: boolean) =>
      setSettings((s) => ({ ...s, playedTutorial: val })),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
