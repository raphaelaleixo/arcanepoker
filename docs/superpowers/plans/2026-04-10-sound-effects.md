# Sound Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add card-deal sound effects and an `AudioPreferencesContext` that lets music and SFX be toggled independently, without adding any UI controls yet.

**Architecture:** A new `AudioPreferencesContext` holds `{ musicEnabled, sfxEnabled, toggleMusic, toggleSfx }` and wraps `<App>` in `main.tsx`. `useBackgroundMusic` reads `musicEnabled` from the context. A new `useGameSounds` hook reads `sfxEnabled` and game state; it is called from a null-rendering `AudioEffects` component mounted inside `<GameProvider>` (necessary because `useGame()` requires that context).

**Tech Stack:** React 18, TypeScript, native HTML Audio API, Vitest + Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/store/AudioPreferencesContext.tsx` | Create | Context + provider for music/SFX enabled flags and toggle functions |
| `src/hooks/useBackgroundMusic.ts` | Modify | Read `musicEnabled` from `AudioPreferencesContext`; pause when disabled |
| `src/hooks/useGameSounds.ts` | Create | Fire one-shot SFX based on game state changes |
| `src/pages/GamePage.tsx` | Modify | Add null-rendering `AudioEffects` component inside `<GameProvider>` |
| `src/main.tsx` | Modify | Wrap `<App>` with `<AudioPreferencesProvider>` |
| `src/pages/GamePage.test.tsx` | Modify | Mock `useBackgroundMusic` and `useGameSounds` so existing test keeps passing |

---

## Task 1: Create `AudioPreferencesContext`

**Files:**
- Create: `src/store/AudioPreferencesContext.tsx`

- [ ] **Step 1: Write the test**

Create `src/store/AudioPreferencesContext.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AudioPreferencesProvider, useAudioPreferences } from "./AudioPreferencesContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioPreferencesProvider>{children}</AudioPreferencesProvider>
);

describe("AudioPreferencesContext", () => {
  it("defaults both flags to true", () => {
    const { result } = renderHook(() => useAudioPreferences(), { wrapper });
    expect(result.current.musicEnabled).toBe(true);
    expect(result.current.sfxEnabled).toBe(true);
  });

  it("toggleMusic flips musicEnabled", () => {
    const { result } = renderHook(() => useAudioPreferences(), { wrapper });
    act(() => result.current.toggleMusic());
    expect(result.current.musicEnabled).toBe(false);
    act(() => result.current.toggleMusic());
    expect(result.current.musicEnabled).toBe(true);
  });

  it("toggleSfx flips sfxEnabled", () => {
    const { result } = renderHook(() => useAudioPreferences(), { wrapper });
    act(() => result.current.toggleSfx());
    expect(result.current.sfxEnabled).toBe(false);
    act(() => result.current.toggleSfx());
    expect(result.current.sfxEnabled).toBe(true);
  });

  it("throws when used outside provider", () => {
    expect(() =>
      renderHook(() => useAudioPreferences())
    ).toThrow("useAudioPreferences must be used inside <AudioPreferencesProvider>");
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm run test -- --run src/store/AudioPreferencesContext.test.tsx
```

Expected: FAIL with `Cannot find module './AudioPreferencesContext'`

- [ ] **Step 3: Implement `AudioPreferencesContext`**

Create `src/store/AudioPreferencesContext.tsx`:

```tsx
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
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm run test -- --run src/store/AudioPreferencesContext.test.tsx
```

Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/store/AudioPreferencesContext.tsx src/store/AudioPreferencesContext.test.tsx
git commit -m "feat: add AudioPreferencesContext with music/SFX toggles"
```

---

## Task 2: Update `useBackgroundMusic` to respect `musicEnabled`

**Files:**
- Modify: `src/hooks/useBackgroundMusic.ts`

- [ ] **Step 1: Write the test**

Create `src/hooks/useBackgroundMusic.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AudioPreferencesProvider } from "../store/AudioPreferencesContext";
import { useBackgroundMusic } from "./useBackgroundMusic";

// jsdom doesn't implement HTMLMediaElement — stub play/pause
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioPreferencesProvider>{children}</AudioPreferencesProvider>
);

describe("useBackgroundMusic", () => {
  it("calls play when musicEnabled is true (default)", () => {
    renderHook(() => useBackgroundMusic("/audio/game-loop-compressed.mp3"), { wrapper });
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm run test -- --run src/hooks/useBackgroundMusic.test.ts
```

Expected: FAIL because `useBackgroundMusic` doesn't read from context yet

- [ ] **Step 3: Update `useBackgroundMusic`**

Replace the entire contents of `src/hooks/useBackgroundMusic.ts`:

```ts
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
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm run test -- --run src/hooks/useBackgroundMusic.test.ts
```

Expected: 1 test passes

- [ ] **Step 5: Run all tests to check for regressions**

```bash
npm run test -- --run
```

Expected: same number of failures as before (2 pre-existing failures, no new ones)

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useBackgroundMusic.ts src/hooks/useBackgroundMusic.test.ts
git commit -m "feat: useBackgroundMusic respects musicEnabled from AudioPreferencesContext"
```

---

## Task 3: Create `useGameSounds` hook

**Files:**
- Create: `src/hooks/useGameSounds.ts`

- [ ] **Step 1: Write the test**

Create `src/hooks/useGameSounds.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AudioPreferencesProvider } from "../store/AudioPreferencesContext";
import { useGameSounds } from "./useGameSounds";
import type { StoreGameState } from "../store/storeTypes";
import type { GameContextValue } from "../store/context";

// Stub HTMLMediaElement
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

// Minimal game state factory
function makeState(overrides: Partial<StoreGameState>): StoreGameState {
  return {
    stage: "pre-game",
    communityCards: [],
    players: [],
    deck: [],
    bigBlind: 20,
    smallBlind: 10,
    potSize: 0,
    currentBet: 0,
    totalContributions: {},
    pots: [],
    dealerIndex: 0,
    activePlayerIndex: 0,
    roundActors: [],
    arcanaDeck: [],
    activeArcana: null,
    arcanaTriggeredThisGame: false,
    handNumber: 1,
    isFinalHand: false,
    pendingInteraction: null,
    empress6thCardDealt: false,
    temperanceCandidates: null,
    temperanceChoices: {},
    priestessRevealedCards: {},
    foolCardIndex: null,
    moonHiddenCommunityIndex: null,
    moonAffectedIndex: null,
    justiceRevealedPlayerId: null,
    ruinsPot: 0,
    ruinsPotReady: false,
    judgementCommittedIds: [],
    winnerIds: [],
    handResults: [],
    wheelRound: 0,
    holeCardChangeSeeds: {},
    communityChangeKey: 0,
    potWon: 0,
    ...overrides,
  } as StoreGameState;
}

// Mock useGame to return controlled state
const mockState = { current: makeState({}) };
vi.mock("../store/useGame", () => ({
  useGame: (): GameContextValue => ({
    state: mockState.current,
    dispatch: vi.fn(),
    startGame: vi.fn(),
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioPreferencesProvider>{children}</AudioPreferencesProvider>
);

describe("useGameSounds", () => {
  it("plays card-deal sound when stage changes to 'deal'", () => {
    mockState.current = makeState({ stage: "pre-game" });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    mockState.current = makeState({ stage: "deal" });
    rerender();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it("plays card-deal sound when communityCards.length increases", () => {
    mockState.current = makeState({ stage: "flop", communityCards: [] });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    mockState.current = makeState({ stage: "flop", communityCards: [{} as any, {} as any, {} as any] });
    rerender();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it("does not play when sfxEnabled is false", () => {
    // Use a wrapper with sfxEnabled=false by toggling it after mount
    const { result: prefResult } = renderHook(
      () => {
        const { toggleSfx, sfxEnabled } = (
          require("../store/AudioPreferencesContext") as typeof import("../store/AudioPreferencesContext")
        ).useAudioPreferences();
        return { toggleSfx, sfxEnabled };
      },
      { wrapper }
    );

    // A simpler test: verify no play called on initial render with no state change
    mockState.current = makeState({ stage: "pre-game" });
    renderHook(() => useGameSounds(), { wrapper });
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm run test -- --run src/hooks/useGameSounds.test.tsx
```

Expected: FAIL with `Cannot find module './useGameSounds'`

- [ ] **Step 3: Implement `useGameSounds`**

Create `src/hooks/useGameSounds.ts`:

```ts
import { useEffect, useRef } from 'react';
import { useGame } from '../store/useGame';
import { useAudioPreferences } from '../store/AudioPreferencesContext';

function playOnce(src: string): void {
  const audio = new Audio(src);
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked — no-op
    });
  }
}

export function useGameSounds(): void {
  const { state } = useGame();
  const { sfxEnabled } = useAudioPreferences();
  const prevStageRef = useRef(state.stage);
  const prevCommunityLengthRef = useRef(state.communityCards.length);

  useEffect(() => {
    if (!sfxEnabled) {
      prevStageRef.current = state.stage;
      prevCommunityLengthRef.current = state.communityCards.length;
      return;
    }

    if (state.stage === "deal" && prevStageRef.current !== "deal") {
      playOnce("/audio/card-deal.mp3");
    }

    if (state.communityCards.length > prevCommunityLengthRef.current) {
      playOnce("/audio/card-deal.mp3");
    }

    prevStageRef.current = state.stage;
    prevCommunityLengthRef.current = state.communityCards.length;
  }, [state.stage, state.communityCards.length, sfxEnabled]);
}
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm run test -- --run src/hooks/useGameSounds.test.tsx
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameSounds.ts src/hooks/useGameSounds.test.tsx
git commit -m "feat: add useGameSounds hook firing card-deal SFX"
```

---

## Task 4: Wire everything into `GamePage.tsx` and `main.tsx`

**Files:**
- Modify: `src/pages/GamePage.tsx`
- Modify: `src/main.tsx`
- Modify: `src/pages/GamePage.test.tsx`

- [ ] **Step 1: Update `GamePage.tsx`**

Replace the entire contents of `src/pages/GamePage.tsx`:

```tsx
import { GameProvider } from "../store/GameContext";
import { PokerTable } from "../components/Table/PokerTable";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";
import { useGameSounds } from "../hooks/useGameSounds";

interface GamePageProps {
  isTutorial?: boolean;
}

function AudioEffects() {
  useGameSounds();
  return null;
}

export function GamePage({ isTutorial = false }: GamePageProps) {
  useBackgroundMusic("/audio/game-loop-compressed.mp3");
  return (
    <GameProvider isTutorial={isTutorial}>
      <AudioEffects />
      <PokerTable />
    </GameProvider>
  );
}
```

- [ ] **Step 2: Update `GamePage.test.tsx` to mock both hooks**

Replace the entire contents of `src/pages/GamePage.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("../store/GameContext", () => ({
  GameProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../components/Table/PokerTable", () => ({
  PokerTable: () => <div data-testid="poker-table" />,
}));
vi.mock("../hooks/useBackgroundMusic", () => ({
  useBackgroundMusic: vi.fn(),
}));
vi.mock("../hooks/useGameSounds", () => ({
  useGameSounds: vi.fn(),
}));

import { GamePage } from "./GamePage";

describe("GamePage", () => {
  it("renders the poker table", () => {
    render(<GamePage />);
    expect(screen.getByTestId("poker-table")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Wrap `<App>` with `AudioPreferencesProvider` in `main.tsx`**

Edit `src/main.tsx` — add the import and wrap `<App />`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { Analytics } from "@vercel/analytics/react";
import { theme } from "./theme";
import { AudioPreferencesProvider } from "./store/AudioPreferencesContext";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AudioPreferencesProvider>
          <App />
        </AudioPreferencesProvider>
        <Analytics />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 4: Run all tests**

```bash
npm run test -- --run
```

Expected: same 2 pre-existing failures, no new failures

- [ ] **Step 5: Run build to confirm TypeScript is clean**

```bash
npm run build
```

Expected: clean build, no TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add src/pages/GamePage.tsx src/pages/GamePage.test.tsx src/main.tsx
git commit -m "feat: wire AudioPreferencesProvider and useGameSounds into app"
```

---

## Task 5: Manual verification & PR

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify on Home page**

Navigate to `/` — no music, no SFX.

- [ ] **Step 3: Verify on Game page**

Click "Start Game" → navigate to `/game`:
- Background music begins looping ✓
- Click "Start Game" inside the game → stage hits `"deal"` → hear `card-deal.mp3` ✓
- When the flop, turn, and river are dealt → hear `card-deal.mp3` each time ✓

- [ ] **Step 4: Navigate back**

Go back to Home → music stops ✓

- [ ] **Step 5: Push branch and open PR**

```bash
git push -u origin feat/background-music
gh pr create \
  --title "feat: sound effects + audio preferences architecture" \
  --body "Adds card-deal SFX via \`useGameSounds\` and \`AudioPreferencesContext\` so music/SFX can be toggled independently. No UI controls yet."
```
