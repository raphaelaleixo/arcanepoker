# Game Over Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a game-over modal with final standings and a Play Again button when the hero is eliminated or The World (arcana 21) triggers the final hand.

**Architecture:** Add `"game-over"` to `GameStage`; intercept `NEXT_HAND` in `prepareNextHand` to return a `"game-over"` state instead of the normal next-hand state, and update the `NEXT_HAND` reducer case to skip `startHand` when the prepared state is already `"game-over"`. A new `GameOverModal` component reads `state.stage` and renders conditionally; mounted once in `PokerTable`.

**Tech Stack:** React 18, TypeScript, MUI v5, Vitest

---

## Chunk 1: Types + Reducer

### Task 1: Add `"game-over"` to `GameStage`

**Files:**
- Modify: `src/types/types.ts`

- [ ] **Step 1: Add the new stage value**

In `src/types/types.ts`, change:
```ts
export type GameStage =
  | "pre-game"
  | "deal"
  | "pre-flop"
  | "flop"
  | "turn"
  | "river"
  | "empress"
  | "showdown"
  | "results";
```
to:
```ts
export type GameStage =
  | "pre-game"
  | "deal"
  | "pre-flop"
  | "flop"
  | "turn"
  | "river"
  | "empress"
  | "showdown"
  | "results"
  | "game-over";
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run build 2>&1 | head -30`
Expected: compiles cleanly

---

### Task 2: Guard `prepareNextHand` and `NEXT_HAND` case for game-over

**Files:**
- Modify: `src/store/gameReducer.ts`
- Test: `src/store/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Write failing tests**

Open `src/store/__tests__/gameReducer.test.ts` and add a new `describe` block (use the same import style as the existing test file — `gameReducer` and `createInitialState` are already imported there):

```ts
describe("NEXT_HAND → game-over transitions", () => {
  function makeShowdownState(overrides: Partial<StoreGameState> = {}): StoreGameState {
    // Use START_GAME to get a fully initialised state, then force showdown.
    const base = gameReducer(createInitialState(), { type: "START_GAME" });
    return {
      ...base,
      stage: "showdown",
      winnerIds: [],
      handResults: [],
      potWon: 0,
      ...overrides,
    };
  }

  it("transitions to game-over when hero stack is 0", () => {
    const state = makeShowdownState();
    const players = state.players.map((p) =>
      p.id === "hero" ? { ...p, stack: 0 } : p,
    );
    const next = gameReducer({ ...state, players }, { type: "NEXT_HAND" });
    expect(next.stage).toBe("game-over");
  });

  it("transitions to game-over when isFinalHand is true", () => {
    const state = makeShowdownState({ isFinalHand: true });
    const next = gameReducer(state, { type: "NEXT_HAND" });
    expect(next.stage).toBe("game-over");
  });

  it("preserves all players in state on game-over so standings are available", () => {
    const state = makeShowdownState({ isFinalHand: true });
    const next = gameReducer(state, { type: "NEXT_HAND" });
    expect(next.players.length).toBe(state.players.length);
  });

  it("continues normally when hero is alive and isFinalHand is false", () => {
    const state = makeShowdownState();
    const next = gameReducer(state, { type: "NEXT_HAND" });
    expect(next.stage).not.toBe("game-over");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm run test -- --reporter=verbose 2>&1 | grep -A 3 "game-over transitions"`
Expected: first 3 tests fail, last passes

- [ ] **Step 3: Update `prepareNextHand`**

In `src/store/gameReducer.ts`, replace the body of `prepareNextHand`:

```ts
function prepareNextHand(state: StoreGameState): StoreGameState {
  const heroAlive = state.players.some(
    (p) => p.id === HERO_ID_CONST && p.stack > 0,
  );
  const isGameOver = state.isFinalHand || !heroAlive;

  if (isGameOver) {
    // Preserve players with current stacks so the modal can show final standings.
    return { ...state, stage: "game-over" };
  }

  const n = state.players.length;
  const newDealer = (state.dealerIndex + 1) % n;
  const activePlayers = state.players.filter((p) => p.stack > 0);

  return {
    ...state,
    players: activePlayers,
    dealerIndex: newDealer % activePlayers.length,
    handNumber: state.handNumber + 1,
    activeArcana: null,
    arcanaTriggeredThisRound: false,
  };
}
```

- [ ] **Step 4: Update the `NEXT_HAND` case in the reducer switch**

`NEXT_HAND` currently reads:
```ts
case "NEXT_HAND":
  return startHand(prepareNextHand(state));
```

Change it to:
```ts
case "NEXT_HAND": {
  const prepared = prepareNextHand(state);
  return prepared.stage === "game-over" ? prepared : startHand(prepared);
}
```

This ensures `startHand` is never called when `prepareNextHand` has already flagged the game as over.

- [ ] **Step 5: Run tests to confirm they pass**

Run: `npm run test -- --reporter=verbose 2>&1 | grep -A 3 "game-over transitions"`
Expected: all 4 tests pass

- [ ] **Step 6: Run full test suite**

Run: `npm run test`
Expected: all tests pass (no regressions)

- [ ] **Step 7: Commit**

```bash
git add src/types/types.ts src/store/gameReducer.ts src/store/__tests__/gameReducer.test.ts
git commit -m "feat: add game-over stage and guard prepareNextHand"
```

---

## Chunk 2: Modal + Wiring

### Task 3: Create `GameOverModal`

**Files:**
- Create: `src/components/Modals/GameOverModal.tsx`

Note: `gold.main`, `gold.dark`, `gold.light`, `silver.light`, and `secondary.*` are custom palette tokens defined in this project's MUI theme — they are safe to use, as confirmed by their use in `ResultsModal.tsx` and throughout the codebase.

- [ ] **Step 1: Create the component**

```tsx
/**
 * Shown when the game ends — either the hero is eliminated or The World (21)
 * triggers the final hand. Displays final standings and a Play Again button.
 */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";

export function GameOverModal() {
  const { state, dispatch } = useGame();

  if (state.stage !== "game-over") return null;

  const heroAlive = state.players.some(
    (p) => p.id === HERO_ID_CONST && p.stack > 0,
  );
  const title = heroAlive ? "The World's Decree" : "Eliminated";
  const subtitle = heroAlive
    ? "The World has spoken — the game is complete."
    : "Your chips have run dry. The arcane table claims another soul.";

  const standings = [...state.players].sort((a, b) => b.stack - a.stack);

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: "linear-gradient(135deg, #1a0a2e 0%, #0a0a0a 100%)",
            border: "1px solid",
            borderColor: "secondary.dark",
            boxShadow: "0 0 40px rgba(108,52,131,0.35)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "secondary.light",
          fontFamily: '"Georgia", "Times New Roman", serif',
          textAlign: "center",
          fontSize: "1.6rem",
          letterSpacing: "0.08em",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Typography
          variant="body2"
          sx={{
            color: "silver.light",
            fontStyle: "italic",
            textAlign: "center",
            mb: 3,
          }}
        >
          {subtitle}
        </Typography>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />

        <Stack spacing={1}>
          {standings.map((player, rank) => {
            const isFirst = rank === 0;
            return (
              <Box
                key={player.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: isFirst ? "gold.dark" : "rgba(255,255,255,0.08)",
                  background: isFirst
                    ? "rgba(255,215,0,0.07)"
                    : "rgba(0,0,0,0.2)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isFirst ? "gold.main" : "silver.light",
                    fontWeight: isFirst ? "bold" : "normal",
                  }}
                >
                  #{rank + 1} {player.name}
                  {isFirst ? " \u2605" : ""}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  &#9824; {player.stack}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "START_GAME" })}
          sx={{
            px: 5,
            py: 1,
            background: "linear-gradient(135deg, #4a1a6e, #1a0a2e)",
            border: "1px solid",
            borderColor: "secondary.main",
            color: "secondary.light",
            letterSpacing: "0.08em",
            "&:hover": {
              background: "linear-gradient(135deg, #6c3483, #2d0f4e)",
              borderColor: "secondary.light",
            },
          }}
        >
          Play Again
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Mount in `PokerTable`**

In `src/components/Table/PokerTable.tsx`:

Add import at the top with the other modal imports:
```ts
import { GameOverModal } from "../Modals/GameOverModal";
```

Add `<GameOverModal />` in the modals block (after `<InteractionModal />`):
```tsx
<InteractionModal />
<GameOverModal />
<DealerChip />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`
Expected: no errors

- [ ] **Step 4: Run full test suite**

Run: `npm run test`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/Modals/GameOverModal.tsx src/components/Table/PokerTable.tsx
git commit -m "feat: add GameOverModal for hero elimination and World trigger"
```
