# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/settings` page with sound, language, dev mode toggles, and credits — all persisted to localStorage via a unified SettingsContext.

**Architecture:** A single `SettingsContext` replaces the existing `AudioPreferencesContext`, adding `language` and `devMode` fields alongside the existing `musicEnabled`/`sfxEnabled`. All values are persisted to localStorage under one key. The settings page is a new route using standard MUI components. The PlaygroundDrawer DEV button in PokerTable becomes gated behind `devMode`.

**Tech Stack:** React 18, TypeScript, MUI v5, localStorage

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/store/SettingsContext.tsx` | Create | Unified settings context + provider + hook, replaces AudioPreferencesContext |
| `src/store/AudioPreferencesContext.tsx` | Delete | Replaced by SettingsContext |
| `src/pages/SettingsPage.tsx` | Create | Settings UI page |
| `src/App.tsx` | Modify | Add `/settings` route |
| `src/main.tsx` | Modify | Swap AudioPreferencesProvider → SettingsProvider |
| `src/hooks/useBackgroundMusic.ts` | Modify | Update import to useSettings |
| `src/hooks/useGameSounds.ts` | Modify | Update import to useSettings |
| `src/components/Dev/PlaygroundDrawer.tsx` | Modify | Update import to useSettings |
| `src/components/Table/PokerTable.tsx` | Modify | Gate DEV button behind devMode |

---

## Chunk 1: SettingsContext

### Task 1: Create SettingsContext

**Files:**
- Create: `src/store/SettingsContext.tsx`

- [ ] **Step 1: Create SettingsContext with localStorage persistence**

```tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface Settings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  language: "en" | "pt-br";
  devMode: boolean;
}

interface SettingsContextValue extends Settings {
  toggleMusic: () => void;
  toggleSfx: () => void;
  setLanguage: (lang: "en" | "pt-br") => void;
  toggleDevMode: () => void;
}

const STORAGE_KEY = "arcane-poker-settings";

const DEFAULTS: Settings = {
  musicEnabled: true,
  sfxEnabled: true,
  language: "en",
  devMode: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
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
```

- [ ] **Step 2: Commit**

```bash
git add src/store/SettingsContext.tsx
git commit -m "feat: add SettingsContext with localStorage persistence"
```

---

### Task 2: Migrate off AudioPreferencesContext

**Files:**
- Delete: `src/store/AudioPreferencesContext.tsx`
- Modify: `src/main.tsx`
- Modify: `src/hooks/useBackgroundMusic.ts`
- Modify: `src/hooks/useGameSounds.ts`
- Modify: `src/components/Dev/PlaygroundDrawer.tsx`

- [ ] **Step 1: Update main.tsx — swap provider**

Replace:
```tsx
import { AudioPreferencesProvider } from "./store/AudioPreferencesContext";
```
With:
```tsx
import { SettingsProvider } from "./store/SettingsContext";
```

Replace:
```tsx
<AudioPreferencesProvider>
  <App />
</AudioPreferencesProvider>
```
With:
```tsx
<SettingsProvider>
  <App />
</SettingsProvider>
```

- [ ] **Step 2: Update useBackgroundMusic.ts**

Replace:
```ts
import { useAudioPreferences } from '../store/AudioPreferencesContext';
```
With:
```ts
import { useSettings } from '../store/SettingsContext';
```

Replace:
```ts
const { musicEnabled } = useAudioPreferences();
```
With:
```ts
const { musicEnabled } = useSettings();
```

- [ ] **Step 3: Update useGameSounds.ts**

Replace:
```ts
import { useAudioPreferences } from "../store/AudioPreferencesContext";
```
With:
```ts
import { useSettings } from "../store/SettingsContext";
```

Replace:
```ts
const { sfxEnabled } = useAudioPreferences();
```
With:
```ts
const { sfxEnabled } = useSettings();
```

- [ ] **Step 4: Update PlaygroundDrawer.tsx**

Replace:
```ts
import { useAudioPreferences } from "../../store/AudioPreferencesContext";
```
With:
```ts
import { useSettings } from "../../store/SettingsContext";
```

Replace:
```ts
const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useAudioPreferences();
```
With:
```ts
const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useSettings();
```

- [ ] **Step 5: Delete AudioPreferencesContext.tsx**

```bash
rm src/store/AudioPreferencesContext.tsx
```

- [ ] **Step 6: Verify build compiles**

Run: `npm run build`
Expected: Clean build with no errors

- [ ] **Step 7: Run tests**

Run: `npm run test`
Expected: All existing tests pass

- [ ] **Step 8: Commit**

```bash
git add src/main.tsx src/hooks/useBackgroundMusic.ts src/hooks/useGameSounds.ts src/components/Dev/PlaygroundDrawer.tsx
git rm src/store/AudioPreferencesContext.tsx
git commit -m "refactor: replace AudioPreferencesContext with unified SettingsContext"
```

---

## Chunk 2: Settings Page + Route

### Task 3: Create SettingsPage

**Files:**
- Create: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Create the SettingsPage component**

```tsx
import {
  Box,
  Divider,
  Link,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useSettings } from "../store/SettingsContext";

export function SettingsPage() {
  const {
    musicEnabled,
    sfxEnabled,
    language,
    devMode,
    toggleMusic,
    toggleSfx,
    setLanguage,
    toggleDevMode,
  } = useSettings();

  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: "auto",
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: "Young Serif, serif",
          color: "gold.light",
          mb: 3,
        }}
      >
        Settings
      </Typography>

      {/* Sound */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Sound
      </Typography>
      <Stack useFlexGap spacing={0}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Music
          </Typography>
          <Switch checked={musicEnabled} onChange={toggleMusic} />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Sound Effects
          </Typography>
          <Switch checked={sfxEnabled} onChange={toggleSfx} />
        </Box>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Language */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Language
      </Typography>
      <Stack useFlexGap spacing={0}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Português (BR)
          </Typography>
          <Switch
            checked={language === "pt-br"}
            onChange={() =>
              setLanguage(language === "en" ? "pt-br" : "en")
            }
          />
        </Box>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Developer */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Developer
      </Typography>
      <Stack useFlexGap spacing={0}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Dev Mode
          </Typography>
          <Switch checked={devMode} onChange={toggleDevMode} />
        </Box>
        <Typography variant="caption" sx={{ color: "silver.dark" }}>
          Enables the Playground panel during gameplay
        </Typography>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Credits */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Credits
      </Typography>
      <Stack useFlexGap spacing={1}>
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Arcane Poker by{" "}
          <Link
            href="https://aleixo.me"
            target="_blank"
            rel="noopener noreferrer"
          >
            Raphael Aleixo / Ludoratory
          </Link>
        </Typography>
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Licensed under{" "}
          <Link
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-NC-SA 4.0
          </Link>
        </Typography>
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Found a bug?{" "}
          <Link
            href="https://github.com/raphaelaleixo/arcanepoker/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report it on GitHub
          </Link>
        </Typography>

        <Typography
          variant="overline"
          sx={{ color: "silver.dark", display: "block", mt: 1 }}
        >
          Sound Credits
        </Typography>
        <Typography variant="caption" sx={{ color: "silver.dark" }}>
          {/* Add sound attribution entries here */}
        </Typography>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat: add SettingsPage component"
```

---

### Task 4: Add /settings route

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import and route**

Add import at top of `src/App.tsx` (after the TutorialGamePage import, line 6):
```tsx
import { SettingsPage } from "./pages/SettingsPage";
```

Add route inside `<Routes>` (after the `/rules` route, line 37):
```tsx
<Route path="/settings" element={<SettingsPage />} />
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /settings route"
```

---

## Chunk 3: DevMode gating

### Task 5: Gate DEV button behind devMode

**Files:**
- Modify: `src/components/Table/PokerTable.tsx`

- [ ] **Step 1: Import useSettings**

Add import in `src/components/Table/PokerTable.tsx` (after the existing imports):
```tsx
import { useSettings } from "../../store/SettingsContext";
```

- [ ] **Step 2: Read devMode in the component**

Inside the `PokerTable` function body, after line 36 (`const demo3 = useDemo3Optional();`), add:
```tsx
const { devMode } = useSettings();
```

- [ ] **Step 3: Wrap DEV button and PlaygroundDrawer in devMode guard**

Replace the DEV `<Button>` and `<PlaygroundDrawer>` block (lines 346-378) by wrapping it in a conditional:

```tsx
{devMode && (
  <>
    <Button
      size="small"
      variant="outlined"
      onClick={() => setPlaygroundOpen(true)}
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1200,
        minWidth: 0,
        px: 1.5,
        py: 0.5,
        fontSize: "0.7rem",
        opacity: 0.5,
        color: "secondary.light",
        borderColor: "secondary.dark",
        "&:hover": { opacity: 1 },
      }}
    >
      DEV
    </Button>
    <PlaygroundDrawer
      open={playgroundOpen}
      onClose={() => setPlaygroundOpen(false)}
      onOpenTarot={() => {
        setPlaygroundOpen(false);
        setShowTarot(true);
      }}
      onOpenGameOver={() => {
        setPlaygroundOpen(false);
        dispatch({ type: "DEV_FORCE_GAME_OVER" });
      }}
    />
  </>
)}
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: Clean build with no errors

- [ ] **Step 5: Run tests**

Run: `npm run test`
Expected: All existing tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/Table/PokerTable.tsx
git commit -m "feat: gate PlaygroundDrawer behind devMode setting"
```

---

## Verification

1. Run `npm run dev` and navigate to `/settings`
2. Toggle each switch — verify changes persist after page reload (check localStorage key `arcane-poker-settings`)
3. Toggle Music/SFX off in settings, start a game — verify no audio plays
4. Toggle Dev Mode on, go to `/game` — DEV button visible; toggle off — DEV button hidden
5. Toggle language — verify value persists in localStorage (no visible translation change expected)
6. Run `npm run test` — all tests pass
7. Run `npm run build` — clean build
