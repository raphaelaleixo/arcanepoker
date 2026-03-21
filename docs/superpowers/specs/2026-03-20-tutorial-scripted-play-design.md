# Tutorial Scripted Play — Design Spec

**Date:** 2026-03-20
**Feature:** First-play tutorial experience with two fully scripted rounds
**Trigger:** "Tutorial" button on the Home Screen

---

## Overview

A scripted, hand-held tutorial accessible from the home screen that walks new players through two pre-defined poker rounds. The player follows the script (their available actions are constrained to the scripted move at each step). Narration overlays explain key mechanics after significant events.

---

## Goals

1. Teach the Page card's role in straights (Round 1)
2. Teach how a Page on the board triggers the Arcana deck (Round 2)
3. Teach The Fool's wildcard effect (Round 2)
4. Show the Page winner bonus mechanic (Round 1)
5. Demonstrate a normal round without Arcana (Round 1)

---

## Architecture: Tutorial Context Layer

The tutorial is implemented as a context layer that wraps the existing `GameContext` without forking the core game engine. The existing `gameReducer`, hand evaluator, and UI components remain intact. The tutorial steers the engine via scripted data rather than rebuilding it.

**Bot suppression strategy:** `GameProvider` accepts a new optional `isTutorial?: boolean` prop. When true, the bot auto-run `useEffect` inside `GameProvider` is skipped entirely. `TutorialContext` takes over bot timing, firing scripted actions from the queue instead. This is the minimal, safe change required — it avoids the bot AI and the tutorial script racing to dispatch `PLAYER_ACTION` for the same turn.

---

## Data Layer

### File: `src/tutorial/tutorialScript.ts`

Pure data — no logic. Exports `TUTORIAL_ROUNDS: TutorialRound[]` with two entries.

```typescript
interface TutorialRound {
  dealerIndex: number;
  playerHoleCards: Record<string, [StandardCard, StandardCard]>; // playerId -> hole cards
  communityCards: {
    flop: [StandardCard, StandardCard, StandardCard];
    turn: StandardCard;
    river: StandardCard;
  };
  arcanaOverride: ArcanaCard | null; // null = no arcana; Round 2 = The Fool (arcana "0")
  botActions: TutorialBotAction[];   // ordered queue, consumed as bots act
  narrations: TutorialNarration[];
}

interface TutorialBotAction {
  playerId: string;
  stage: GameStage;
  action: "fold" | "check" | "call" | "bet" | "raise" | "all-in";
  amount?: number;
}

interface TutorialNarration {
  trigger: TutorialTrigger;
  title: string;
  body: string;
}

type TutorialTrigger =
  | "pre-flop-complete"
  | "flop-dealt"
  | "arcana-revealed"
  | "turn-dealt"
  | "river-dealt"
  | "showdown"
  | "page-bonus"
  | "round-end";
```

### Round 1 Script

- **Dealer:** Merchant (index 3)
- **Hero hole cards:** Page of Hearts + 3 of Clubs
- **Swordsman hole cards:** K♠ + K♣ (pair of Kings)
- **Flop:** A♠, 2♦, 4♣
- **Turn:** K♦
- **River:** 9♠
- **Arcana override:** null (no arcana triggered)
- **Bot actions:**
  - Pre-flop: Swordsman raises, Mystic calls, Merchant folds, Wanderer calls
  - After flop: Swordsman bets, Mystic folds, Wanderer calls
  - After turn: Swordsman bets, Wanderer folds
  - After river: Swordsman all-in
- **Narrations:**
  - `"showdown"` → "The Page in a Straight" / "Your Page of Hearts connects before the Ace: Page → A → 2 → 3 → 4. This is a valid straight — and it beats Swordsman's pair of Kings."
  - `"page-bonus"` → "Page Winner Bonus" / "Because you won with a Page in your hand, every other player pays you one big blind. This is the Page bonus."
  - `"round-end"` → "Round 1 Complete" / "You've seen how the Page fits into a straight and how a normal round without Arcana works. Round 2 will show what happens when a Page appears on the board."

### Round 2 Script

- **Dealer:** Wanderer (index 4)
- **Hero hole cards:** 10♣ + Q♠
- **Mystic hole cards:** A♥ + A♦ (pair of Aces)
- **Flop:** 6♥, J♦, Page of Spades — **Page is the last card of the flop** so the Fool wildcard replaces the correct index (index 2, per the engine's `fool-wildcard` logic)
- **Turn:** 3♦
- **River:** A♣
- **Arcana override:** The Fool (arcana "0")
- **Bot actions:**
  - Pre-flop: Mystic raises, Merchant calls, Wanderer calls, Swordsman folds
  - After flop: Mystic checks, Merchant bets (small), Wanderer calls
  - After turn: Merchant bets, Wanderer folds, Mystic calls
  - After river: Mystic bets, Merchant folds, Mystic calls (hero raises first)
- **Narrations:**
  - `"flop-dealt"` → "A Page Appears" / "The Page of Spades has appeared on the board. This triggers the Arcana deck — the dealer draws a card."
  - `"arcana-revealed"` → "The Fool" / "The Fool replaces the Page in the flop. It acts as a wildcard — it can become any card value needed to complete the best hand."
  - `"showdown"` → "The Fool as a King" / "The Fool becomes a King, giving you 10 → J → Q → K → A — a royal flush. This beats Mystic's pair of Aces."
  - `"round-end"` → "Tutorial Complete" / "You've now seen both core mechanics: the Page card's power in straights, and how the Arcana deck changes the game. You're ready to play."

---

## State Layer

### File: `src/tutorial/TutorialContext.tsx`

Wraps `GameContext`. Provides `TutorialContext` with:

```typescript
interface TutorialContextValue {
  isTutorial: true;
  currentRound: 1 | 2;
  narration: { title: string; body: string } | null;
  tutorialAllowedAction: string | null; // e.g. "call" — constrains ActionBar
  dismissNarration: () => void;
}
```

**Bot interception:**
`TutorialContext` maintains a `botActionQueue` ref (a pointer into the current round's `botActions` array). It watches the game state via a `useEffect` and fires the next queued bot action whenever:
- `state.activePlayerIndex` changes to a bot's index, AND
- `state.stage` matches the next queued action's `stage`, AND
- no narration is currently showing (`narration === null`)

When those conditions are met, `TutorialContext` dispatches the scripted `PLAYER_ACTION` after a 700ms delay (matching the normal bot `BOT_THINK_MS`), then advances the queue pointer. Because `GameProvider` receives `isTutorial={true}`, its own bot `useEffect` is suppressed — there is no race condition.

**Player action validation:**
`TutorialContext` provides a wrapped `dispatch`. When it is the player's turn and `tutorialAllowedAction` is set, only matching actions are forwarded to the real dispatch. Other actions are swallowed silently.

**Narration triggers:**
`TutorialContext` watches `GameContext` state transitions (stage changes, `activeArcana` changes, `winnerIds` becoming non-empty) and fires the matching narration from the script. Game auto-advance and bot queue are both paused while a narration is showing. They resume only after `dismissNarration()` is called.

### Changes to `GameContext.tsx`

One addition: `GameProvider` accepts `isTutorial?: boolean` prop. When true, the bot auto-run `useEffect` returns early without dispatching.

### Changes to `gameReducer.ts`

Minimal, targeted changes only:

1. **New action `TUTORIAL_OVERRIDE_DEAL`:**
   Carries `{ dealerIndex, playerHoleCards, communityCardQueue, arcanaOverride }`. The reducer applies `dealerIndex` first (so blind positions derived from it are correct), then replaces all players' hole cards with the scripted ones, and sets `communityCardQueue` and `arcanaOverride` on state.

   **Timing:** `TutorialContext` dispatches `START_GAME` with a pre-seeded initial state that already has the correct `dealerIndex`, so `startHand()` computes the right blind structure immediately. `TUTORIAL_OVERRIDE_DEAL` fires as the next action to replace hole cards and inject the card queue.

2. **`advanceStage()` — community card draw:**
   If `state.communityCardQueue` is non-empty, shift the required number of cards from the front of the queue instead of drawing from the deck.

3. **`checkPageTrigger()` — arcana draw:**
   If `state.arcanaOverride` is set, use that card instead of drawing the top of the arcana deck, then clear `arcanaOverride`.

### Changes to `storeTypes.ts`

Add two optional fields to `StoreGameState`:
```typescript
communityCardQueue?: StandardCard[];   // pre-seeded community cards for tutorial
arcanaOverride?: ArcanaCard | null;    // force a specific arcana draw
```

---

## UI Layer

### `src/components/Tutorial/TutorialOverlay.tsx`

Renders when `narration` is non-null. Positioned fixed at the bottom of the viewport:
- Semi-transparent dark background panel (`rgba(0,0,0,0.85)`)
- Gold top border
- Small "Tutorial" label (uppercase, muted)
- Title in gold (`#c9a96e`)
- Body text in white/light grey
- "Continue →" button calls `dismissNarration()`
- The rest of the game is visible but pointer-events are blocked on the table while narration is active

### `src/components/Table/ActionBar.tsx` and `ActionButtons.tsx`

`tutorialAllowedAction?: string | null` is threaded from `TutorialContext` through `ActionBar` down to `ActionButtons`:
- In `ActionButtons`: buttons not matching the allowed action receive `disabled` prop and reduced opacity
- The matching button receives a gold border (`border: 2px solid #c9a96e`)
- No other logic in either component changes

### `src/pages/HomePage.tsx`

Add a third button: **"Tutorial"** linking to `/tutorial`.
Positioned between "start new game" and "learn to play".

### `src/pages/TutorialGamePage.tsx`

Thin wrapper — passes `isTutorial` prop into `GameProvider`:
```tsx
export function TutorialGamePage() {
  return (
    <TutorialProvider>
      <GamePage isTutorial />
    </TutorialProvider>
  );
}
```

`GamePage` forwards `isTutorial` to `<GameProvider isTutorial={isTutorial} />`.

### `src/App.tsx`

Add route: `<Route path="/tutorial" element={<TutorialGamePage />} />`

---

## Tutorial Flow

```
Home Screen
  └─ Click "Tutorial"
        └─ /tutorial route
              └─ TutorialProvider wraps GamePage (isTutorial=true)
                    ├─ Round 1: START_GAME with dealerIndex=3, then TUTORIAL_OVERRIDE_DEAL
                    │     ├─ Pre-flop: bots act from script; player constrained to Call
                    │     ├─ Flop dealt from queue (A♠ 2♦ 4♣); no Page → no arcana
                    │     ├─ Flop betting: bots act; player constrained to Call
                    │     ├─ Turn dealt from queue (K♦); betting; player constrained to Call
                    │     ├─ River dealt from queue (9♠)
                    │     ├─ River betting: Swordsman all-in; player constrained to Call
                    │     ├─ Showdown → narration: "The Page in a Straight"
                    │     ├─ Page bonus fires → narration: "Page Winner Bonus"
                    │     └─ narration: "Round 1 Complete" → NEXT_HAND
                    │
                    └─ Round 2: START_GAME with dealerIndex=4, then TUTORIAL_OVERRIDE_DEAL
                          ├─ Pre-flop: bots act; player constrained to Call
                          ├─ Flop dealt from queue (6♥ J♦ Page♠) → Page at index 2 triggers
                          │     ├─ narration: "A Page Appears"
                          │     ├─ arcanaOverride=Fool → engine replaces index 2 with wildcard
                          │     └─ narration: "The Fool"
                          ├─ Flop betting: bots act; player constrained to Call
                          ├─ Turn dealt from queue (3♦); betting; player constrained to Call
                          ├─ River dealt from queue (A♣); hero raises, Mystic calls
                          ├─ Showdown → narration: "The Fool as a King"
                          └─ narration: "Tutorial Complete" → return to Home
```

---

## Files Changed / Created

| File | Change |
|------|--------|
| `src/tutorial/tutorialScript.ts` | **New** — script data |
| `src/tutorial/TutorialContext.tsx` | **New** — context + bot interception |
| `src/components/Tutorial/TutorialOverlay.tsx` | **New** — narration UI |
| `src/pages/TutorialGamePage.tsx` | **New** — thin wrapper page |
| `src/store/storeTypes.ts` | **Minor** — add 2 optional fields |
| `src/store/gameReducer.ts` | **Minor** — 3 targeted changes |
| `src/store/GameContext.tsx` | **Minor** — add `isTutorial` prop to suppress bot useEffect |
| `src/components/Table/ActionBar.tsx` | **Minor** — thread tutorialAllowedAction prop |
| `src/components/Table/ActionButtons.tsx` | **Minor** — disable/highlight based on tutorialAllowedAction |
| `src/pages/GamePage.tsx` | **Minor** — forward isTutorial prop to GameProvider |
| `src/pages/HomePage.tsx` | **Minor** — add Tutorial button |
| `src/App.tsx` | **Minor** — add /tutorial route |

---

## Out of Scope

- Skipping the tutorial mid-way (no skip button — player must complete it)
- Saving tutorial completion state to localStorage
- The tutorial using the LLM tarot prophecy endpoint
- Any changes to card SVG art or 3D flip animations
