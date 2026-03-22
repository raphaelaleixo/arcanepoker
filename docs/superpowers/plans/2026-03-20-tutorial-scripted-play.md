# Tutorial Scripted Play Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-round scripted tutorial accessible from the home screen that teaches the Page card and Arcana mechanics through a hand-held, narrated play-through.

**Architecture:** A `TutorialContext` layer wraps `GameContext`, suppresses the live AI bot loop, fires scripted bot actions from a queue, shows narration overlays at key moments, and constrains the hero's available actions to one scripted move per turn. Three targeted changes to `gameReducer.ts` wire in a `TUTORIAL_OVERRIDE_DEAL` action (re-seeded hand), a `communityCardQueue` (pre-defined board cards), and an `arcanaOverride` (forced Fool draw).

**Tech Stack:** React 18, TypeScript, Vite, Material-UI v5, Vitest

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/tutorial/tutorialScript.ts` | Pure data: two `TutorialRound` objects with hole cards, community cards, bot action queues, narrations |
| `src/tutorial/TutorialContext.tsx` | Context: bot queue consumer, narration state, hero action constraint, TUTORIAL_OVERRIDE_DEAL dispatch |
| `src/components/Tutorial/TutorialOverlay.tsx` | Fixed bottom overlay panel: title + body + "Continue →" button |
| `src/pages/TutorialGamePage.tsx` | Thin route wrapper: `<TutorialProvider><GamePage isTutorial /></TutorialProvider>` |
| `src/store/storeTypes.ts` | +2 optional state fields; +`TUTORIAL_OVERRIDE_DEAL` action type |
| `src/store/gameReducer.ts` | 3 changes: new case handler; `advanceStage` queue check; `checkPageTrigger` override check |
| `src/store/GameContext.tsx` | +`isTutorial?: boolean` prop; both auto-run effects skip when true |
| `src/components/Table/ActionButtons.tsx` | +`tutorialAllowedAction?: string \| null` prop; disables/highlights buttons |
| `src/components/Table/ActionBar.tsx` | Thread `tutorialAllowedAction` from `TutorialContext` to `ActionButtons` |
| `src/pages/GamePage.tsx` | +`isTutorial?: boolean` prop; forwards to `GameProvider` |
| `src/pages/HomePage.tsx` | Add "tutorial" button |
| `src/App.tsx` | Add `/tutorial` route |

---

## Chunk 1: State Foundation

### Task 1: Extend `storeTypes.ts` — new fields and action

**Files:**
- Modify: `src/store/storeTypes.ts`
- Test: `src/store/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Write failing tests for the new reducer action**

Add to `src/store/__tests__/gameReducer.test.ts`:

```typescript
// ─── Helpers for tutorial tests ───────────────────────────────────────────────

const TUTORIAL_HOLE_CARDS_R1 = {
  hero:           [{ value: "0" as const, suit: "hearts"   as const }, { value: "3" as const,  suit: "clubs"    as const }],
  "bot-swords":   [{ value: "K" as const, suit: "spades"   as const }, { value: "K" as const,  suit: "clubs"    as const }],
  "bot-cups":     [{ value: "7" as const, suit: "diamonds" as const }, { value: "9" as const,  suit: "clubs"    as const }],
  "bot-wands":    [{ value: "8" as const, suit: "clubs"    as const }, { value: "J" as const,  suit: "spades"   as const }],
  "bot-pentacles":[{ value: "2" as const, suit: "spades"   as const }, { value: "5" as const,  suit: "diamonds" as const }],
} as const;

const TUTORIAL_QUEUE_R1: StandardCard[] = [
  { value: "A", suit: "spades"   },
  { value: "2", suit: "diamonds" },
  { value: "4", suit: "clubs"    },
  { value: "K", suit: "diamonds" },
  { value: "9", suit: "spades"   },
];

function dispatchOverride(state: StoreGameState, extra: Partial<Parameters<typeof gameReducer>[1] & { type: "TUTORIAL_OVERRIDE_DEAL" }> = {}) {
  return gameReducer(state, {
    type: "TUTORIAL_OVERRIDE_DEAL",
    payload: {
      dealerIndex: 4,
      playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as Record<string, [StandardCard, StandardCard]>,
      communityCardQueue: TUTORIAL_QUEUE_R1,
      arcanaOverride: null,
      ...("payload" in extra ? (extra as any).payload : {}),
    },
  });
}

describe("TUTORIAL_OVERRIDE_DEAL", () => {
  it("sets stage to pre-flop", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    expect(next.stage).toBe("pre-flop");
  });

  it("replaces hero hole cards with scripted ones", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    const hero = next.players.find(p => p.id === "hero")!;
    expect(hero.holeCards).toEqual([
      { value: "0", suit: "hearts" },
      { value: "3", suit: "clubs" },
    ]);
  });

  it("sets communityCardQueue on state", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    expect(next.communityCardQueue).toEqual(TUTORIAL_QUEUE_R1);
  });

  it("sets arcanaOverride on state", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const foolCard = { suit: "arcana" as const, value: "0" as const };
    const next = gameReducer(state, {
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: 4,
        playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: [],
        arcanaOverride: foolCard,
      },
    });
    expect(next.arcanaOverride).toEqual(foolCard);
  });

  it("sets dealerIndex from payload and recomputes blind structure", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    // dealerIndex=4 (Wanderer): SB=(4+1)%5=0=hero, BB=(4+2)%5=1=Merchant, UTG=(4+3)%5=2=Swordsman
    const next = dispatchOverride(state);
    expect(next.dealerIndex).toBe(4);
    const hero = next.players.find(p => p.id === "hero")!;
    expect(hero.currentBet).toBe(10); // small blind
    const merchant = next.players.find(p => p.id === "bot-pentacles")!;
    expect(merchant.currentBet).toBe(20); // big blind
    expect(next.activePlayerIndex).toBe(2); // UTG = Swordsman
  });

  it("does not double-deduct blinds from stacks", () => {
    // START_GAME already posted blinds; TUTORIAL_OVERRIDE_DEAL must undo them
    // before re-posting at the new positions
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    // All players start at 1000; after override: SB=hero posts 10, BB=Merchant posts 20
    const hero = next.players.find(p => p.id === "hero")!;
    const merchant = next.players.find(p => p.id === "bot-pentacles")!;
    const swords = next.players.find(p => p.id === "bot-swords")!;
    expect(hero.stack).toBe(990);     // 1000 - 10 (SB)
    expect(merchant.stack).toBe(980); // 1000 - 20 (BB)
    expect(swords.stack).toBe(1000);  // no blind
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test -- src/store/__tests__/gameReducer.test.ts 2>&1 | tail -15
```

Expected: FAIL — `TUTORIAL_OVERRIDE_DEAL` is not in the `GameAction` union yet; TypeScript compilation fails or reducer falls through to `default` and returns unchanged state

- [ ] **Step 3: Add fields to `StoreGameState` in `storeTypes.ts`**

In `src/store/storeTypes.ts`, after the `communityChangeKey` field, add:

```typescript
  // ── Tutorial ─────────────────────────────────────────────────────────────────
  /** Pre-seeded community cards consumed by advanceStage instead of drawing from deck. */
  communityCardQueue?: StandardCard[];
  /** Force a specific arcana card when a Page triggers the arcana deck. Cleared after use. */
  arcanaOverride?: ArcanaCard | null;
```

- [ ] **Step 4: Add `TUTORIAL_OVERRIDE_DEAL` to the `GameAction` union in `storeTypes.ts`**

Add after the `FORCE_ARCANA` entry:

```typescript
  | {
      type: "TUTORIAL_OVERRIDE_DEAL";
      payload: {
        dealerIndex: number;
        playerHoleCards: Record<string, [StandardCard, StandardCard]>;
        communityCardQueue: StandardCard[];
        arcanaOverride: ArcanaCard | null;
      };
    }
```

- [ ] **Step 5: Run tests — still failing with wrong assertion values, not compile errors**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test -- src/store/__tests__/gameReducer.test.ts 2>&1 | tail -10
```

Expected: FAIL — reducer hits `default: return state`, so `stage` is still "pre-flop" but other assertions fail (e.g. `hero.holeCards` unchanged, `communityCardQueue` is `undefined`)

---

### Task 2: Implement `TUTORIAL_OVERRIDE_DEAL` in `gameReducer.ts`

**Files:**
- Modify: `src/store/gameReducer.ts`

- [ ] **Step 1: Add the case to the `gameReducer` switch — before `default:`**

```typescript
    case "TUTORIAL_OVERRIDE_DEAL": {
      const { dealerIndex, playerHoleCards, communityCardQueue, arcanaOverride } = action.payload;
      const n = state.players.length;
      const sbIdx = (dealerIndex + 1) % n;
      const bbIdx = (dealerIndex + 2) % n;
      const utgIdx = (dealerIndex + 3) % n;

      const players = state.players.map((p, idx) => {
        const scripted = playerHoleCards[p.id];
        const isSB = idx === sbIdx;
        const isBB = idx === bbIdx;

        // Undo any blind already posted by a prior startHand call before re-posting
        // at the correct tutorial positions. p.currentBet holds whatever was posted.
        const cleanStack = p.stack + p.currentBet;

        return {
          ...p,
          holeCards: scripted ?? p.holeCards,
          currentBet: isSB ? state.smallBlind : isBB ? state.bigBlind : 0,
          stack: cleanStack - (isSB ? state.smallBlind : isBB ? state.bigBlind : 0),
          folded: false,
          isAllIn: false,
          currentAction: isSB
            ? ("smallBlind" as const)
            : isBB
            ? ("bigBlind" as const)
            : undefined,
        };
      });

      return {
        ...state,
        stage: "pre-flop",
        players,
        communityCards: [],
        dealerIndex,
        activePlayerIndex: utgIdx,
        currentBet: state.bigBlind,
        potSize: state.smallBlind + state.bigBlind,
        roundActors: [],
        arcanaTriggeredThisRound: false,
        activeArcana: null,
        pendingInteraction: null,
        foolCardIndex: null,
        moonAffectedIndex: null,
        winnerIds: [],
        handResults: [],
        potWon: 0,
        communityCardQueue,
        arcanaOverride,
      };
    }
```

- [ ] **Step 2: Run tests — all `TUTORIAL_OVERRIDE_DEAL` tests should pass**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test -- src/store/__tests__/gameReducer.test.ts 2>&1 | tail -20
```

Expected: All `TUTORIAL_OVERRIDE_DEAL` describe block tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/store/storeTypes.ts src/store/gameReducer.ts src/store/__tests__/gameReducer.test.ts && git commit -m "feat: add TUTORIAL_OVERRIDE_DEAL action with communityCardQueue and arcanaOverride"
```

---

### Task 3: Modify `advanceStage` to consume `communityCardQueue`

**Files:**
- Modify: `src/store/gameReducer.ts`
- Test: `src/store/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Write failing tests for queue-based community card dealing**

Add to `src/store/__tests__/gameReducer.test.ts`:

```typescript
describe("advanceStage with communityCardQueue", () => {
  function makeQueuedPreFlop(): StoreGameState {
    const base = gameReducer(createInitialState(), { type: "START_GAME" });
    return gameReducer(base, {
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: 4,
        playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: TUTORIAL_QUEUE_R1,
        arcanaOverride: null,
      },
    });
  }

  it("deals flop cards from communityCardQueue instead of deck", () => {
    const base = makeQueuedPreFlop();
    // Fold all bots so hero can check and the stage auto-advances
    const allFolded: StoreGameState = {
      ...base,
      players: base.players.map((p) =>
        p.id === "hero" ? p : { ...p, folded: true }
      ),
    };
    // Hero checks; with only hero eligible, advanceStage auto-chains through all streets
    const next = gameReducer(allFolded, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    // Community cards must come from the queue in order
    expect(next.communityCards[0]).toEqual({ value: "A", suit: "spades"   });
    expect(next.communityCards[1]).toEqual({ value: "2", suit: "diamonds" });
    expect(next.communityCards[2]).toEqual({ value: "4", suit: "clubs"    });
  });

  it("deals turn card from communityCardQueue", () => {
    const base = makeQueuedPreFlop();
    const allFolded: StoreGameState = {
      ...base,
      players: base.players.map((p) =>
        p.id === "hero" ? p : { ...p, folded: true }
      ),
    };
    const next = gameReducer(allFolded, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    // Auto-chains flop+turn+river; turn is index 3 in queue
    expect(next.communityCards[3]).toEqual({ value: "K", suit: "diamonds" });
  });

  it("queue is empty after all 5 scripted community cards are dealt (auto-chain)", () => {
    // With only hero active, advanceStage chains pre-flop→flop→turn→river→showdown
    // consuming all 5 queue entries. Queue must be [] or undefined after.
    const base = makeQueuedPreFlop();
    const allFolded: StoreGameState = {
      ...base,
      players: base.players.map((p) =>
        p.id === "hero" ? p : { ...p, folded: true }
      ),
    };
    const next = gameReducer(allFolded, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    expect(next.communityCardQueue?.length ?? 0).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test -- src/store/__tests__/gameReducer.test.ts 2>&1 | tail -10
```

Expected: FAIL — community cards come from the regular deck, not the queue

- [ ] **Step 3: Add `drawCommunityCards` helper and update `advanceStage`**

In `src/store/gameReducer.ts`, add this helper function directly **above** `advanceStage`:

```typescript
/**
 * Draw `count` cards for community dealing.
 * Prefers communityCardQueue when available, falls back to the shuffled deck.
 */
function drawCommunityCards(
  state: StoreGameState,
  count: number
): { dealt: StandardCard[]; nextState: StoreGameState } {
  const queue = state.communityCardQueue;
  if (queue && queue.length >= count) {
    return {
      dealt: queue.slice(0, count),
      nextState: { ...state, communityCardQueue: queue.slice(count) },
    };
  }
  const { dealt, remaining } = dealCards(state.deck, count);
  return { dealt, nextState: { ...state, deck: remaining } };
}
```

Then replace the three `dealCards` calls inside `advanceStage`:

**`case "pre-flop":` block** — replace `const { dealt, remaining } = dealCards(state.deck, 3);` and the two lines that use it:

```typescript
    case "pre-flop": {
      const { dealt, nextState } = drawCommunityCards(state, 3);
      let next = resetBettingRound(
        { ...nextState, stage: "flop", communityCards: dealt },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }
```

**`case "flop":` block**:

```typescript
    case "flop": {
      const { dealt, nextState } = drawCommunityCards(state, 1);
      let next = resetBettingRound(
        {
          ...nextState,
          stage: "turn",
          communityCards: [...state.communityCards, dealt[0]],
        },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }
```

**`case "turn":` block**:

```typescript
    case "turn": {
      const { dealt, nextState } = drawCommunityCards(state, 1);
      let next = resetBettingRound(
        {
          ...nextState,
          stage: "river",
          communityCards: [...state.communityCards, dealt[0]],
        },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/store/gameReducer.ts src/store/__tests__/gameReducer.test.ts && git commit -m "feat: advanceStage draws from communityCardQueue when present"
```

---

### Task 4: Modify `checkPageTrigger` to use `arcanaOverride`

**Files:**
- Modify: `src/store/gameReducer.ts`
- Test: `src/store/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Write failing tests for arcanaOverride**

Add to `src/store/__tests__/gameReducer.test.ts`:

```typescript
describe("checkPageTrigger with arcanaOverride", () => {
  const FOOL_CARD = { suit: "arcana" as const, value: "0" as const };

  // Page at index 2 of the flop queue triggers arcana
  const QUEUE_WITH_PAGE: StandardCard[] = [
    { value: "6", suit: "hearts"   },
    { value: "J", suit: "diamonds" },
    { value: "0", suit: "spades"   }, // Page → triggers arcana
    { value: "3", suit: "diamonds" },
    { value: "A", suit: "clubs"    },
  ];

  function makeStateWithFoolOverride(): StoreGameState {
    const base = gameReducer(createInitialState(), { type: "START_GAME" });
    return gameReducer(base, {
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: 4,
        playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: QUEUE_WITH_PAGE,
        arcanaOverride: FOOL_CARD,
      },
    });
  }

  function advanceToFlop(state: StoreGameState): StoreGameState {
    // Fold all bots so hero can check once and stage advances
    const allFolded: StoreGameState = {
      ...state,
      players: state.players.map((p) =>
        p.id === "hero" ? p : { ...p, folded: true }
      ),
    };
    return gameReducer(allFolded, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
  }

  it("uses arcanaOverride card instead of drawing from arcanaDeck", () => {
    const state = makeStateWithFoolOverride();
    const next = advanceToFlop(state);
    // pendingInteraction carries the Fool (not whatever is on top of arcanaDeck)
    expect(next.pendingInteraction?.type).toBe("arcana-reveal");
    if (next.pendingInteraction?.type === "arcana-reveal") {
      expect(next.pendingInteraction.arcanaCard).toEqual(FOOL_CARD);
    }
  });

  it("clears arcanaOverride after it is consumed", () => {
    const state = makeStateWithFoolOverride();
    const next = advanceToFlop(state);
    expect(next.arcanaOverride).toBeNull();
  });

  it("does not consume a card from arcanaDeck when override is set", () => {
    const state = makeStateWithFoolOverride();
    const deckLengthBefore = state.arcanaDeck.length;
    const next = advanceToFlop(state);
    expect(next.arcanaDeck.length).toBe(deckLengthBefore);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test -- src/store/__tests__/gameReducer.test.ts 2>&1 | tail -10
```

Expected: FAIL — `checkPageTrigger` always draws from `arcanaDeck`

- [ ] **Step 3: Replace `checkPageTrigger` in `gameReducer.ts`**

Replace the entire existing `checkPageTrigger` function:

```typescript
function checkPageTrigger(
  state: StoreGameState,
  newCards: StandardCard[]
): StoreGameState {
  if (state.arcanaTriggeredThisRound) return state;
  if (!newCards.some((c) => c.value === "0")) return state;

  let arcanaCard: ArcanaCard;
  let remainingArcanaDeck = state.arcanaDeck;

  if (state.arcanaOverride) {
    // Tutorial mode: use the forced card, do NOT consume from arcanaDeck
    arcanaCard = state.arcanaOverride;
  } else {
    const [drawn, ...rest] = state.arcanaDeck;
    if (!drawn) return state;
    arcanaCard = drawn;
    remainingArcanaDeck = rest;
  }

  return {
    ...state,
    arcanaDeck: remainingArcanaDeck,
    arcanaOverride: null, // Consumed — clear so it cannot fire again
    arcanaTriggeredThisRound: true,
    pendingInteraction: { type: "arcana-reveal", arcanaCard },
  };
}
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/store/gameReducer.ts src/store/__tests__/gameReducer.test.ts && git commit -m "feat: checkPageTrigger uses arcanaOverride instead of arcanaDeck when set"
```

---

### Task 5: Add `isTutorial` prop to `GameProvider`

**Files:**
- Modify: `src/store/GameContext.tsx`

- [ ] **Step 1: Update `GameProvider` signature and suppress both auto-run effects when `isTutorial` is true**

In `src/store/GameContext.tsx`:

Replace the component signature:
```typescript
export function GameProvider({ children }: { children: ReactNode }) {
```
with:
```typescript
export function GameProvider({ children, isTutorial = false }: { children: ReactNode; isTutorial?: boolean }) {
```

In the auto-start `useEffect` (lines ~27–29), add a guard:
```typescript
  useEffect(() => {
    if (isTutorial) return; // TutorialContext controls hand start
    dispatch({ type: "START_GAME" });
  }, [isTutorial]);
```

In the bot auto-run `useEffect`, add a guard at the top and add `isTutorial` to the dependency array:
```typescript
  useEffect(() => {
    if (isTutorial) return; // TutorialContext drives bot actions

    const activePlayer = state.players[state.activePlayerIndex];
    // ... rest of existing bot effect body unchanged ...
  }, [state, isTutorial]);
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/store/GameContext.tsx && git commit -m "feat: GameProvider isTutorial prop suppresses auto-start and bot effects"
```

---

## Chunk 2: Tutorial Data and Context

> **Prerequisite:** Chunk 1 must be complete and merged before starting Chunk 2. `TUTORIAL_OVERRIDE_DEAL` must exist in `GameAction` for `TutorialContext.tsx` to compile.

### Task 6: Create `tutorialScript.ts`

**Files:**
- Create: `src/tutorial/tutorialScript.ts`

**Note on dealer position:** Both rounds use `dealerIndex: 4` (Wanderer as BTN) for mechanical consistency. The spec's "Dealer: Merchant / Wanderer" labels are narrative flavor; the actual button placement is determined by what produces the correct pre-flop UTG sequence. With `dealerIndex=4`: SB=Hero(0), BB=Merchant(1), UTG=Swordsman(2).

**Note on `heroActions`:** This is a per-stage map so hero can call in most streets but raise in Round 2's river only. When a stage is absent from the map, the context defaults to "call".

- [ ] **Step 1: Create the file**

```typescript
// src/tutorial/tutorialScript.ts
import type { StandardCard, ArcanaCard, GameStage } from "../types/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TutorialBotAction {
  playerId: string;
  stage: GameStage;
  action: "fold" | "check" | "call" | "bet" | "raise" | "all-in";
  amount?: number;
}

export interface TutorialNarration {
  trigger: TutorialTrigger;
  title: string;
  body: string;
}

/**
 * arcana-pending  — fires when pendingInteraction.type === "arcana-reveal" appears
 * arcana-revealed — fires when activeArcana transitions from null to non-null
 * showdown        — fires when winnerIds becomes non-empty
 * page-bonus      — fires when pendingInteraction.type === "page-challenge" appears
 * round-end       — fires after page-bonus (or directly after showdown in no-page-bonus rounds)
 */
export type TutorialTrigger =
  | "arcana-pending"
  | "arcana-revealed"
  | "showdown"
  | "page-bonus"
  | "round-end";

export interface TutorialRound {
  dealerIndex: number;
  playerHoleCards: Record<string, [StandardCard, StandardCard]>;
  communityCardQueue: StandardCard[];
  arcanaOverride: ArcanaCard | null;
  /**
   * Per-stage override for the hero's scripted action when currentBet > 0.
   * Stages absent from this map default to "call".
   * When currentBet === 0 on hero's turn, hero always checks regardless of this map.
   * Note: hero's scripted action must never be "all-in" (see ActionButtons constraint).
   */
  heroActions: Partial<Record<GameStage, "call" | "raise">>;
  /** Ordered queue of bot actions consumed in sequence as bots become active. */
  botActions: TutorialBotAction[];
  narrations: TutorialNarration[];
}

// ─── Round 1 ──────────────────────────────────────────────────────────────────
//
// dealerIndex=4 (Wanderer BTN): SB=Hero(0), BB=Merchant(1), UTG=Swordsman(2)
//
// Pre-flop action order: Swordsman(UTG) → Mystic → Wanderer → Hero(SB) → Merchant(BB)
// Post-flop order (Merchant folded pre-flop, Hero acts LAST as BTN caller):
//   firstActiveAfter(4) with Merchant folded = Swordsman(2)
//   Order: Swordsman → Mystic → Wanderer → Hero
//
// Hero post-flop: checks when no bet is present, calls after a bot bets.
// Teaching moment: Page→A→2→3→4 straight beats pair of Kings; Page winner bonus fires.

const ROUND_1: TutorialRound = {
  dealerIndex: 4,
  playerHoleCards: {
    hero:           [{ value: "0", suit: "hearts"   }, { value: "3",  suit: "clubs"    }],
    "bot-swords":   [{ value: "K", suit: "spades"   }, { value: "K",  suit: "clubs"    }], // pair of kings → showdown
    "bot-cups":     [{ value: "7", suit: "diamonds" }, { value: "9",  suit: "clubs"    }], // folds on flop
    "bot-wands":    [{ value: "8", suit: "clubs"    }, { value: "J",  suit: "spades"   }], // folds on turn
    "bot-pentacles":[{ value: "2", suit: "spades"   }, { value: "5",  suit: "diamonds" }], // folds pre-flop
  },
  communityCardQueue: [
    { value: "A", suit: "spades"   }, // flop 1
    { value: "2", suit: "diamonds" }, // flop 2
    { value: "4", suit: "clubs"    }, // flop 3
    { value: "K", suit: "diamonds" }, // turn
    { value: "9", suit: "spades"   }, // river
  ],
  arcanaOverride: null,
  heroActions: {}, // all streets default to "call" (or "check" when currentBet=0)
  botActions: [
    // Pre-flop: Swordsman UTG raises; others react in rotation
    { playerId: "bot-swords",    stage: "pre-flop", action: "raise",  amount: 40 },
    { playerId: "bot-cups",      stage: "pre-flop", action: "call" },
    { playerId: "bot-wands",     stage: "pre-flop", action: "call" },
    { playerId: "bot-pentacles", stage: "pre-flop", action: "fold" },
    // Flop: Hero checks first (currentBet=0); then Swordsman bets; hero re-acts (call)
    { playerId: "bot-swords",    stage: "flop",     action: "bet",    amount: 40 },
    { playerId: "bot-cups",      stage: "flop",     action: "fold" },
    { playerId: "bot-wands",     stage: "flop",     action: "call" },
    // Turn: Hero checks first; Swordsman bets; Wanderer folds; hero re-acts (call)
    { playerId: "bot-swords",    stage: "turn",     action: "bet",    amount: 60 },
    { playerId: "bot-wands",     stage: "turn",     action: "fold" },
    // River: Hero checks first; Swordsman all-in; hero re-acts (call)
    { playerId: "bot-swords",    stage: "river",    action: "all-in" },
  ],
  narrations: [
    {
      trigger: "showdown",
      title: "The Page in a Straight",
      body: "Your Page of Hearts connects before the Ace: Page → A → 2 → 3 → 4. This is a valid straight — and it beats Swordsman's pair of Kings.",
    },
    {
      trigger: "page-bonus",
      title: "Page Winner Bonus",
      body: "Because you won with a Page in your hand, every other player pays you one big blind. This is the Page bonus.",
    },
    {
      trigger: "round-end",
      title: "Round 1 Complete",
      body: "You've seen how the Page fits into a straight and how a normal round without Arcana works. Round 2 will show what happens when a Page appears on the board.",
    },
  ],
};

// ─── Round 2 ──────────────────────────────────────────────────────────────────
//
// dealerIndex=4 (Wanderer BTN): SB=Hero(0), BB=Merchant(1), UTG=Swordsman(2)
//
// Pre-flop: Swordsman(UTG) folds immediately; Mystic raises; Wanderer, Hero, Merchant call.
// Post-flop (Swordsman folded): firstActiveAfter(4) = Merchant(1)
//   Order: Merchant → Mystic → Wanderer → Hero (last)
//
// Flop: Page♠ is the LAST flop card (index 2). The engine's fool-wildcard
//   replaces the last community card on trigger, so foolCardIndex=2 is correct.
// River: Hero checks first; Mystic bets; Merchant folds; hero raises (heroActions.river="raise");
//   Mystic re-calls after hero's raise.
// Teaching moment: Fool wildcard = King → 10→J→Q→K→A royal flush beats pair of Aces.

const ROUND_2: TutorialRound = {
  dealerIndex: 4,
  playerHoleCards: {
    hero:           [{ value: "10", suit: "clubs"    }, { value: "Q",  suit: "spades"   }],
    "bot-swords":   [{ value: "5",  suit: "spades"   }, { value: "7",  suit: "clubs"    }], // folds pre-flop
    "bot-cups":     [{ value: "A",  suit: "hearts"   }, { value: "A",  suit: "diamonds" }], // pair of aces → showdown
    "bot-wands":    [{ value: "2",  suit: "clubs"    }, { value: "8",  suit: "diamonds" }], // folds on turn
    "bot-pentacles":[{ value: "4",  suit: "diamonds" }, { value: "9",  suit: "hearts"   }], // folds on river
  },
  communityCardQueue: [
    { value: "6", suit: "hearts"   }, // flop 1
    { value: "J", suit: "diamonds" }, // flop 2
    { value: "0", suit: "spades"   }, // flop 3 — Page triggers arcana; Fool replaces index 2
    { value: "3", suit: "diamonds" }, // turn
    { value: "A", suit: "clubs"    }, // river
  ],
  arcanaOverride: { suit: "arcana", value: "0" }, // The Fool
  heroActions: {
    river: "raise", // Hero raises on the river only; all other streets default to "call"
  },
  botActions: [
    // Pre-flop
    { playerId: "bot-swords",    stage: "pre-flop", action: "fold" },
    { playerId: "bot-cups",      stage: "pre-flop", action: "raise",  amount: 40 },
    { playerId: "bot-wands",     stage: "pre-flop", action: "call" },
    { playerId: "bot-pentacles", stage: "pre-flop", action: "call" },
    // Flop (Merchant first, Hero last)
    { playerId: "bot-pentacles", stage: "flop",     action: "bet",    amount: 20 },
    { playerId: "bot-cups",      stage: "flop",     action: "call" },
    { playerId: "bot-wands",     stage: "flop",     action: "call" },
    // Turn
    { playerId: "bot-pentacles", stage: "turn",     action: "bet",    amount: 40 },
    { playerId: "bot-wands",     stage: "turn",     action: "fold" },
    { playerId: "bot-cups",      stage: "turn",     action: "call" },
    // River: Hero checks first; Mystic bets; Merchant folds; hero raises; Mystic re-calls
    { playerId: "bot-cups",      stage: "river",    action: "bet",    amount: 40 },
    { playerId: "bot-pentacles", stage: "river",    action: "fold" },
    { playerId: "bot-cups",      stage: "river",    action: "call" }, // after hero raises
  ],
  narrations: [
    {
      trigger: "arcana-pending",
      title: "A Page Appears",
      body: "The Page of Spades has appeared on the board. This triggers the Arcana deck — the dealer draws a card.",
    },
    {
      trigger: "arcana-revealed",
      title: "The Fool",
      body: "The Fool replaces the Page in the flop. It acts as a wildcard — it becomes whatever card value completes the best possible hand.",
    },
    {
      trigger: "showdown",
      title: "The Fool as a King",
      body: "The Fool becomes a King, giving you 10 → J → Q → K → A — a royal flush. This beats Mystic's pair of Aces.",
    },
    {
      trigger: "round-end",
      title: "Tutorial Complete",
      body: "You've now seen both core mechanics: the Page card's power in straights, and how the Arcana deck changes the game. You're ready to play.",
    },
  ],
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const TUTORIAL_ROUNDS: TutorialRound[] = [ROUND_1, ROUND_2];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/tutorial/tutorialScript.ts && git commit -m "feat: add TUTORIAL_ROUNDS script data with per-stage heroActions"
```

---

### Task 7: Create `TutorialContext.tsx`

**Files:**
- Create: `src/tutorial/TutorialContext.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/tutorial/TutorialContext.tsx
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../store/useGame";
import { TUTORIAL_ROUNDS, type TutorialNarration } from "./tutorialScript";
import type { StandardCard, ActionType } from "../types/types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface TutorialContextValue {
  isTutorial: true;
  currentRound: 1 | 2;
  narration: { title: string; body: string } | null;
  /** The one action the hero may take right now; null when it is not hero's turn. */
  tutorialAllowedAction: string | null;
  isComplete: boolean;
  dismissNarration: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
}

/** Safe version — returns null when rendered outside a TutorialProvider. */
export function useTutorialOptional(): TutorialContextValue | null {
  return useContext(TutorialContext);
}

// ─── Internal state ───────────────────────────────────────────────────────────

interface TutorialState {
  currentRound: 1 | 2;
  narration: { title: string; body: string } | null;
  pendingDispatchOnDismiss: (() => void) | null;
}

type TutorialAction =
  | { type: "SHOW_NARRATION"; narration: TutorialNarration; onDismiss?: () => void }
  | { type: "DISMISS_NARRATION" }
  | { type: "ADVANCE_ROUND" };

function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case "SHOW_NARRATION":
      return {
        ...state,
        narration: { title: action.narration.title, body: action.narration.body },
        pendingDispatchOnDismiss: action.onDismiss ?? null,
      };
    case "DISMISS_NARRATION":
      return { ...state, narration: null, pendingDispatchOnDismiss: null };
    case "ADVANCE_ROUND":
      return { ...state, currentRound: 2, narration: null, pendingDispatchOnDismiss: null };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const BOT_THINK_MS = 700;
const HERO_ID = "hero";

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const navigate = useNavigate();

  const [tutState, tutDispatch] = useReducer(tutorialReducer, {
    currentRound: 1,
    narration: null,
    pendingDispatchOnDismiss: null,
  });
  const [isComplete, setIsComplete] = useState(false);

  // Refs for latest values without stale closures
  const tutStateRef = useRef(tutState);
  tutStateRef.current = tutState;
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  // Track whether the current hand has been overridden with tutorial data
  const handInitializedRef = useRef(false);
  // Pointer into the current round's botActions array
  const botQueuePointerRef = useRef(0);
  // Previous game state for transition detection
  const prevGameStateRef = useRef(gameState);

  // ── Derive current script ─────────────────────────────────────────────────
  // Read from a ref so effects always get the latest value at fire time
  const currentRoundRef = useRef<1 | 2>(1);
  currentRoundRef.current = tutState.currentRound;

  function getCurrentScript() {
    return TUTORIAL_ROUNDS[currentRoundRef.current - 1];
  }

  // ── Hand initialization ───────────────────────────────────────────────────
  // Fires when stage becomes "pre-flop" and hand hasn't been overridden yet.
  // This covers both the initial START_GAME (dispatched by TutorialProvider on
  // mount) and the NEXT_HAND transition at the start of Round 2.

  useEffect(() => {
    if (gameState.stage !== "pre-flop" || handInitializedRef.current) return;
    handInitializedRef.current = true;
    botQueuePointerRef.current = 0;
    const script = getCurrentScript();
    gameDispatch({
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: script.dealerIndex,
        playerHoleCards: script.playerHoleCards as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: script.communityCardQueue,
        arcanaOverride: script.arcanaOverride,
      },
    });
  }, [gameState.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger the initial START_GAME (GameProvider has isTutorial=true so it won't auto-start)
  useEffect(() => {
    gameDispatch({ type: "START_GAME" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bot action queue ──────────────────────────────────────────────────────

  useEffect(() => {
    if (tutStateRef.current.narration !== null) return;
    if (!handInitializedRef.current) return;

    const script = getCurrentScript();
    const queue = script.botActions;
    const pointer = botQueuePointerRef.current;
    if (pointer >= queue.length) return;

    const nextAction = queue[pointer];
    const activePlayer = gameState.players[gameState.activePlayerIndex];

    if (
      !activePlayer ||
      activePlayer.id !== nextAction.playerId ||
      gameState.stage !== nextAction.stage ||
      activePlayer.type !== "ai"
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (tutStateRef.current.narration !== null) return;
      botQueuePointerRef.current += 1;
      gameDispatch({
        type: "PLAYER_ACTION",
        payload: {
          playerId: nextAction.playerId,
          action: nextAction.action as ActionType,
          amount: nextAction.amount,
        },
      });
    }, BOT_THINK_MS);

    return () => clearTimeout(timer);
  }, [gameState.activePlayerIndex, gameState.stage, tutState.narration]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Narration triggers ────────────────────────────────────────────────────

  useEffect(() => {
    const prev = prevGameStateRef.current;
    // Update prev AFTER capturing it for comparison
    prevGameStateRef.current = gameState;

    if (!handInitializedRef.current) return;
    if (tutStateRef.current.narration !== null) return;

    const script = getCurrentScript();
    const narrations = script.narrations;

    // arcana-pending: pendingInteraction just became arcana-reveal
    if (
      gameState.pendingInteraction?.type === "arcana-reveal" &&
      prev.pendingInteraction?.type !== "arcana-reveal"
    ) {
      const n = narrations.find((n) => n.trigger === "arcana-pending");
      if (n) {
        tutDispatch({
          type: "SHOW_NARRATION",
          narration: n,
          onDismiss: () => gameDispatch({ type: "REVEAL_ARCANA" }),
        });
        return;
      }
    }

    // arcana-revealed: activeArcana just became non-null (effect applied)
    if (gameState.activeArcana !== null && prev.activeArcana === null) {
      const n = narrations.find((n) => n.trigger === "arcana-revealed");
      if (n) {
        tutDispatch({ type: "SHOW_NARRATION", narration: n });
        return;
      }
    }

    // showdown: winnerIds just became non-empty
    if (gameState.winnerIds.length > 0 && prev.winnerIds.length === 0) {
      const n = narrations.find((n) => n.trigger === "showdown");
      if (n) {
        tutDispatch({ type: "SHOW_NARRATION", narration: n });
        return;
      }
    }

    // page-bonus: pendingInteraction just became page-challenge
    if (
      gameState.pendingInteraction?.type === "page-challenge" &&
      prev.pendingInteraction?.type !== "page-challenge"
    ) {
      const n = narrations.find((n) => n.trigger === "page-bonus");
      if (n) {
        tutDispatch({
          type: "SHOW_NARRATION",
          narration: n,
          onDismiss: () => gameDispatch({ type: "RESOLVE_PAGE_CHALLENGE" }),
        });
        return;
      }
    }

    // round-end (no page-bonus path): page-challenge just resolved → show round-end
    if (
      prev.pendingInteraction?.type === "page-challenge" &&
      gameState.pendingInteraction === null &&
      gameState.winnerIds.length > 0
    ) {
      const n = narrations.find((n) => n.trigger === "round-end");
      if (n) {
        tutDispatch({ type: "SHOW_NARRATION", narration: n });
        return;
      }
    }
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate home when complete ───────────────────────────────────────────

  useEffect(() => {
    if (isComplete) {
      navigate("/");
    }
  }, [isComplete, navigate]);

  // ── Hero action constraint ────────────────────────────────────────────────

  const hero = gameState.players.find((p) => p.id === HERO_ID);
  const isHeroTurn =
    gameState.players[gameState.activePlayerIndex]?.id === HERO_ID &&
    ["pre-flop", "flop", "turn", "river"].includes(gameState.stage) &&
    gameState.pendingInteraction === null &&
    tutState.narration === null;

  let tutorialAllowedAction: string | null = null;
  if (isHeroTurn && hero) {
    const toCall = gameState.currentBet - hero.currentBet;
    if (toCall === 0) {
      tutorialAllowedAction = "check";
    } else {
      const script = getCurrentScript();
      tutorialAllowedAction =
        (script.heroActions[gameState.stage as keyof typeof script.heroActions] as string | undefined)
        ?? "call";
    }
  }

  // ── Round transitions ─────────────────────────────────────────────────────

  const handleRoundEndDismiss = useCallback(() => {
    // Capture currentRound NOW before any async state changes
    const round = currentRoundRef.current;
    tutDispatch({ type: "DISMISS_NARRATION" });
    if (round === 1) {
      // Advance to Round 2
      handInitializedRef.current = false;
      botQueuePointerRef.current = 0;
      tutDispatch({ type: "ADVANCE_ROUND" });
      setTimeout(() => gameDispatch({ type: "NEXT_HAND" }), 100);
    } else {
      // Round 2 complete — tutorial done; navigate home via useEffect
      setIsComplete(true);
    }
  }, [gameDispatch]);

  // ── Dismiss dispatcher ────────────────────────────────────────────────────

  const baseDismiss = useCallback(() => {
    const pending = tutStateRef.current.pendingDispatchOnDismiss;
    tutDispatch({ type: "DISMISS_NARRATION" });
    if (pending) {
      setTimeout(pending, 100);
    }
  }, []);

  const dismissNarration = useCallback(() => {
    const n = tutStateRef.current.narration;
    const script = getCurrentScript();
    const matchingNarration = script.narrations.find((nr) => nr.title === n?.title);
    const trigger = matchingNarration?.trigger;

    if (trigger === "round-end") {
      handleRoundEndDismiss();
      return;
    }

    if (trigger === "showdown") {
      // If this round has no page-bonus, chain directly to round-end
      const hasPageBonus = script.narrations.some((nr) => nr.trigger === "page-bonus");
      if (!hasPageBonus) {
        tutDispatch({ type: "DISMISS_NARRATION" });
        const roundEnd = script.narrations.find((nr) => nr.trigger === "round-end");
        if (roundEnd) {
          tutDispatch({ type: "SHOW_NARRATION", narration: roundEnd });
        }
        return;
      }
    }

    baseDismiss();
  }, [baseDismiss, handleRoundEndDismiss]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <TutorialContext.Provider
      value={{
        isTutorial: true,
        currentRound: tutState.currentRound,
        narration: tutState.narration,
        tutorialAllowedAction,
        isComplete,
        dismissNarration,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npx tsc --noEmit 2>&1 | head -20
```

Expected: No new errors

- [ ] **Step 3: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/tutorial/TutorialContext.tsx && git commit -m "feat: add TutorialContext — bot queue, narration, hero constraint, round transition"
```

---

## Chunk 3: UI Layer

### Task 8: Update `ActionButtons.tsx` with tutorial constraint

**Files:**
- Modify: `src/components/Table/ActionButtons.tsx`

**Note:** Hero's scripted action is never "all-in". If both `checkCallKey` and `raiseKey` resolve to "all-in" simultaneously (when `callExceedsStack` is true), the tutorial scripts never set `tutorialAllowedAction = "all-in"`, so both buttons remain greyed out. This is acceptable and noted here to prevent confusion.

- [ ] **Step 1: Replace the file content**

```typescript
/**
 * The three action buttons for the hero's turn: Fold, Check/Call, and Raise/All-In.
 * Pure presentational — all handlers are passed in from ActionBar.
 */
import { Button, Stack } from "@mui/material";

interface ActionButtonsProps {
  canCheck: boolean;
  callExceedsStack: boolean;
  heroStack: number;
  toCall: number;
  isAllIn: boolean;
  clampedRaise: number;
  onFold: () => void;
  onCheckOrCall: () => void;
  onRaiseOrAllIn: () => void;
  foldDisabled?: boolean;
  checkDisabled?: boolean;
  /** When set, only the matching button is enabled; others are dimmed. */
  tutorialAllowedAction?: string | null;
}

const TUTORIAL_HIGHLIGHT = "2px solid #c9a96e";

export function ActionButtons({
  canCheck,
  callExceedsStack,
  heroStack,
  toCall,
  isAllIn,
  clampedRaise,
  onFold,
  onCheckOrCall,
  onRaiseOrAllIn,
  foldDisabled,
  checkDisabled,
  tutorialAllowedAction,
}: ActionButtonsProps) {
  const tut = tutorialAllowedAction ?? null;

  const checkCallKey = canCheck ? "check" : callExceedsStack ? "all-in" : "call";
  const raiseKey = isAllIn ? "all-in" : "raise";

  const foldEnabled      = !tut || tut === "fold";
  const checkCallEnabled = !tut || tut === checkCallKey;
  const raiseEnabled     = !tut || tut === raiseKey;

  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Button
        variant="contained"
        color="error"
        size="small"
        onClick={onFold}
        disabled={foldDisabled || (!foldEnabled && !!tut)}
        sx={!foldEnabled && tut ? { opacity: 0.35 } : undefined}
      >
        Fold
      </Button>

      {canCheck ? (
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={onCheckOrCall}
          disabled={checkDisabled || (!checkCallEnabled && !!tut)}
          sx={{
            ...(checkDisabled ? { opacity: 0.4 } : {}),
            ...(!checkCallEnabled && tut ? { opacity: 0.35 } : {}),
            ...(checkCallEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
          }}
        >
          Check
        </Button>
      ) : callExceedsStack ? (
        <Button
          variant="contained"
          color="info"
          size="small"
          onClick={onCheckOrCall}
          disabled={!checkCallEnabled && !!tut}
          sx={{
            ...(!checkCallEnabled && tut ? { opacity: 0.35 } : {}),
            ...(checkCallEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
          }}
        >
          All-in {heroStack}
        </Button>
      ) : (
        <Button
          variant="contained"
          color="info"
          size="small"
          onClick={onCheckOrCall}
          disabled={!checkCallEnabled && !!tut}
          sx={{
            ...(!checkCallEnabled && tut ? { opacity: 0.35 } : {}),
            ...(checkCallEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
          }}
        >
          Call {toCall}
        </Button>
      )}

      <Button
        variant="contained"
        color={isAllIn ? "warning" : "primary"}
        size="small"
        onClick={onRaiseOrAllIn}
        disabled={heroStack === 0 || (!raiseEnabled && !!tut)}
        sx={{
          ...(!raiseEnabled && tut ? { opacity: 0.35 } : {}),
          ...(raiseEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
        }}
      >
        {isAllIn ? `All-In (${heroStack})` : `${toCall === 0 ? "Bet" : "Raise"} ${clampedRaise}`}
      </Button>
    </Stack>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/components/Table/ActionButtons.tsx && git commit -m "feat: ActionButtons tutorialAllowedAction disables/highlights scripted move"
```

---

### Task 9: Thread `tutorialAllowedAction` through `ActionBar.tsx`

**Files:**
- Modify: `src/components/Table/ActionBar.tsx`

- [ ] **Step 1: Import `useTutorialOptional` and thread the prop**

Add import at the top of `ActionBar.tsx`:

```typescript
import { useTutorialOptional } from "../../tutorial/TutorialContext";
```

Inside the `ActionBar` component body, after the existing hooks, add:

```typescript
  const tutorial = useTutorialOptional();
  const tutorialAllowedAction = tutorial?.tutorialAllowedAction ?? null;
```

Pass it to `ActionButtons` — add the prop to the existing `<ActionButtons ... />` call:

```typescript
            tutorialAllowedAction={tutorialAllowedAction}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/components/Table/ActionBar.tsx && git commit -m "feat: ActionBar threads tutorialAllowedAction to ActionButtons"
```

---

### Task 10: Create `TutorialOverlay.tsx` and mount it

**Files:**
- Create: `src/components/Tutorial/TutorialOverlay.tsx`
- Modify: `src/components/Table/PokerTable.tsx`

- [ ] **Step 1: Create the overlay component**

```typescript
// src/components/Tutorial/TutorialOverlay.tsx
import { Box, Button, Typography } from "@mui/material";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

export function TutorialOverlay() {
  const tutorial = useTutorialOptional();

  if (!tutorial || !tutorial.narration) return null;

  const { narration, dismissNarration } = tutorial;

  return (
    <>
      {/* Pointer-events blocker: prevents clicking on the table while narrating */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bottom: 180,
          zIndex: 10,
          pointerEvents: "all",
        }}
      />

      {/* Narration panel */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 11,
          background: "rgba(10, 10, 20, 0.92)",
          borderTop: "2px solid #c9a96e",
          px: 3,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          maxHeight: 180,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(201, 169, 110, 0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "0.65rem",
          }}
        >
          Tutorial
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{ color: "#c9a96e", fontWeight: 600, lineHeight: 1.2 }}
        >
          {narration.title}
        </Typography>

        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
          {narration.body}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            onClick={dismissNarration}
            sx={{ background: "#7b5ea7", "&:hover": { background: "#9370cc" } }}
          >
            Continue →
          </Button>
        </Box>
      </Box>
    </>
  );
}
```

- [ ] **Step 2: Read `PokerTable.tsx` to find the correct mounting location**

Read `src/components/Table/PokerTable.tsx` and identify the outermost `Box` or container element's closing tag. Add the overlay just before the outermost container closes.

- [ ] **Step 3: Mount `TutorialOverlay` in `PokerTable.tsx`**

Add the import:
```typescript
import { TutorialOverlay } from "../Tutorial/TutorialOverlay";
```

Add just before the outermost container's closing tag:
```tsx
      <TutorialOverlay />
```

(`TutorialOverlay` returns `null` when `useTutorialOptional()` returns null, making this safe in normal game mode.)

- [ ] **Step 4: Run tests**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/components/Tutorial/TutorialOverlay.tsx src/components/Table/PokerTable.tsx && git commit -m "feat: add TutorialOverlay narration panel; mount in PokerTable"
```

---

### Task 11: Wire up routing and pages

**Files:**
- Create: `src/pages/TutorialGamePage.tsx`
- Modify: `src/pages/GamePage.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `TutorialGamePage.tsx`**

```typescript
// src/pages/TutorialGamePage.tsx
import { TutorialProvider } from "../tutorial/TutorialContext";
import { GamePage } from "./GamePage";

export function TutorialGamePage() {
  return (
    <TutorialProvider>
      <GamePage isTutorial />
    </TutorialProvider>
  );
}
```

- [ ] **Step 2: Update `GamePage.tsx` to accept and forward `isTutorial`**

Replace the file:

```typescript
import { GameProvider } from "../store/GameContext";
import { PokerTable } from "../components/Table/PokerTable";

interface GamePageProps {
  isTutorial?: boolean;
}

export function GamePage({ isTutorial = false }: GamePageProps) {
  return (
    <GameProvider isTutorial={isTutorial}>
      <PokerTable />
    </GameProvider>
  );
}
```

- [ ] **Step 3: Add "tutorial" button to `HomePage.tsx`**

Inside the `<Stack direction="column" gap={1} ...>` that holds the two existing buttons, insert a new button between them:

```tsx
            <Button
              variant="outlined"
              component={Link as ElementType}
              size="small"
              to="/tutorial"
            >
              tutorial
            </Button>
```

- [ ] **Step 4: Add `/tutorial` route to `App.tsx`**

Add import:
```typescript
import { TutorialGamePage } from "./pages/TutorialGamePage";
```

Add route inside `<Routes>`:
```tsx
      <Route path="/tutorial" element={<TutorialGamePage />} />
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npx tsc --noEmit 2>&1 | head -20
```

Expected: No new errors

- [ ] **Step 6: Run tests**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 7: Smoke test**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run dev
```

Open http://localhost:5173 and verify:
- "tutorial" button appears between "start new game" and "learn to play"
- Clicking it navigates to `/tutorial`
- Cards deal (scripted: hero gets Page♥ + 3♣)
- Action bar shows "Call" with gold border highlight on hero's turn

- [ ] **Step 8: Commit**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && git add src/pages/TutorialGamePage.tsx src/pages/GamePage.tsx src/pages/HomePage.tsx src/App.tsx && git commit -m "feat: /tutorial route, TutorialGamePage wrapper, Tutorial button on home screen"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run test 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Run full build**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker && npm run build 2>&1 | tail -20
```

Expected: Build succeeds, no TypeScript errors

- [ ] **Manual end-to-end walkthrough**

1. Navigate to http://localhost:5173
2. Click "tutorial" — verify route `/tutorial` loads
3. **Round 1:** Verify hero is dealt Page♥ + 3♣ (visible in hand)
4. Verify bot actions fire in order (Swordsman raises pre-flop, etc.)
5. On hero's turns: verify only the gold-highlighted button is active
6. Verify flop = A♠ 2♦ 4♣ (from queue, not random)
7. At showdown: verify narration "The Page in a Straight" appears
8. After Continue: verify page-bonus narration appears
9. After Continue: verify "Round 1 Complete" narration appears
10. After Continue: verify Round 2 starts (hero gets 10♣ + Q♠)
11. **Round 2:** Verify flop = 6♥ J♦ Page♠ → narration "A Page Appears"
12. After Continue: REVEAL_ARCANA fires → "The Fool" narration appears
13. Verify Fool icon replaces Page on the board
14. At showdown: verify narration "The Fool as a King"
15. After Continue: verify "Tutorial Complete" narration
16. After Continue: verify navigation returns to home screen (`/`)
