# Sound Effects Design

**Date:** 2026-04-10
**Scope:** Card-deal sound effects + audio preferences architecture (music & SFX toggleable independently)

---

## Context

Background music (`game-loop-compressed.mp3`) is already wired up via `useBackgroundMusic` in `GamePage.tsx`. This spec adds:

1. An `AudioPreferencesContext` that holds enabled/disabled state for music and SFX separately, so future UI controls can toggle them without prop-drilling.
2. A `useGameSounds` hook that fires one-shot sound effects in response to game state changes, starting with card dealing.

Audio files already present in `public/audio/`:
- `card-deal.mp3` — used now
- `arcana.mp3`, `bet.mp3`, `round-end.mp3` — available for future events

---

## Architecture

### `AudioPreferencesContext` (`src/store/AudioPreferencesContext.tsx`)

Provides:
```ts
interface AudioPreferences {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
}
```

Default state: both `true`. Mounted in `main.tsx` wrapping `<App />`.

No UI controls are wired up yet. Any future component can call `toggleMusic()` / `toggleSfx()` directly.

---

### `useBackgroundMusic` update (`src/hooks/useBackgroundMusic.ts`)

Reads `musicEnabled` from `AudioPreferencesContext`. When `musicEnabled` is `false`, pauses and does not play. When it flips back to `true`, resumes.

---

### `useGameSounds` (`src/hooks/useGameSounds.ts`)

Reads `sfxEnabled` from `AudioPreferencesContext` and game state from `useGame()`.

Two effects:

| Trigger | Condition | Sound |
|---------|-----------|-------|
| Hole cards dealt | `state.stage` transitions to `"deal"` | `card-deal.mp3` |
| Community card dealt | `state.communityCards.length` increases | `card-deal.mp3` |

Each plays a one-shot `new Audio(src).play()` (same guard as background music: only call `.catch()` if the return value is not `undefined`). No-ops when `sfxEnabled` is `false`.

Called once in `GamePage.tsx` alongside `useBackgroundMusic`.

---

## Files

| File | Change |
|------|--------|
| `src/store/AudioPreferencesContext.tsx` | **New** — context + provider |
| `src/hooks/useGameSounds.ts` | **New** — SFX hook |
| `src/hooks/useBackgroundMusic.ts` | **Edit** — read `musicEnabled` from context |
| `src/pages/GamePage.tsx` | **Edit** — call `useGameSounds` |
| `src/main.tsx` | **Edit** — wrap `<App>` with `AudioPreferencesProvider` |

---

## Verification

1. `npm run dev` → start a game → hear `card-deal.mp3` when hole cards are dealt (stage hits `pre-flop`) and again for each community card (flop = 3 sounds, turn = 1, river = 1)
2. Background music continues unaffected
3. `npm run test` — no new failures
4. `npm run build` — clean TypeScript build

---

## Future extensions

- Wire `toggleMusic` / `toggleSfx` to a settings button or icon in the UI
- Add `arcana.mp3` trigger when `state.pendingInteraction.type === "arcana-reveal"`
- Add `bet.mp3` on player action dispatches
- Add `round-end.mp3` on `state.stage === "results"`
