# Settings Page Design

## Context

Arcane Poker has no centralized settings management. Audio preferences live in an in-memory-only `AudioPreferencesContext` that resets on every page reload. There is no language toggle, no dev mode flag, and no settings page. This design introduces a unified settings system with localStorage persistence and a `/settings` page.

## Scope

1. **SettingsContext** — single context replacing `AudioPreferencesContext`, with localStorage persistence
2. **SettingsPage** — new `/settings` route with sound, language, dev mode, and credits sections
3. **Migration** — swap all `useAudioPreferences()` call sites to `useSettings()`
4. **DevMode gating** — conditionally render the DEV button in `PokerTable` based on `devMode`

## 1. SettingsContext

**File:** `src/store/SettingsContext.tsx`

Replaces: `src/store/AudioPreferencesContext.tsx`

### State shape

```ts
interface Settings {
  musicEnabled: boolean;   // default: true
  sfxEnabled: boolean;     // default: true
  language: "en" | "pt-br"; // default: "en"
  devMode: boolean;        // default: false
}
```

### API (via `useSettings()` hook)

```ts
interface SettingsContextValue extends Settings {
  toggleMusic: () => void;
  toggleSfx: () => void;
  setLanguage: (lang: "en" | "pt-br") => void;
  toggleDevMode: () => void;
}
```

### Persistence

- localStorage key: `"arcane-poker-settings"`
- On mount: read from localStorage, merge with defaults (handles missing keys gracefully)
- On every state change: write full settings object to localStorage
- Use a `useEffect` that serializes settings to localStorage whenever they change

### Provider

`SettingsProvider` wraps the app in `main.tsx`, replacing `AudioPreferencesProvider`.

## 2. SettingsPage

**File:** `src/pages/SettingsPage.tsx`

Uses MUI components: `Box`, `Stack`, `Typography`, `Switch`, `Divider`, `Link`. Follows the visual style of existing pages (gold/silver color scheme from theme).

### Layout sections

#### Sound
- Two rows, each with a label and a `Switch`:
  - "Music" — toggles `musicEnabled`
  - "Sound Effects" — toggles `sfxEnabled`

#### Language
- Two rows with a `Switch` or toggle buttons:
  - English / Português (BR)
  - Toggles `language` between `"en"` and `"pt-br"`
  - Note: this saves the preference only — no i18n infrastructure exists yet

#### Developer
- One row with a `Switch`:
  - "Dev Mode" — toggles `devMode`
  - Caption text explaining it enables the Playground panel during gameplay

#### Credits
- "Arcane Poker by Raphael Aleixo / Ludoratory" with link to https://aleixo.me
- License: CC BY-NC-SA 4.0 link
- GitHub Issues link for bug reports / suggestions
- "Sound Credits" subsection — placeholder area for sound attribution entries (to be filled in by user later)

## 3. Routing

**File:** `src/App.tsx`

Add route: `<Route path="/settings" element={<SettingsPage />} />`

No navigation link to the settings page will be added in this task (per user request).

## 4. Migration

### Files to update

| File | Change |
|------|--------|
| `src/main.tsx` | Replace `AudioPreferencesProvider` with `SettingsProvider` |
| `src/store/AudioPreferencesContext.tsx` | Delete (replaced by SettingsContext) |
| `src/hooks/useBackgroundMusic.ts` | `useAudioPreferences()` → `useSettings()` |
| `src/hooks/useGameSounds.ts` | `useAudioPreferences()` → `useSettings()` |
| `src/components/Dev/PlaygroundDrawer.tsx` | `useAudioPreferences()` → `useSettings()` |
| `src/components/Table/PokerTable.tsx` | Gate DEV button render with `devMode` from `useSettings()` |

### DevMode gating in PokerTable

The existing DEV `Button` and `PlaygroundDrawer` in `PokerTable.tsx` will be conditionally rendered only when `devMode === true`.

## 5. Verification

1. Run `npm run dev` and navigate to `/settings`
2. Toggle each switch — verify changes persist after page reload (check localStorage)
3. Toggle Music/SFX off in settings → start a game → verify no audio plays
4. Toggle Dev Mode on → go to game → DEV button visible; toggle off → DEV button hidden
5. Toggle language → verify value persists (no visible translation change expected yet)
6. Run `npm run test` — ensure no regressions
7. Run `npm run build` — ensure clean build
