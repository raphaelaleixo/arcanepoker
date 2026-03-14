# Playground Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dev-only "Arcana Playground" tool that lets the user force any of the 22 Major Arcana to activate immediately during a hand, including a fully interactive Priestess reveal mechanic.

**Architecture:** New `FORCE_ARCANA` action routes through the existing `applyArcana()` function so all arcana behave identically to natural triggers. A `PlaygroundDrawer` component (MUI Drawer, right-anchored) lists all 22 arcana; a fixed DEV button in `PokerTable` opens it. Priestess is upgraded from a visual no-op to a full interactive mechanic with bot auto-reveal and hero card-picker.

**Tech Stack:** React 18, TypeScript, MUI v5, Vitest, `useReducer` via `GameContext`.

---

## Chunk 1: State types + `FORCE_ARCANA` reducer + Priestess state

### Files
- Modify: `src/store/storeTypes.ts` — add `priestessRevealedCards` field; add `FORCE_ARCANA` and `RESOLVE_PRIESTESS` actions
- Modify: `src/store/initialState.ts` — add `priestessRevealedCards: {}` to initial state
- Modify: `src/store/gameReducer.ts` — add `FORCE_ARCANA` handler; rewrite `case "priestess-reveal"`; add `resolvePriestess()`; handle `RESOLVE_PRIESTESS`; reset field in `startHand`
- Create: `src/store/__tests__/gameReducer.test.ts` — tests for `FORCE_ARCANA` and Priestess

---

### Task 1: Add `priestessRevealedCards` state field + `FORCE_ARCANA` / `RESOLVE_PRIESTESS` actions

**Files:**
- Modify: `src/store/storeTypes.ts`

- [ ] **Step 1: Add `priestessRevealedCards` to `StoreGameState`**

In `storeTypes.ts`, inside the `// ── Arcana-specific state ──` section (after `temperanceChoices`), add:

```typescript
  /** Cards each player has chosen to reveal face-up (Priestess effect). */
  priestessRevealedCards: Record<string, StandardCard>;
```

- [ ] **Step 2: Add `FORCE_ARCANA` and `RESOLVE_PRIESTESS` to `GameAction` union**

In `storeTypes.ts`, add the `ArcanaValue` import (it lives in `../types/types`):

```typescript
import type {
  StandardCard,
  ArcanaCard,
  GameStage,
  ActionType,
  HumanPlayer,
  ArcanaValue,   // ← add this
} from "../types/types";
```

Then add to the `GameAction` union (after `RESOLVE_JUDGEMENT`):

```typescript
  | { type: "FORCE_ARCANA"; payload: { value: ArcanaValue } }
  | { type: "RESOLVE_PRIESTESS"; payload: { card: StandardCard } }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors related to `storeTypes.ts`.

---

### Task 2: Update `initialState.ts` to include `priestessRevealedCards`

**Files:**
- Modify: `src/store/initialState.ts`

- [ ] **Step 1: Add `priestessRevealedCards: {}` to `createInitialState()`**

In the return object of `createInitialState()`, after `temperanceChoices: {}`, add:

```typescript
    priestessRevealedCards: {},
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

### Task 3: Write failing tests for `FORCE_ARCANA` and Priestess

**Files:**
- Create: `src/store/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { describe, it, expect } from "vitest";
import { gameReducer } from "../gameReducer";
import { createInitialState } from "../initialState";
import type { StoreGameState } from "../storeTypes";
import type { ArcanaValue } from "../../types/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePreFlopState(): StoreGameState {
  // START_GAME produces a pre-flop state
  return gameReducer(createInitialState(), { type: "START_GAME" });
}

// ─── FORCE_ARCANA ─────────────────────────────────────────────────────────────

describe("FORCE_ARCANA", () => {
  it("returns state unchanged when stage is pre-game", () => {
    const state = createInitialState(); // stage === "pre-game"
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("returns state unchanged when stage is showdown", () => {
    const state = { ...makePreFlopState(), stage: "showdown" as const };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("returns state unchanged when stage is deal", () => {
    const state = { ...makePreFlopState(), stage: "deal" as const };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("returns state unchanged when stage is results", () => {
    const state = { ...makePreFlopState(), stage: "results" as const };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("sets activeArcana when forced in pre-flop (Strength=8)", () => {
    const state = makePreFlopState();
    expect(state.stage).toBe("pre-flop");
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(next.activeArcana?.card.value).toBe("8");
    expect(next.activeArcana?.effectKey).toBe("strength-invert");
  });

  it("sets arcanaTriggeredThisRound: true after force", () => {
    const state = makePreFlopState();
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(next.arcanaTriggeredThisRound).toBe(true);
  });

  it("bypasses hierophantShield when forcing", () => {
    const state = { ...makePreFlopState(), hierophantShield: true };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(next.activeArcana?.card.value).toBe("8");
  });

  it("replaces an existing active arcana", () => {
    const state = makePreFlopState();
    const withA = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "4" as ArcanaValue } });
    expect(withA.activeArcana?.card.value).toBe("4");
    const withB = gameReducer(withA, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(withB.activeArcana?.card.value).toBe("8");
  });
});

// ─── Priestess reveal ─────────────────────────────────────────────────────────

describe("Priestess reveal (FORCE_ARCANA value=2)", () => {
  it("bots reveal their lower-value hole card", () => {
    const base = makePreFlopState();
    // Give bot-swords known cards: Ace (high) and 2 (low)
    const botId = "bot-swords";
    const state: StoreGameState = {
      ...base,
      players: base.players.map((p) =>
        p.id === botId
          ? { ...p, holeCards: [{ value: "A", suit: "hearts" }, { value: "2", suit: "clubs" }] }
          : p
      ),
    };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    // Bot should reveal the 2 (lower value), not the Ace
    expect(next.priestessRevealedCards[botId]).toEqual({ value: "2", suit: "clubs" });
  });

  it("sets pendingInteraction for hero when hero is not folded", () => {
    const state = makePreFlopState();
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    expect(next.pendingInteraction?.type).toBe("priestess-reveal");
  });

  it("does not set pendingInteraction for hero when hero is folded", () => {
    const base = makePreFlopState();
    const hero = base.players.find((p) => p.type === "human")!;
    const state = {
      ...base,
      players: base.players.map((p) =>
        p.id === hero.id ? { ...p, folded: true } : p
      ),
    };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    expect(next.pendingInteraction).toBeNull();
  });
});

describe("RESOLVE_PRIESTESS", () => {
  it("stores hero's chosen card in priestessRevealedCards and clears pendingInteraction", () => {
    const base = makePreFlopState();
    const withPriestess = gameReducer(base, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    expect(withPriestess.pendingInteraction?.type).toBe("priestess-reveal");

    const hero = withPriestess.players.find((p) => p.type === "human")!;
    const chosenCard = hero.holeCards[0];

    const next = gameReducer(withPriestess, { type: "RESOLVE_PRIESTESS", payload: { card: chosenCard } });
    expect(next.priestessRevealedCards[hero.id]).toEqual(chosenCard);
    expect(next.pendingInteraction).toBeNull();
  });
});

describe("startHand resets priestessRevealedCards", () => {
  it("clears priestessRevealedCards on NEXT_HAND", () => {
    const base = makePreFlopState();
    // Manually inject some priestess data
    const state = { ...base, priestessRevealedCards: { "hero": { value: "A", suit: "hearts" } as any } };
    // Advance to showdown to allow NEXT_HAND
    const showdown = { ...state, stage: "showdown" as const, pendingInteraction: null };
    const next = gameReducer(showdown, { type: "NEXT_HAND" });
    expect(next.priestessRevealedCards).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- src/store/__tests__/gameReducer.test.ts
```

Expected: multiple test failures (FORCE_ARCANA and RESOLVE_PRIESTESS not implemented yet).

---

### Task 4: Implement `FORCE_ARCANA` handler in `gameReducer.ts`

**Files:**
- Modify: `src/store/gameReducer.ts`

- [ ] **Step 1: Add `case "FORCE_ARCANA"` to the main reducer switch**

In the `gameReducer` function's switch, after `case "NEXT_HAND"` and before `default`, add:

```typescript
    case "FORCE_ARCANA": {
      const VALID_STAGES = ["pre-flop", "flop", "turn", "river"] as const;
      if (!(VALID_STAGES as readonly string[]).includes(state.stage)) return state;
      const arcanaCard = { suit: "arcana" as const, value: action.payload.value };
      const resetState: StoreGameState = {
        ...state,
        activeArcana: null,
        hierophantShield: false,
        arcanaTriggeredThisRound: false,
      };
      return applyArcana(resetState, arcanaCard);
    }
```

- [ ] **Step 2: Run FORCE_ARCANA tests**

```bash
npm run test -- src/store/__tests__/gameReducer.test.ts --reporter=verbose
```

Expected: all `FORCE_ARCANA` describe block tests pass; Priestess tests still fail.

---

### Task 5: Implement Priestess interactive mechanic in `gameReducer.ts`

**Files:**
- Modify: `src/store/gameReducer.ts`

- [ ] **Step 1: Rewrite `case "priestess-reveal"` in `applyArcana`**

Replace the current no-op body:

```typescript
    case "priestess-reveal":
      // Each player reveals one hole card — handled by UI; no pending interaction needed
      // Bots reveal their lowest card (effect is visual; state unchanged)
      return base;
```

With:

```typescript
    case "priestess-reveal": {
      // Bots each reveal their lower-value hole card
      const priestessRevealedCards = { ...state.priestessRevealedCards };
      for (const p of base.players.filter((pl) => pl.type === "ai" && !pl.folded)) {
        if (p.holeCards.length === 0) continue;
        const sorted = [...p.holeCards].sort(
          (a, b) => (CARD_NUMERIC_VALUES[a.value] ?? 0) - (CARD_NUMERIC_VALUES[b.value] ?? 0)
        );
        priestessRevealedCards[p.id] = sorted[0];
      }
      return {
        ...base,
        priestessRevealedCards,
        pendingInteraction: heroFolded(base)
          ? null
          : { type: "priestess-reveal", playerId: HERO_ID },
      };
    }
```

- [ ] **Step 2: Add `resolvePriestess()` function** (place after `resolveJudgement`):

```typescript
function resolvePriestess(
  state: StoreGameState,
  card: StandardCard
): StoreGameState {
  return {
    ...state,
    priestessRevealedCards: {
      ...state.priestessRevealedCards,
      [HERO_ID]: card,
    },
    pendingInteraction: null,
  };
}
```

- [ ] **Step 3: Handle `RESOLVE_PRIESTESS` in main reducer switch** (after `case "RESOLVE_JUDGEMENT":`):

```typescript
    case "RESOLVE_PRIESTESS":
      return resolvePriestess(state, action.payload.card);
```

- [ ] **Step 4: Reset `priestessRevealedCards` in `startHand`**

In the `startHand()` return object, after `temperanceChoices: {}`, add:

```typescript
    priestessRevealedCards: {},
```

- [ ] **Step 5: Run all reducer tests**

```bash
npm run test -- src/store/__tests__/gameReducer.test.ts --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 6: Run full test suite to check for regressions**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/store/storeTypes.ts src/store/initialState.ts src/store/gameReducer.ts src/store/__tests__/gameReducer.test.ts
git commit -m "feat: add FORCE_ARCANA action and Priestess interactive reveal mechanic"
```

---

## Chunk 2: `PlaygroundDrawer` component + `InteractionModal` Priestess case

### Files
- Create: `src/components/Dev/PlaygroundDrawer.tsx`
- Modify: `src/components/Modals/InteractionModal.tsx` — add `"priestess-reveal"` case; remove it from early-return exclusion

---

### Task 6: Create `PlaygroundDrawer.tsx`

**Files:**
- Create: `src/components/Dev/PlaygroundDrawer.tsx`

- [ ] **Step 1: Create the file**

```typescript
import {
  Box,
  Button,
  Chip,
  Drawer,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import tarot from "../../data/tarot";
import type { ArcanaValue } from "../../types/types";

interface PlaygroundDrawerProps {
  open: boolean;
  onClose: () => void;
}

const VALID_STAGES = ["pre-flop", "flop", "turn", "river"] as const;

const ARCANA_LIST = Array.from({ length: 22 }, (_, i) => {
  const value = String(i) as ArcanaValue;
  const data = (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[value];
  return {
    value,
    fullName: data?.fullName ?? `Arcana ${i}`,
    gameEffect: data?.gameEffect ?? null,
  };
});

export function PlaygroundDrawer({ open, onClose }: PlaygroundDrawerProps) {
  const { state, dispatch } = useGame();
  const isValidStage = (VALID_STAGES as readonly string[]).includes(state.stage);

  function handleForce(value: ArcanaValue) {
    dispatch({ type: "FORCE_ARCANA", payload: { value } });
    onClose();
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 300,
          background: "#0F1A2E",
          borderLeft: "1px solid",
          borderColor: "secondary.dark",
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "rgba(155,89,182,0.2)" }}>
        <Typography
          variant="subtitle1"
          sx={{ color: "secondary.light", fontWeight: "bold" }}
        >
          ⚗ Arcana Playground
        </Typography>
        <Typography variant="caption" sx={{ color: "silver.dark" }}>
          Dev tool — force any arcana immediately
        </Typography>
      </Box>

      {!isValidStage && (
        <Typography
          variant="caption"
          sx={{ color: "silver.dark", px: 2, py: 1, display: "block" }}
        >
          Start a hand to force arcana
        </Typography>
      )}

      <List dense sx={{ overflowY: "auto", flex: 1 }}>
        {ARCANA_LIST.map(({ value, fullName, gameEffect }) => {
          const isActive = state.activeArcana?.card.value === value;
          return (
            <ListItem
              key={value}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                py: 1,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "silver.light", fontWeight: "bold", fontSize: "0.75rem" }}
                  >
                    {value}. {fullName}
                  </Typography>
                  {isActive && (
                    <Chip
                      label="Active"
                      size="small"
                      color="secondary"
                      sx={{ height: 16, fontSize: "0.6rem" }}
                    />
                  )}
                </Box>
                {gameEffect && (
                  <Typography
                    variant="caption"
                    sx={{ color: "silver.dark", display: "block", fontSize: "0.65rem" }}
                  >
                    {gameEffect}
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                variant="outlined"
                disabled={!isValidStage}
                onClick={() => handleForce(value)}
                sx={{
                  minWidth: 52,
                  flexShrink: 0,
                  fontSize: "0.65rem",
                  py: 0.25,
                  px: 0.75,
                  color: "secondary.light",
                  borderColor: "secondary.dark",
                  "&:hover": { borderColor: "secondary.main" },
                }}
              >
                Force
              </Button>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

### Task 7: Add Priestess case to `InteractionModal`

**Files:**
- Modify: `src/components/Modals/InteractionModal.tsx`

- [ ] **Step 1: Add `"priestess-reveal"` to `dialogTitle()`**

In the `dialogTitle` switch, after `case "judgement-return":`, add:

```typescript
    case "priestess-reveal":
      return "The High Priestess: Reveal a Card";
```

- [ ] **Step 2: Ensure `"priestess-reveal"` is NOT in the early-return exclusion**

The early-return block must exclude only `"tarot-reading"`, `"arcana-reveal"`, and `"page-challenge"`. If `"priestess-reveal"` appears in this block, remove it. The block should be exactly:

```typescript
  if (
    pendingInteraction === null ||
    pendingInteraction.type === "tarot-reading" ||
    pendingInteraction.type === "arcana-reveal" ||
    pendingInteraction.type === "page-challenge"
  ) {
    return null;
  }
```

Read the file first and verify `"priestess-reveal"` is absent. If it is present, remove it so the modal renders for Priestess interactions.

- [ ] **Step 3: Add handler function for Priestess** (after `handleJudgement`):

```typescript
  function handlePriestess(card: StandardCard) {
    dispatch({ type: "RESOLVE_PRIESTESS", payload: { card } });
  }
```

- [ ] **Step 4: Add Priestess content block in `<DialogContent>`** (after `judgement-return` block):

```typescript
        {pendingInteraction.type === "priestess-reveal" && hero && (
          <Box>
            <Typography
              variant="body2"
              sx={{ color: "silver.light", textAlign: "center", mb: 2 }}
            >
              Choose one of your hole cards to reveal to all players.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              {hero.holeCards.map((card, i) => (
                <Box
                  key={i}
                  onClick={() => handlePriestess(card)}
                  sx={{
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-8px)" },
                  }}
                >
                  <PlayingCard
                    rank={card.value}
                    suit={card.suit}
                    flipped
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Dev/PlaygroundDrawer.tsx src/components/Modals/InteractionModal.tsx
git commit -m "feat: add PlaygroundDrawer and Priestess InteractionModal case"
```

---

## Chunk 3: PokerTable integration + PlayerSeat revealed card display

### Files
- Modify: `src/components/Table/PokerTable.tsx` — import drawer, add toggle state, add DEV button, render drawer
- Modify: `src/components/Table/PlayerSeat.tsx` — show revealed card when `priestessRevealedCards[player.id]` is set

---

### Task 8: Integrate `PlaygroundDrawer` into `PokerTable`

**Files:**
- Modify: `src/components/Table/PokerTable.tsx`

- [ ] **Step 1: Add import and state**

After the existing imports, add:

```typescript
import { PlaygroundDrawer } from "../Dev/PlaygroundDrawer";
```

After `const [showTarot, setShowTarot] = useState(false);`, add:

```typescript
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
```

- [ ] **Step 2: Add DEV button and render drawer**

After `<InteractionModal />`, add:

```tsx
      <Button
        size="small"
        variant="outlined"
        onClick={() => setPlaygroundOpen(true)}
        sx={{
          position: "fixed",
          bottom: 16,
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
        ⚗ DEV
      </Button>
      <PlaygroundDrawer open={playgroundOpen} onClose={() => setPlaygroundOpen(false)} />
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

### Task 9: Show revealed card in `PlayerSeat`

**Files:**
- Modify: `src/components/Table/PlayerSeat.tsx`

- [ ] **Step 1: Read `priestessRevealedCards` from state**

In `PlayerSeat`, after `const isShowdown = state.stage === "showdown";`, add:

```typescript
  const revealedCard = state.priestessRevealedCards?.[player.id] ?? null;
```

- [ ] **Step 2: Render revealed card below the normal hole cards**

After the closing `</Stack>` for the cards section (line ~146), add:

```tsx
      {/* Priestess revealed card */}
      {revealedCard && (
        <Box sx={{ mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ color: "secondary.light", fontSize: "0.6rem", display: "block", textAlign: "center" }}
          >
            Revealed
          </Typography>
          <Stack direction="row" justifyContent="center">
            <PlayingCard
              small
              rank={revealedCard.value}
              suit={revealedCard.suit}
              flipped
            />
          </Stack>
        </Box>
      )}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/PokerTable.tsx src/components/Table/PlayerSeat.tsx
git commit -m "feat: integrate PlaygroundDrawer into PokerTable; show Priestess revealed cards in PlayerSeat"
```

---

## Chunk 4: Manual smoke test checklist

No automated tests cover UI integration — verify manually with `npm run dev`.

- [ ] **Smoke test 1 — DEV button visible**
  - Start the dev server: `npm run dev`
  - Click "Begin" to start a game
  - Confirm a faint `⚗ DEV` button appears at bottom-right

- [ ] **Smoke test 2 — Drawer opens and lists arcana**
  - Click `⚗ DEV`
  - Confirm the right-side drawer shows all 22 arcana (0–21) with Force buttons enabled

- [ ] **Smoke test 3 — Force disabled in pre-game**
  - Refresh to return to the "Begin" screen (pre-game stage)
  - Click `⚗ DEV`
  - Confirm all Force buttons are disabled and the "Start a hand to force arcana" note appears

- [ ] **Smoke test 4 — Force Strength (8)**
  - Start a hand, click `⚗ DEV`, click Force next to "8. Strength"
  - Confirm drawer closes and the active arcana chip (if any) shows Strength

- [ ] **Smoke test 5 — Force Priestess (2)**
  - Start a hand, click `⚗ DEV`, click Force next to "2. The High Priestess"
  - Confirm the InteractionModal opens: "The High Priestess: Reveal a Card"
  - Click one of your hole cards
  - Confirm the modal closes and that card appears as "Revealed" in each bot's seat

- [ ] **Smoke test 6 — Force terminal arcana (Wheel=10)**
  - Start a hand, click `⚗ DEV`, click Force next to "10. Wheel of Fortune"
  - Confirm the hand resets (Wheel triggers a redeal)
  - Confirm no "Active" chip appears for Wheel (known limitation per spec)

- [ ] **Smoke test 7 — Force interactive arcana (Chariot=7)**
  - Start a hand, click `⚗ DEV`, click Force next to "7. The Chariot"
  - Confirm drawer closes and the InteractionModal for Chariot opens immediately

- [ ] **Step: Final commit if any fixes were made during smoke testing**

```bash
git add -p
git commit -m "fix: smoke test corrections for playground mode"
```
