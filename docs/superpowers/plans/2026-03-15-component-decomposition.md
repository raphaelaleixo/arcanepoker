# Component Decomposition Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break large UI components (230–304 lines) into focused single-responsibility files and add JSDoc documentation throughout.

**Architecture:** Co-located sibling files in existing folders (`Table/`, `Modals/`). Pure helper functions extracted to `src/utils/`. No barrel files — all imports are direct paths. Card components (`src/components/Card/`) are finalized and untouched.

**Tech Stack:** React 18, TypeScript, Vite, Material-UI v5, Vitest, @testing-library/react

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `src/utils/cardUtils.ts` | `actionLabel`, `actionColor`, `formatHandRank` |
| `src/utils/stageUtils.ts` | `stagePill`, `stageColor` |
| `src/utils/__tests__/cardUtils.test.ts` | Unit tests for cardUtils |
| `src/utils/__tests__/stageUtils.test.ts` | Unit tests for stageUtils |
| `src/components/Table/PlayerCards.tsx` | Hole card rendering, Priestess reveal, selection highlight |
| `src/components/Table/PlayerStatusBar.tsx` | Action chip / hand rank cross-fade, bet line |
| `src/components/Table/RaiseSlider.tsx` | Raise amount label + MUI Slider |
| `src/components/Table/ActionButtons.tsx` | Fold / Check\|Call / Raise\|All-In buttons |
| `src/components/Table/CommunityCards.tsx` | Community card row, Fool substitution, empty slots |
| `src/components/Table/PotDisplay.tsx` | Pot/Bet display and showdown winner text |
| `src/components/Table/ArcanaDisplay.tsx` | Floating arcana card, description box, animations |
| `src/components/Table/TableOverlayContent.tsx` | All 4 overlay UIs (card-pick, page-challenge, arcana-reveal, showdown) |
| `src/components/Modals/StarDiscardContent.tsx` | Star arcana: body + Discard/Keep buttons |
| `src/components/Modals/MoonSwapContent.tsx` | Moon arcana: body + Swap/Keep buttons |
| `src/components/Modals/MagicianGuessContent.tsx` | Magician arcana: body + 4 suit buttons |
| `src/components/Modals/JudgementReturnContent.tsx` | Judgement arcana: body + Rejoin/Sit Out buttons |
| `src/components/Table/__tests__/PlayerCards.test.tsx` | Smoke tests |
| `src/components/Table/__tests__/PlayerStatusBar.test.tsx` | Smoke tests |
| `src/components/Table/__tests__/RaiseSlider.test.tsx` | Smoke tests |
| `src/components/Table/__tests__/ActionButtons.test.tsx` | Smoke tests |

### Modified files

| File | Change |
|------|--------|
| `src/components/Table/PlayerSeat.tsx` | Delete local helpers; import from utils; delegate rendering to PlayerCards + PlayerStatusBar |
| `src/components/Table/ActionBar.tsx` | Delete ActionBarInner; import from utils; compose RaiseSlider + ActionButtons |
| `src/components/Table/CommunityArea.tsx` | Delete local helpers; import from utils; compose CommunityCards + PotDisplay + ArcanaDisplay |
| `src/components/Table/PokerTable.tsx` | Delegate overlay UIs to TableOverlayContent |
| `src/components/Modals/InteractionModal.tsx` | Pre-bind dispatch callbacks; compose *Content components |
| `src/components/Modals/ResultsModal.tsx` | Delete local `formatHandRank`; import from `cardUtils` |

---

## Chunk 1: Utility Functions

### Task 1: `src/utils/cardUtils.ts`

**Files:**
- Create: `src/utils/__tests__/cardUtils.test.ts` (`src/utils/` does not exist yet — Vite/Node will create it when you write the file)
- Create: `src/utils/cardUtils.ts`
- Modify: `src/components/Modals/ResultsModal.tsx` — delete local `formatHandRank`, import from `cardUtils`
- Note: local helpers in `PlayerSeat.tsx` and `CommunityArea.tsx` are deleted when those files are fully replaced in Tasks 5 and 12 respectively.

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/cardUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { actionLabel, actionColor, formatHandRank } from '../cardUtils';

describe('actionLabel', () => {
  it('maps each action to a display label', () => {
    expect(actionLabel('fold')).toBe('Fold');
    expect(actionLabel('check')).toBe('Check');
    expect(actionLabel('call')).toBe('Call');
    expect(actionLabel('raise')).toBe('Raise');
    expect(actionLabel('bet')).toBe('Bet');
    expect(actionLabel('all-in')).toBe('All-In');
    expect(actionLabel('smallBlind')).toBe('SB');
    expect(actionLabel('bigBlind')).toBe('BB');
  });

  it('returns the raw value for unknown actions', () => {
    expect(actionLabel('unknown')).toBe('unknown');
  });
});

describe('actionColor', () => {
  it('returns error for fold', () => expect(actionColor('fold')).toBe('error'));
  it('returns warning for aggressive actions', () => {
    expect(actionColor('raise')).toBe('warning');
    expect(actionColor('bet')).toBe('warning');
    expect(actionColor('all-in')).toBe('warning');
  });
  it('returns info for call', () => expect(actionColor('call')).toBe('info'));
  it('returns success for check', () => expect(actionColor('check')).toBe('success'));
  it('returns default for unknown', () => expect(actionColor('unknown')).toBe('default'));
});

describe('formatHandRank', () => {
  it('converts kebab-case to Title Case', () => {
    expect(formatHandRank('two-pair')).toBe('Two Pair');
    expect(formatHandRank('royal-flush')).toBe('Royal Flush');
    expect(formatHandRank('straight-flush')).toBe('Straight Flush');
  });
  it('handles single-word ranks', () => {
    expect(formatHandRank('pair')).toBe('Pair');
    expect(formatHandRank('flush')).toBe('Flush');
  });
});
```

- [ ] **Step 2: Run tests — expect them to fail**

```bash
npm run test -- cardUtils
```

Expected: FAIL — `Cannot find module '../cardUtils'`

- [ ] **Step 3: Create `src/utils/cardUtils.ts`**

```typescript
/**
 * Shared display helpers for player actions.
 * Used by PlayerSeat and PlayerStatusBar.
 */

/** Maps a player action string to a human-readable display label. */
export function actionLabel(action: string): string {
  switch (action) {
    case "fold":       return "Fold";
    case "check":      return "Check";
    case "call":       return "Call";
    case "raise":      return "Raise";
    case "bet":        return "Bet";
    case "all-in":     return "All-In";
    case "smallBlind": return "SB";
    case "bigBlind":   return "BB";
    default:           return action;
  }
}

/** Maps a player action string to a MUI Chip color variant. */
export function actionColor(
  action: string
): "default" | "error" | "warning" | "success" | "info" | "primary" | "secondary" {
  switch (action) {
    case "fold":   return "error";
    case "raise":
    case "bet":
    case "all-in": return "warning";
    case "call":   return "info";
    case "check":  return "success";
    default:       return "default";
  }
}

/** Converts a kebab-case hand rank to Title Case (e.g. "two-pair" → "Two Pair"). */
export function formatHandRank(rank: string): string {
  return rank
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
```

- [ ] **Step 4: Run tests — expect them to pass**

```bash
npm run test -- cardUtils
```

Expected: PASS — 8 tests

- [ ] **Step 5: Update `src/components/Modals/ResultsModal.tsx` to use `cardUtils`**

At the top of `ResultsModal.tsx`, add the import and delete the local `formatHandRank` function:

```diff
+import { formatHandRank } from "../../utils/cardUtils";

-function formatHandRank(rank: string): string {
-  return rank
-    .split("-")
-    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
-    .join(" ");
-}
```

The existing `formatHandRank(...)` call sites in `ResultsModal.tsx` remain unchanged — they now resolve to the shared util.

- [ ] **Step 6: Run the full test suite to verify nothing regressed**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/utils/cardUtils.ts src/utils/__tests__/cardUtils.test.ts src/components/Modals/ResultsModal.tsx
git commit -m "feat: extract cardUtils; update ResultsModal to use shared formatHandRank"
```

---

### Task 2: `src/utils/stageUtils.ts`

**Files:**
- Create: `src/utils/__tests__/stageUtils.test.ts`
- Create: `src/utils/stageUtils.ts`
- Note: local `stagePill` and `stageColor` in `CommunityArea.tsx` are deleted when that file is fully replaced in Task 12.

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/stageUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { stagePill, stageColor } from '../stageUtils';

describe('stagePill', () => {
  it('returns display labels for all stages', () => {
    expect(stagePill('pre-flop')).toBe('Pre-Flop');
    expect(stagePill('flop')).toBe('Flop');
    expect(stagePill('turn')).toBe('Turn');
    expect(stagePill('river')).toBe('River');
    expect(stagePill('empress')).toBe('Empress');
    expect(stagePill('showdown')).toBe('Showdown');
  });
  it('returns the raw value for unknown stages', () => {
    expect(stagePill('unknown')).toBe('unknown');
  });
});

describe('stageColor', () => {
  it('returns correct MUI chip color for each stage', () => {
    expect(stageColor('pre-flop')).toBe('info');
    expect(stageColor('flop')).toBe('primary');
    expect(stageColor('turn')).toBe('warning');
    expect(stageColor('river')).toBe('secondary');
    expect(stageColor('empress')).toBe('error');
    expect(stageColor('showdown')).toBe('success');
  });
  it('returns default for unknown stages', () => {
    expect(stageColor('unknown')).toBe('default');
  });
});
```

- [ ] **Step 2: Run tests — expect them to fail**

```bash
npm run test -- stageUtils
```

Expected: FAIL — `Cannot find module '../stageUtils'`

- [ ] **Step 3: Create `src/utils/stageUtils.ts`**

```typescript
/**
 * Shared display helpers for game stages.
 * Used by CommunityArea and its sub-components.
 */

/** Returns a human-readable display label for a game stage. */
export function stagePill(stage: string): string {
  switch (stage) {
    case "pre-flop":  return "Pre-Flop";
    case "flop":      return "Flop";
    case "turn":      return "Turn";
    case "river":     return "River";
    case "empress":   return "Empress";
    case "showdown":  return "Showdown";
    default:          return stage;
  }
}

/** Returns the MUI Chip color variant for a game stage. */
export function stageColor(
  stage: string
): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (stage) {
    case "pre-flop":  return "info";
    case "flop":      return "primary";
    case "turn":      return "warning";
    case "river":     return "secondary";
    case "empress":   return "error";
    case "showdown":  return "success";
    default:          return "default";
  }
}
```

- [ ] **Step 4: Run tests — expect them to pass**

```bash
npm run test -- stageUtils
```

Expected: PASS — 7 tests

- [ ] **Step 5: Run full test suite to verify nothing regressed**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/stageUtils.ts src/utils/__tests__/stageUtils.test.ts
git commit -m "feat: extract stageUtils with stagePill and stageColor"
```

---

## Chunk 2: PlayerSeat Decomposition

### Task 3: `src/components/Table/PlayerCards.tsx`

**Files:**
- Create: `src/components/Table/__tests__/PlayerCards.test.tsx`
- Create: `src/components/Table/PlayerCards.tsx`

- [ ] **Step 1: Write the smoke test**

Create `src/components/Table/__tests__/PlayerCards.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PlayerCards } from '../PlayerCards';

const ACE_HEARTS = { value: 'A' as const, suit: 'hearts' as const };
const KING_SPADES = { value: 'K' as const, suit: 'spades' as const };

describe('PlayerCards', () => {
  it('renders placeholder cards when holeCards is empty', () => {
    const { container } = render(
      <PlayerCards
        holeCards={[]}
        showFaceUp={false}
        priestessCard={null}
        playerIndex={0}
        wheelRound={1}
        dealerAnchorId="player-1"
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders hole cards when provided', () => {
    const { container } = render(
      <PlayerCards
        holeCards={[ACE_HEARTS, KING_SPADES]}
        showFaceUp={true}
        priestessCard={null}
        playerIndex={0}
        wheelRound={1}
        dealerAnchorId="player-1"
        isHero
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with a selected card without crashing', () => {
    const { container } = render(
      <PlayerCards
        holeCards={[ACE_HEARTS, KING_SPADES]}
        showFaceUp={true}
        priestessCard={null}
        playerIndex={0}
        wheelRound={1}
        dealerAnchorId="player-1"
        isHero
        selectedCard={ACE_HEARTS}
        onCardClick={() => {}}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect it to fail**

```bash
npm run test -- PlayerCards
```

Expected: FAIL — `Cannot find module '../PlayerCards'`

- [ ] **Step 3: Create `src/components/Table/PlayerCards.tsx`**

```tsx
/**
 * Renders the two hole cards for a player seat.
 * Handles the High Priestess reveal edge case (a single opponent card shown
 * face-up without revealing the rest) and card selection for
 * Chariot/Priestess interactions.
 */
import { Box, Stack } from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard } from "../../types/types";

interface PlayerCardsProps {
  holeCards: StandardCard[];
  showFaceUp: boolean;
  /** Single card revealed face-up by the High Priestess arcana (opponent-only). */
  priestessCard: StandardCard | null;
  /** Called when the hero clicks a card during a Priestess or Chariot interaction. */
  onCardClick?: (card: StandardCard) => void;
  selectedCard?: StandardCard | null;
  /** Used to stagger deal animation timing across seats. */
  playerIndex: number;
  /** Incremented each hand — used as React key seed to replay deal animations. */
  wheelRound: number;
  /** The player's ID — attached as data-dealer-anchor so DealerChip can locate this element. */
  dealerAnchorId: string;
  /** Hero cards are revealed immediately (no animation delay). */
  isHero?: boolean;
}

export function PlayerCards({
  holeCards,
  showFaceUp,
  priestessCard,
  onCardClick,
  selectedCard,
  playerIndex,
  wheelRound,
  dealerAnchorId,
  isHero = false,
}: PlayerCardsProps) {
  return (
    <Box
      data-dealer-anchor={dealerAnchorId}
      sx={{ position: "relative", display: "flex", justifyContent: "center", mb: 0.5 }}
    >
      <Stack direction="row" justifyContent="center" alignItems="flex-end">
        {holeCards.length > 0 ? (
          holeCards.map((card, i) => {
            // Priestess reveal: isPriestessRevealed allows a single opponent card
            // to appear face-up without showFaceUp being true for the whole hand.
            const isPriestessRevealed =
              !showFaceUp &&
              priestessCard != null &&
              card.value === priestessCard.value &&
              card.suit === priestessCard.suit;
            const faceUp = showFaceUp || isPriestessRevealed;
            const isSelected =
              selectedCard != null &&
              card.value === selectedCard.value &&
              card.suit === selectedCard.suit;
            return (
              <Box
                key={`${wheelRound}-${i}`}
                onClick={onCardClick ? () => onCardClick(card) : undefined}
                sx={{
                  transform: isSelected
                    ? (i === 0 ? "rotate(-6deg) translateY(-10px)" : "rotate(6deg) translateY(-10px)")
                    : (i === 0 ? "rotate(-6deg)" : "rotate(6deg)"),
                  transformOrigin: "bottom center",
                  ml: i === 0 ? 0 : -1.5,
                  cursor: onCardClick ? "pointer" : "default",
                  transition: "transform 0.15s ease",
                  outline: isSelected ? "2px solid gold" : "none",
                  borderRadius: 1,
                }}
              >
                <DealtCard
                  small
                  rank={faceUp ? card.value : undefined}
                  suit={faceUp ? card.suit : undefined}
                  flipped={faceUp}
                  dealIndex={playerIndex * 2 + i}
                  revealDelay={!isHero ? 200 + playerIndex * 300 + i * 100 : undefined}
                />
              </Box>
            );
          })
        ) : (
          <>
            <Box sx={{ transform: "rotate(-6deg)", transformOrigin: "bottom center" }}>
              <PlayingCard small />
            </Box>
            <Box sx={{ transform: "rotate(6deg)", transformOrigin: "bottom center", ml: -1.5 }}>
              <PlayingCard small />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 4: Run test — expect it to pass**

```bash
npm run test -- PlayerCards
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/PlayerCards.tsx src/components/Table/__tests__/PlayerCards.test.tsx
git commit -m "feat: extract PlayerCards component"
```

---

### Task 4: `src/components/Table/PlayerStatusBar.tsx`

**Files:**
- Create: `src/components/Table/__tests__/PlayerStatusBar.test.tsx`
- Create: `src/components/Table/PlayerStatusBar.tsx`

- [ ] **Step 1: Write the smoke test**

Create `src/components/Table/__tests__/PlayerStatusBar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PlayerStatusBar } from '../PlayerStatusBar';

describe('PlayerStatusBar', () => {
  it('renders without crashing with minimal props', () => {
    const { container } = render(
      <PlayerStatusBar
        currentAction={null}
        currentBet={0}
        isAllIn={false}
        handResult={undefined}
        isWinner={false}
        showHandResult={false}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with an active action', () => {
    const { container } = render(
      <PlayerStatusBar
        currentAction="raise"
        currentBet={100}
        isAllIn={false}
        handResult={undefined}
        isWinner={false}
        showHandResult={false}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders at showdown with a hand result', () => {
    const { container } = render(
      <PlayerStatusBar
        currentAction={null}
        currentBet={0}
        isAllIn={false}
        handResult={{ rankName: 'two-pair' }}
        isWinner={true}
        showHandResult={true}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect it to fail**

```bash
npm run test -- PlayerStatusBar
```

Expected: FAIL — `Cannot find module '../PlayerStatusBar'`

- [ ] **Step 3: Create `src/components/Table/PlayerStatusBar.tsx`**

```tsx
/**
 * Renders the action chip, hand rank label, and bet/all-in line for a player seat.
 * Pure presentational — receives all data as props from PlayerSeat.
 */
import { Box, Chip, Typography } from "@mui/material";
import { actionLabel, actionColor, formatHandRank } from "../../utils/cardUtils";

interface PlayerStatusBarProps {
  currentAction: string | null;
  currentBet: number;
  isAllIn: boolean;
  /** Present at showdown if this player's hand was evaluated. */
  handResult: { rankName: string } | undefined;
  isWinner: boolean;
  /** True when the stage is showdown and the player has not folded. Controls the cross-fade. */
  showHandResult: boolean;
}

export function PlayerStatusBar({
  currentAction,
  currentBet,
  isAllIn,
  handResult,
  isWinner,
  showHandResult,
}: PlayerStatusBarProps) {
  return (
    <>
      {/*
        CSS grid stack: action chip and hand rank occupy gridArea "1/1" so they
        share the same space. Opacity transitions swap between them without any
        layout shift — the container height never changes.
      */}
      <Box sx={{ display: "grid", mt: 0.5 }}>
        {/* Action chip — fades out at showdown */}
        <Box
          sx={{
            gridArea: "1 / 1",
            display: "flex",
            justifyContent: "center",
            opacity: showHandResult ? 0 : 1,
            pointerEvents: showHandResult ? "none" : "auto",
            transition: "opacity 250ms ease",
          }}
        >
          <Chip
            label={currentAction ? actionLabel(currentAction) : "\u00A0"}
            color={currentAction ? actionColor(currentAction) : "default"}
            size="small"
            sx={{
              fontSize: "0.65rem",
              height: 18,
              visibility: currentAction ? "visible" : "hidden",
            }}
          />
        </Box>

        {/* Hand rank — fades in at showdown */}
        <Box
          sx={{
            gridArea: "1 / 1",
            display: "flex",
            justifyContent: "center",
            opacity: showHandResult ? 1 : 0,
            pointerEvents: showHandResult ? "auto" : "none",
            transition: "opacity 250ms ease",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isWinner ? "gold.light" : "silver.light",
              fontSize: "0.65rem",
              fontStyle: "italic",
              textAlign: "center",
              visibility: handResult ? "visible" : "hidden",
            }}
          >
            {handResult ? formatHandRank(handResult.rankName) : "\u00A0"}
          </Typography>
        </Box>
      </Box>

      {/* Bet / All-In — always occupies space, visible only when applicable */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          color: "gold.main",
          fontSize: "0.65rem",
          mt: 0.25,
          visibility: (currentBet > 0 || isAllIn) && !showHandResult ? "visible" : "hidden",
        }}
      >
        {currentBet > 0 ? `Bet: ${currentBet}` : "\u00A0"}
        {isAllIn ? " · All-In" : ""}
      </Typography>
    </>
  );
}
```

- [ ] **Step 4: Run test — expect it to pass**

```bash
npm run test -- PlayerStatusBar
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/PlayerStatusBar.tsx src/components/Table/__tests__/PlayerStatusBar.test.tsx
git commit -m "feat: extract PlayerStatusBar component"
```

---

### Task 5: Slim `src/components/Table/PlayerSeat.tsx`

**Files:**
- Modify: `src/components/Table/PlayerSeat.tsx`

- [ ] **Step 1: Replace PlayerSeat.tsx with the slimmed version**

Replace the entire file with:

```tsx
/**
 * One seat at the poker table — renders name/stack header, hole cards, and
 * the action chip / hand rank status bar.
 * Calls useGame() directly; each seat independently subscribes to state.
 */
import { Box, Typography } from "@mui/material";
import { useGame } from "../../store/useGame";
import type { GamePlayer } from "../../store/storeTypes";
import type { StandardCard } from "../../types/types";
import { PlayerCards } from "./PlayerCards";
import { PlayerStatusBar } from "./PlayerStatusBar";

interface PlayerSeatProps {
  player: GamePlayer;
  playerIndex: number;
  isHero?: boolean;
  /** When set, hero cards are clickable for selection (Priestess / Chariot). */
  onCardClick?: (card: StandardCard) => void;
  /** The currently selected card during an inline card-pick interaction. */
  selectedCard?: StandardCard | null;
}

export function PlayerSeat({
  player,
  playerIndex,
  isHero = false,
  onCardClick,
  selectedCard,
}: PlayerSeatProps) {
  const { state } = useGame();

  const isShowdown = state.stage === "showdown";
  const priestessCard = state.priestessRevealedCards?.[player.id] ?? null;

  const showHandResult = isShowdown && !player.folded;
  const handResult = state.handResults.find((r) => r.playerId === player.id);
  const isWinner = state.winnerIds.includes(player.id);

  // Hero is always face-up. Non-folded players at a real showdown (with a
  // hand result) are face-up. Bluff-wins (no handResult) stay hidden.
  const showFaceUp = isHero || (isShowdown && !player.folded && !!handResult);

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        p: 1.5,
        minWidth: { xs: 140, sm: 160 },
        maxWidth: 200,
        opacity: player.folded ? 0.55 : 1,
        transition: "opacity 0.3s",
      }}
    >
      {/* Player name and stack */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: isHero ? "gold.light" : "silver.light",
          fontWeight: "bold",
          mb: 0.5,
          fontSize: "0.75rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {player.name}{isWinner ? " ★" : ""} &mdash; &#9824; {player.stack}
      </Typography>

      <PlayerCards
        holeCards={player.holeCards}
        showFaceUp={showFaceUp}
        priestessCard={priestessCard}
        onCardClick={onCardClick}
        selectedCard={selectedCard}
        playerIndex={playerIndex}
        wheelRound={state.wheelRound}
        dealerAnchorId={player.id}
        isHero={isHero}
      />

      <PlayerStatusBar
        currentAction={player.currentAction ?? null}
        currentBet={player.currentBet}
        isAllIn={player.isAllIn}
        handResult={handResult}
        isWinner={isWinner}
        showHandResult={showHandResult}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Run all tests to verify nothing regressed**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/PlayerSeat.tsx
git commit -m "refactor: slim PlayerSeat — delegate to PlayerCards and PlayerStatusBar"
```

---

## Chunk 3: ActionBar Decomposition

### Task 6: `src/components/Table/RaiseSlider.tsx`

**Files:**
- Create: `src/components/Table/__tests__/RaiseSlider.test.tsx`
- Create: `src/components/Table/RaiseSlider.tsx`

- [ ] **Step 1: Write the smoke test**

Create `src/components/Table/__tests__/RaiseSlider.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RaiseSlider } from '../RaiseSlider';

describe('RaiseSlider', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <RaiseSlider
        value={20}
        minRaise={20}
        maxRaise={200}
        bigBlind={10}
        disabled={false}
        onChange={() => {}}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders in disabled state', () => {
    const { container } = render(
      <RaiseSlider
        value={20}
        minRaise={20}
        maxRaise={20}
        bigBlind={10}
        disabled={true}
        onChange={() => {}}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect it to fail**

```bash
npm run test -- RaiseSlider
```

Expected: FAIL

- [ ] **Step 3: Create `src/components/Table/RaiseSlider.tsx`**

```tsx
/**
 * Raise-amount control: label row showing the current raise value and an MUI Slider.
 * Pure presentational — raiseAmount state lives in ActionBar.
 */
import { Box, Slider, Stack, Typography } from "@mui/material";

interface RaiseSliderProps {
  /** Current slider value (controlled). */
  value: number;
  minRaise: number;
  maxRaise: number;
  /** Slider step size — one big blind. */
  bigBlind: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

export function RaiseSlider({
  value,
  minRaise,
  maxRaise,
  bigBlind,
  disabled,
  onChange,
}: RaiseSliderProps) {
  return (
    <Box sx={{ px: 1, mb: 1 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "silver.light" }}>
          Raise amount
        </Typography>
        <Typography variant="caption" sx={{ color: "gold.main", fontWeight: "bold" }}>
          {value}
        </Typography>
      </Stack>
      <Slider
        value={value}
        min={minRaise}
        max={maxRaise}
        step={bigBlind}
        disabled={disabled}
        onChange={(_e, v) => onChange(v as number)}
        sx={{
          color: "gold.main",
          "& .MuiSlider-thumb": { borderColor: "gold.dark" },
        }}
      />
    </Box>
  );
}
```

- [ ] **Step 4: Run test — expect it to pass**

```bash
npm run test -- RaiseSlider
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/RaiseSlider.tsx src/components/Table/__tests__/RaiseSlider.test.tsx
git commit -m "feat: extract RaiseSlider component"
```

---

### Task 7: `src/components/Table/ActionButtons.tsx`

**Files:**
- Create: `src/components/Table/__tests__/ActionButtons.test.tsx`
- Create: `src/components/Table/ActionButtons.tsx`

- [ ] **Step 1: Write the smoke test**

Create `src/components/Table/__tests__/ActionButtons.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  it('renders check button when canCheck is true', () => {
    const { getByText } = render(
      <ActionButtons
        canCheck={true}
        callExceedsStack={false}
        heroStack={500}
        toCall={0}
        isAllIn={false}
        clampedRaise={40}
        onFold={() => {}}
        onCheckOrCall={() => {}}
        onRaiseOrAllIn={() => {}}
      />
    );
    expect(getByText('Check')).not.toBeNull();
  });

  it('renders call button with amount when there is a bet to call', () => {
    const { getByText } = render(
      <ActionButtons
        canCheck={false}
        callExceedsStack={false}
        heroStack={500}
        toCall={50}
        isAllIn={false}
        clampedRaise={100}
        onFold={() => {}}
        onCheckOrCall={() => {}}
        onRaiseOrAllIn={() => {}}
      />
    );
    expect(getByText('Call 50')).not.toBeNull();
  });

  it('renders all-in button when callExceedsStack', () => {
    const { getByText } = render(
      <ActionButtons
        canCheck={false}
        callExceedsStack={true}
        heroStack={30}
        toCall={200}
        isAllIn={false}
        clampedRaise={200}
        onFold={() => {}}
        onCheckOrCall={() => {}}
        onRaiseOrAllIn={() => {}}
      />
    );
    expect(getByText('All-in 30')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect it to fail**

```bash
npm run test -- ActionButtons
```

Expected: FAIL

- [ ] **Step 3: Create `src/components/Table/ActionButtons.tsx`**

```tsx
/**
 * The three action buttons for the hero's turn: Fold, Check/Call, and Raise/All-In.
 * Pure presentational — all handlers are passed in from ActionBar.
 */
import { Button, Stack } from "@mui/material";

interface ActionButtonsProps {
  canCheck: boolean;
  /**
   * True when toCall >= heroStack. In this case the Call button becomes an
   * all-in action — the hero cannot call more than their remaining stack.
   */
  callExceedsStack: boolean;
  heroStack: number;
  toCall: number;
  isAllIn: boolean;
  clampedRaise: number;
  onFold: () => void;
  onCheckOrCall: () => void;
  onRaiseOrAllIn: () => void;
}

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
}: ActionButtonsProps) {
  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Button variant="contained" color="error" size="small" onClick={onFold}>
        Fold
      </Button>

      {canCheck ? (
        <Button variant="contained" color="success" size="small" onClick={onCheckOrCall}>
          Check
        </Button>
      ) : callExceedsStack ? (
        <Button variant="contained" color="info" size="small" onClick={onCheckOrCall}>
          All-in {heroStack}
        </Button>
      ) : (
        <Button variant="contained" color="info" size="small" onClick={onCheckOrCall}>
          Call {toCall}
        </Button>
      )}

      <Button
        variant="contained"
        color={isAllIn ? "warning" : "primary"}
        size="small"
        onClick={onRaiseOrAllIn}
        disabled={heroStack === 0}
      >
        {isAllIn ? `All-In (${heroStack})` : `${toCall === 0 ? "Bet" : "Raise"} ${clampedRaise}`}
      </Button>
    </Stack>
  );
}
```

- [ ] **Step 4: Run test — expect it to pass**

```bash
npm run test -- ActionButtons
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/ActionButtons.tsx src/components/Table/__tests__/ActionButtons.test.tsx
git commit -m "feat: extract ActionButtons component"
```

---

### Task 8: Slim `src/components/Table/ActionBar.tsx`

**Files:**
- Modify: `src/components/Table/ActionBar.tsx`

- [ ] **Step 1: Replace ActionBar.tsx with the slimmed version**

Replace the entire file with:

```tsx
/**
 * The hero's action control panel.
 * Derives game state, owns the raiseAmount slider state, and composes
 * RaiseSlider + ActionButtons. Uses a CSS grid stack to cross-fade between
 * action controls and overlayContent (e.g. showdown buttons, arcana prompts).
 * ActionBarInner is deleted — all logic lives directly in ActionBar.
 */
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";
import { RaiseSlider } from "./RaiseSlider";
import { ActionButtons } from "./ActionButtons";

interface ActionBarProps {
  isVisible?: boolean;
  /** When provided, fades in over the action buttons in the same fixed container. */
  overlayContent?: ReactNode;
}

export function ActionBar({ isVisible = true, overlayContent }: ActionBarProps) {
  const { state, dispatch } = useGame();

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);

  // The Devil arcana doubles the minimum raise to 4× the current bet.
  const devilActive = state.activeArcana?.effectKey === "devil-double-raise";
  const toCall = hero ? state.currentBet - hero.currentBet : 0;
  const canCheck = toCall === 0;
  const minRaiseCalc = hero
    ? devilActive
      ? state.currentBet * 4
      : Math.max(state.currentBet * 2, hero.currentBet + state.bigBlind)
    : state.bigBlind;
  const minRaise = Math.max(minRaiseCalc, state.bigBlind);
  const effectiveMax = hero ? Math.max(minRaise, hero.stack + hero.currentBet) : minRaise;
  const callExceedsStack = hero ? toCall >= hero.stack : false;

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
  useEffect(() => { setRaiseAmount(minRaise); }, [minRaise]);

  if (!hero) return null;

  const clampedRaise = Math.min(Math.max(raiseAmount, minRaise), effectiveMax);
  const sliderDisabled = effectiveMax <= minRaise;
  const isAllIn = clampedRaise >= effectiveMax;

  function handleFold() {
    dispatch({ type: "PLAYER_ACTION", payload: { playerId: HERO_ID_CONST, action: "fold" } });
  }

  function handleCheckOrCall() {
    dispatch({
      type: "PLAYER_ACTION",
      payload: { playerId: HERO_ID_CONST, action: canCheck ? "check" : "call" },
    });
  }

  function handleRaiseOrAllIn() {
    if (isAllIn) {
      dispatch({ type: "PLAYER_ACTION", payload: { playerId: HERO_ID_CONST, action: "all-in" } });
    } else {
      dispatch({
        type: "PLAYER_ACTION",
        payload: { playerId: HERO_ID_CONST, action: "raise", amount: clampedRaise },
      });
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        width: "100%",
        maxWidth: 600,
      }}
    >
      {/*
        CSS grid stack: action controls and overlayContent share gridArea "1/1".
        Opacity transitions swap between them with no layout shift.
      */}
      <Box sx={{ display: "grid" }}>
        {/* Action controls */}
        <Box
          sx={{
            gridArea: "1 / 1",
            opacity: isVisible && !overlayContent ? 1 : 0,
            pointerEvents: isVisible && !overlayContent ? "auto" : "none",
            transition: "opacity 200ms ease",
          }}
        >
          <RaiseSlider
            value={clampedRaise}
            minRaise={minRaise}
            maxRaise={effectiveMax}
            bigBlind={state.bigBlind}
            disabled={sliderDisabled}
            onChange={setRaiseAmount}
          />
          <ActionButtons
            canCheck={canCheck}
            callExceedsStack={callExceedsStack}
            heroStack={hero.stack}
            toCall={toCall}
            isAllIn={isAllIn}
            clampedRaise={clampedRaise}
            onFold={handleFold}
            onCheckOrCall={handleCheckOrCall}
            onRaiseOrAllIn={handleRaiseOrAllIn}
          />
        </Box>

        {/* Overlay content — same grid cell, fades in when provided */}
        <Box
          sx={{
            gridArea: "1 / 1",
            opacity: overlayContent ? 1 : 0,
            pointerEvents: overlayContent ? "auto" : "none",
            transition: "opacity 200ms ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {overlayContent}
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Run all tests to verify nothing regressed**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/ActionBar.tsx
git commit -m "refactor: slim ActionBar — compose RaiseSlider and ActionButtons"
```

---

## Chunk 4: CommunityArea Decomposition

### Task 9: `src/components/Table/CommunityCards.tsx`

**Files:**
- Create: `src/components/Table/CommunityCards.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Renders the row of community cards on the poker table.
 * Handles the Fool substitution (a community card secretly replaced by the
 * Fool arcana) and the Empress sixth-card slot.
 */
import { Box, Stack } from "@mui/material";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard, ArcanaCard } from "../../types/types";

interface CommunityCardsProps {
  communityCards: StandardCard[];
  /**
   * 5 normally; 6 when the Empress arcana (effectKey "empress-sixth-card") is active.
   * The 6th slot renders as an empty placeholder until the card is dealt.
   */
  totalSlots: number;
  /**
   * Index of the community card secretly replaced by the Fool arcana.
   * That position renders as a Major Arcana face instead of the card's true value.
   * Null when no Fool substitution is active.
   */
  foolCardIndex: number | null;
  /** React key seed — incremented each hand to replay deal animations. */
  wheelRound: number;
}

export function CommunityCards({
  communityCards,
  totalSlots,
  foolCardIndex,
  wheelRound,
}: CommunityCardsProps) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {Array.from({ length: totalSlots }).map((_, i) => {
        const card = communityCards[i];
        if (card) {
          const di = i < 3 ? i : 0;
          // Fool substitution: render this slot as The Fool arcana face
          // rather than the card's true value.
          if (i === foolCardIndex) {
            return (
              <DealtCard
                key={`${wheelRound}-${i}`}
                small
                rank={"0" as ArcanaCard["value"]}
                suit={"arcana"}
                flipped
                dealIndex={di}
                revealDelay={di * 80 + 400}
              />
            );
          }
          return (
            <DealtCard
              key={`${wheelRound}-${i}`}
              small
              rank={card.value}
              suit={card.suit}
              flipped
              dealIndex={di}
              revealDelay={di * 80 + 400}
            />
          );
        }
        return (
          <Box
            key={i}
            sx={{
              width: "3em",
              aspectRatio: "5/7",
              borderRadius: 1,
              border: "1px dashed rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
            }}
          />
        );
      })}
    </Stack>
  );
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/CommunityCards.tsx
git commit -m "feat: extract CommunityCards component"
```

---

### Task 10: `src/components/Table/PotDisplay.tsx`

**Files:**
- Create: `src/components/Table/PotDisplay.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Displays the current pot and bet during active play, and the winner announcement
 * (or split-pot result) at showdown.
 */
import { Stack, Typography } from "@mui/material";
import type { GamePlayer } from "../../store/storeTypes";

interface PotDisplayProps {
  stage: string;
  potSize: number;
  currentBet: number;
  /** Total chips distributed at the last showdown. Used for winner display. */
  potWon: number;
  winnerIds: string[];
  players: GamePlayer[];
}

export function PotDisplay({
  stage,
  potSize,
  currentBet,
  potWon,
  winnerIds,
  players,
}: PotDisplayProps) {
  if (stage === "showdown") {
    const perWinner = winnerIds.length > 0 ? Math.floor(potWon / winnerIds.length) : 0;
    // Hero is identified by type "human" — same convention as the rest of the store.
    const heroId = players.find((p) => p.type === "human")?.id;

    if (winnerIds.length > 1) {
      return (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 24 }}>
          <Typography variant="body2" sx={{ color: "gold.main", fontWeight: "bold" }}>
            Split Pot — {perWinner} each
          </Typography>
        </Stack>
      );
    }
    if (winnerIds.length === 1) {
      const isHero = winnerIds[0] === heroId;
      const name = isHero ? "You" : players.find((p) => p.id === winnerIds[0])?.name;
      const verb = isHero ? "win" : "wins";
      return (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 24 }}>
          <Typography variant="body2" sx={{ color: "gold.main", fontWeight: "bold" }}>
            {name} {verb} {perWinner}!
          </Typography>
        </Stack>
      );
    }
    return null;
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 24 }}>
      <Typography variant="body2" sx={{ color: "gold.main", fontWeight: "bold" }}>
        Pot: {potSize}
      </Typography>
      {currentBet > 0 && (
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Bet: {currentBet}
        </Typography>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/PotDisplay.tsx
git commit -m "feat: extract PotDisplay component"
```

---

### Task 11: `src/components/Table/ArcanaDisplay.tsx`

**Files:**
- Create: `src/components/Table/ArcanaDisplay.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Displays the active Major Arcana card and its game-effect description.
 *
 * While the arcana is pending (not yet revealed), the card shows its back
 * and the description reads "An arcana stirs…". After reveal, the card flips
 * and the name/effect fades in. Both states share the same container height
 * via a CSS grid stack so no layout shift occurs.
 */
import { Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { PlayingCard } from "../Card/PlayingCard";
import type { ArcanaCard } from "../../types/types";

// Keyframes live here — they are only used by ArcanaDisplay after the split.
const arcanaRiseIn = keyframes`
  from { opacity: 0; transform: translateY(30px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const arcanaFloatBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-5px); }
`;

interface ArcanaDisplayProps {
  /** The arcana card to show (pending or active). Null hides the whole display. */
  arcanaCardToShow: ArcanaCard | null;
  /**
   * Set while the arcana is pending reveal (before the player clicks "Reveal Arcana").
   * When non-null, the card shows its back and the description shows the pending placeholder.
   */
  pendingArcanaCard: ArcanaCard | null;
  /**
   * Pre-fetched from the pending card so the description box has stable dimensions
   * before the reveal animation. Null when no arcana is active.
   * Shape matches tarot.arcana record values: { fullName, gameEffect? }.
   */
  displayArcanaData: { fullName: string; gameEffect?: string } | null;
}

export function ArcanaDisplay({
  arcanaCardToShow,
  pendingArcanaCard,
  displayArcanaData,
}: ArcanaDisplayProps) {
  return (
    <Box sx={{ display: "grid", width: "100%" }}>
      {/* Arcana card + description — same grid cell, fades in when active */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          gridArea: "1 / 1",
          opacity: arcanaCardToShow ? 1 : 0,
          pointerEvents: arcanaCardToShow ? "auto" : "none",
          transition: "opacity 400ms ease",
        }}
      >
        {/* Card animates in and bobs while pending */}
        <Box
          sx={{
            display: "inline-block",
            animation: pendingArcanaCard ? `${arcanaRiseIn} 500ms ease-out both` : undefined,
          }}
        >
          <Box
            sx={{
              display: "inline-block",
              borderRadius: 1,
              animation: pendingArcanaCard
                ? `${arcanaFloatBob} 2.4s ease-in-out 500ms infinite`
                : undefined,
              boxShadow: pendingArcanaCard
                ? "0 0 12px 4px rgba(179, 57, 219, 0.55)"
                : undefined,
            }}
          >
            <PlayingCard
              small
              rank={arcanaCardToShow?.value}
              suit={arcanaCardToShow?.suit}
              flipped={!!arcanaCardToShow && !pendingArcanaCard}
            />
          </Box>
        </Box>

        {/* Description box: fixed size, CSS grid stack inside */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: "secondary.dark",
            borderRadius: 2,
            p: 1,
            maxWidth: 180,
            minWidth: 120,
            background: "rgba(108,52,131,0.2)",
            textAlign: "center",
          }}
        >
          {/*
            displayArcanaData is pre-fetched from the pending card so the box
            has stable dimensions before the reveal. The CSS grid stack cross-fades
            between the "An arcana stirs…" placeholder and the revealed name/effect.
          */}
          <Box sx={{ display: "grid" }}>
            {/* Pending placeholder — visible before reveal */}
            <Box
              sx={{
                gridArea: "1 / 1",
                opacity: pendingArcanaCard ? 1 : 0,
                pointerEvents: pendingArcanaCard ? "auto" : "none",
                transition: "opacity 300ms ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "secondary.light", fontStyle: "italic" }}>
                An arcana stirs...
              </Typography>
            </Box>

            {/* Revealed name + effect — visible after reveal */}
            <Box
              sx={{
                gridArea: "1 / 1",
                opacity: pendingArcanaCard ? 0 : 1,
                pointerEvents: pendingArcanaCard ? "none" : "auto",
                transition: "opacity 300ms ease",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "secondary.main",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                }}
              >
                {displayArcanaData?.fullName}
              </Typography>
              {displayArcanaData?.gameEffect && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "silver.light",
                    fontSize: "0.65rem",
                    fontStyle: "italic",
                    mt: 0.25,
                  }}
                >
                  {displayArcanaData.gameEffect}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/ArcanaDisplay.tsx
git commit -m "feat: extract ArcanaDisplay component (owns arcana keyframe animations)"
```

---

### Task 12: Slim `src/components/Table/CommunityArea.tsx`

**Files:**
- Modify: `src/components/Table/CommunityArea.tsx`

- [ ] **Step 1: Replace CommunityArea.tsx with the slimmed version**

Replace the entire file with:

```tsx
/**
 * The central area of the poker table: stage pill, community cards,
 * pot/bet display, and the active Major Arcana card.
 */
import { Box, Chip } from "@mui/material";
import type { SxProps } from "@mui/material";
import { useGame } from "../../store/useGame";
import tarot from "../../data/tarot";
import type { ArcanaCard } from "../../types/types";
import { stagePill, stageColor } from "../../utils/stageUtils";
import { CommunityCards } from "./CommunityCards";
import { PotDisplay } from "./PotDisplay";
import { ArcanaDisplay } from "./ArcanaDisplay";

interface CommunityAreaProps {
  /** Passed from PokerTable as sx={{ flex: 1 }} to fill the middle row. */
  sx?: SxProps;
}

export function CommunityArea({ sx }: CommunityAreaProps) {
  const { state } = useGame();

  const totalSlots =
    state.activeArcana?.effectKey === "empress-sixth-card" ? 6 : 5;

  const pendingArcanaCard =
    state.pendingInteraction?.type === "arcana-reveal"
      ? (state.pendingInteraction as { type: "arcana-reveal"; arcanaCard: ArcanaCard }).arcanaCard
      : null;

  const arcanaData =
    state.activeArcana != null
      ? (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[
          state.activeArcana.card.value
        ]
      : null;

  // Pre-fetch from pending card so the description box has stable dimensions before reveal.
  const displayArcanaData =
    arcanaData ??
    (pendingArcanaCard
      ? (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[
          pendingArcanaCard.value
        ]
      : null);

  const arcanaCardToShow = pendingArcanaCard ?? state.activeArcana?.card ?? null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        p: 2,
        borderRadius: 3,
        minWidth: { xs: "100%", md: 320 },
        ...sx,
      }}
    >
      <Chip
        label={stagePill(state.stage)}
        color={stageColor(state.stage)}
        size="small"
        sx={{ fontWeight: "bold", letterSpacing: "0.05em" }}
      />

      <CommunityCards
        communityCards={state.communityCards}
        totalSlots={totalSlots}
        foolCardIndex={state.foolCardIndex}
        wheelRound={state.wheelRound}
      />

      <PotDisplay
        stage={state.stage}
        potSize={state.potSize}
        currentBet={state.currentBet}
        potWon={state.potWon}
        winnerIds={state.winnerIds}
        players={state.players}
      />

      <ArcanaDisplay
        arcanaCardToShow={arcanaCardToShow}
        pendingArcanaCard={pendingArcanaCard}
        displayArcanaData={displayArcanaData}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Run all tests to verify nothing regressed**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/CommunityArea.tsx
git commit -m "refactor: slim CommunityArea — compose CommunityCards, PotDisplay, ArcanaDisplay"
```

---

## Chunk 5: PokerTable Decomposition

### Task 13: `src/components/Table/TableOverlayContent.tsx`

**Files:**
- Create: `src/components/Table/TableOverlayContent.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Returns the overlay ReactNode for whichever non-betting interaction is active,
 * or undefined if none. Constructed by PokerTable and passed as the
 * `overlayContent` prop to ActionBar.
 *
 * Interactions handled inline here (simple one-button or card-click flows):
 *   - priestess-reveal  Card-pick: click a card to reveal it to all players
 *   - chariot-pass      Card-pick: click a card to pass it left
 *   - arcana-reveal     One button: flip the pending arcana card
 *   - page-challenge    One button: trigger the Page bounty
 *   - showdown          Two buttons: Read These Cards (tarot) / Next Hand
 *
 * Interactions handled in InteractionModal (multi-choice dialogs with minimize):
 *   - star-discard, moon-swap, magician-guess, judgement-return
 */
import { Button, Stack, Typography } from "@mui/material";
import type React from "react";
import type { StandardCard } from "../../types/types";
import type { StoreGameState, GameAction } from "../../store/storeTypes";
import { HERO_ID_CONST } from "../../store/initialState";

interface TableOverlayContentProps {
  cardPickInteraction: "priestess-reveal" | "chariot-pass" | null;
  selectedCard: StandardCard | null;
  stage: string;
  pendingInteraction: StoreGameState["pendingInteraction"];
  winnerIds: string[];
  communityCards: StandardCard[];
  bigBlind: number;
  isFinalHand: boolean;
  onConfirmCardPick: () => void;
  onNextHand: () => void;
  onShowTarot: () => void;
  /** Pre-bound dispatch from PokerTable's useGame() call. */
  dispatch: React.Dispatch<GameAction>;
}

/**
 * Called as a plain function (not JSX) from PokerTable so it can return
 * undefined — JSX element instantiation always produces a ReactElement object,
 * which would make ActionBar's `overlayContent ? 1 : 0` guard always truthy.
 */
export function TableOverlayContent({
  cardPickInteraction,
  selectedCard,
  stage,
  pendingInteraction,
  winnerIds,
  communityCards,
  bigBlind,
  isFinalHand,
  onConfirmCardPick,
  onNextHand,
  onShowTarot,
  dispatch,
}: TableOverlayContentProps): React.ReactNode {
  // ── Card-pick interactions (Priestess reveal / Chariot pass) ─────────────
  if (cardPickInteraction) {
    return (
      <Stack direction="column" alignItems="center" spacing={0.5}>
        <Typography
          variant="caption"
          sx={{ color: "secondary.light", fontSize: "0.7rem", fontStyle: "italic" }}
        >
          {cardPickInteraction === "priestess-reveal"
            ? "Click a card to reveal it to all players."
            : "Click a card to pass it to the player on your left."}
        </Typography>
        <Button
          variant="contained"
          size="large"
          disabled={!selectedCard}
          onClick={onConfirmCardPick}
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
            "&.Mui-disabled": { opacity: 0.4 },
          }}
        >
          Confirm
        </Button>
      </Stack>
    );
  }

  // ── Page Challenge ────────────────────────────────────────────────────────
  if (pendingInteraction?.type === "page-challenge") {
    return (
      <Stack direction="column" alignItems="center" spacing={0.5}>
        <Button
          variant="contained"
          size="large"
          onClick={() => dispatch({ type: "RESOLVE_PAGE_CHALLENGE" })}
          sx={{
            px: 5,
            py: 1,
            background: "linear-gradient(135deg, #7B3F00, #3E1F00)",
            border: "1px solid",
            borderColor: "gold.main",
            color: "gold.light",
            letterSpacing: "0.08em",
            "&:hover": {
              background: "linear-gradient(135deg, #A0522D, #5C2E00)",
              borderColor: "gold.light",
            },
          }}
        >
          Challenge of the Page
        </Button>
        <Typography
          variant="caption"
          sx={{ color: "silver.light", fontSize: "0.65rem", fontStyle: "italic" }}
        >
          The winner holds a Page — all others pay {bigBlind} chips.
        </Typography>
      </Stack>
    );
  }

  // ── Arcana Reveal ─────────────────────────────────────────────────────────
  if (pendingInteraction?.type === "arcana-reveal") {
    return (
      <Button
        variant="contained"
        size="large"
        onClick={() => dispatch({ type: "REVEAL_ARCANA" })}
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
        Reveal Arcana
      </Button>
    );
  }

  // ── Showdown ──────────────────────────────────────────────────────────────
  if (stage === "showdown" && pendingInteraction === null) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        {(communityCards.length > 0 || winnerIds.includes(HERO_ID_CONST)) && (
          <Button
            variant="outlined"
            size="large"
            onClick={onShowTarot}
            sx={{
              px: 3,
              py: 1,
              borderColor: "secondary.main",
              color: "secondary.light",
              letterSpacing: "0.05em",
              "&:hover": {
                borderColor: "secondary.light",
                background: "rgba(108,52,131,0.15)",
              },
            }}
          >
            Read These Cards
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          onClick={onNextHand}
          sx={{
            px: 5,
            py: 1,
            background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
            border: "1px solid",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": {
              background: "linear-gradient(135deg, #388E3C, #2E7D32)",
              borderColor: "gold.main",
            },
          }}
        >
          {isFinalHand ? "View Final Results" : "Next Hand →"}
        </Button>
      </Stack>
    );
  }

  return undefined;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/TableOverlayContent.tsx
git commit -m "feat: extract TableOverlayContent with all 4 overlay branches"
```

---

### Task 14: Slim `src/components/Table/PokerTable.tsx`

**Files:**
- Modify: `src/components/Table/PokerTable.tsx`

- [ ] **Step 1: Replace PokerTable.tsx with the slimmed version**

Replace the entire file with:

```tsx
/**
 * Top-level layout component for the poker table.
 * Arranges player seats, the community area, and the action bar.
 * Manages card-pick state (Priestess / Chariot interactions) and
 * delegates all overlay UI to TableOverlayContent.
 */
import { useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import { useGame } from "../../store/useGame";
import type { StandardCard } from "../../types/types";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityArea } from "./CommunityArea";
import { ActionBar } from "./ActionBar";
import { TarotModal } from "../Modals/TarotModal";
import { InteractionModal } from "../Modals/InteractionModal";
import { HERO_ID_CONST } from "../../store/initialState";
import { PlaygroundDrawer } from "../Dev/PlaygroundDrawer";
import { DealerChip } from "./DealerChip";
import { TableOverlayContent } from "./TableOverlayContent";

const BETTING_STAGES = ["pre-flop", "flop", "turn", "river", "empress"];

export function PokerTable() {
  const { state, dispatch } = useGame();
  const [showTarot, setShowTarot] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<StandardCard | null>(null);

  const cardPickInteraction =
    state.pendingInteraction?.type === "priestess-reveal" ||
    state.pendingInteraction?.type === "chariot-pass"
      ? state.pendingInteraction.type
      : null;

  function handleCardPick(card: StandardCard) {
    setSelectedCard((prev) =>
      prev?.value === card.value && prev?.suit === card.suit ? null : card,
    );
  }

  function confirmCardPick() {
    if (!selectedCard) return;
    if (cardPickInteraction === "priestess-reveal") {
      dispatch({ type: "RESOLVE_PRIESTESS", payload: { card: selectedCard } });
    } else if (cardPickInteraction === "chariot-pass") {
      dispatch({ type: "RESOLVE_CHARIOT", payload: { card: selectedCard } });
    }
    setSelectedCard(null);
  }

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);
  const heroIndex = state.players.findIndex((p) => p.id === HERO_ID_CONST);
  const activePlayer = state.players[state.activePlayerIndex];
  const isHeroTurn =
    activePlayer?.id === HERO_ID_CONST &&
    BETTING_STAGES.includes(state.stage) &&
    state.pendingInteraction === null;

  const bot1 = state.players.find((p) => p.position === 1);
  const bot2 = state.players.find((p) => p.position === 2);
  const bot3 = state.players.find((p) => p.position === 3);
  const bot4 = state.players.find((p) => p.position === 4);

  // Call as a plain function (not JSX) so it can return undefined.
  // If constructed as <TableOverlayContent .../> it would always be a
  // ReactElement (truthy), making ActionBar's overlay guard permanently on.
  const overlayContent = TableOverlayContent({
    cardPickInteraction,
    selectedCard,
    stage: state.stage,
    pendingInteraction: state.pendingInteraction,
    winnerIds: state.winnerIds,
    communityCards: state.communityCards,
    bigBlind: state.bigBlind,
    isFinalHand: state.isFinalHand,
    onConfirmCardPick: confirmCardPick,
    onNextHand: () => { setShowTarot(false); dispatch({ type: "NEXT_HAND" }); },
    onShowTarot: () => setShowTarot(true),
    dispatch,
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "linear-gradient(to bottom, #252525 0%, black 100%)",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1, sm: 2 },
        gap: { xs: 1, sm: 2 },
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Top row: bots at positions 1 and 2 */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="center"
        alignItems="center"
      >
        {bot1 && <PlayerSeat player={bot1} playerIndex={state.players.indexOf(bot1)} />}
        {bot2 && <PlayerSeat player={bot2} playerIndex={state.players.indexOf(bot2)} />}
      </Stack>

      {/* Middle row: bot3 | community area | bot4 */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems="center"
        justifyContent="center"
        flex={1}
      >
        {bot3 && <PlayerSeat player={bot3} playerIndex={state.players.indexOf(bot3)} />}
        <CommunityArea sx={{ flex: 1 }} />
        {bot4 && <PlayerSeat player={bot4} playerIndex={state.players.indexOf(bot4)} />}
      </Stack>

      {/* Bottom row: hero seat */}
      <Stack direction="row" justifyContent="center">
        {hero && (
          <PlayerSeat
            player={hero}
            playerIndex={heroIndex}
            isHero
            onCardClick={cardPickInteraction ? handleCardPick : undefined}
            selectedCard={cardPickInteraction ? selectedCard : undefined}
          />
        )}
      </Stack>

      {/* Action bar */}
      <Box
        sx={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          pt: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ActionBar isVisible={isHeroTurn} overlayContent={overlayContent} />
      </Box>

      {/* Overlay modals */}
      {showTarot && <TarotModal onClose={() => setShowTarot(false)} />}
      <InteractionModal />
      <DealerChip />
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
    </Box>
  );
}
```

- [ ] **Step 2: Run all tests to verify nothing regressed**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/PokerTable.tsx
git commit -m "refactor: slim PokerTable — delegate overlay UIs to TableOverlayContent"
```

---

## Chunk 6: InteractionModal Decomposition

### Task 15: `src/components/Modals/StarDiscardContent.tsx`

**Files:**
- Create: `src/components/Modals/StarDiscardContent.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Dialog content for The Star arcana interaction.
 * The hero may discard their lowest card and draw a replacement.
 */
import { Button, Stack, Typography } from "@mui/material";

interface StarDiscardContentProps {
  onDiscard: () => void;
  onKeep: () => void;
}

export function StarDiscardContent({ onDiscard, onKeep }: StarDiscardContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Discard your lowest card and draw a new one?
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" color="warning" onClick={onDiscard}>
          Discard
        </Button>
        <Button
          variant="outlined"
          onClick={onKeep}
          sx={{ color: "silver.light", borderColor: "silver.dark" }}
        >
          Keep
        </Button>
      </Stack>
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modals/StarDiscardContent.tsx
git commit -m "feat: extract StarDiscardContent modal"
```

---

### Task 16: `src/components/Modals/MoonSwapContent.tsx`

**Files:**
- Create: `src/components/Modals/MoonSwapContent.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Dialog content for The Moon arcana interaction.
 * The hero may swap one hole card for a 3rd card dealt to them.
 */
import { Button, Stack, Typography } from "@mui/material";

interface MoonSwapContentProps {
  onSwap: () => void;
  onKeep: () => void;
}

export function MoonSwapContent({ onSwap, onKeep }: MoonSwapContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Swap one of your hole cards for a 3rd card dealt to you?
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" color="secondary" onClick={onSwap}>
          Swap
        </Button>
        <Button
          variant="outlined"
          onClick={onKeep}
          sx={{ color: "silver.light", borderColor: "silver.dark" }}
        >
          Keep
        </Button>
      </Stack>
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modals/MoonSwapContent.tsx
git commit -m "feat: extract MoonSwapContent modal"
```

---

### Task 17: `src/components/Modals/MagicianGuessContent.tsx`

**Files:**
- Create: `src/components/Modals/MagicianGuessContent.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Dialog content for The Magician arcana interaction.
 * The hero guesses the suit of the top card of the deck.
 * A correct guess grants that card as an extra hole card.
 */
import { Button, Stack, Typography } from "@mui/material";

const SUIT_BUTTONS: { suit: string; label: string }[] = [
  { suit: "hearts",   label: "\u2665 Hearts" },
  { suit: "clubs",    label: "\u2663 Clubs" },
  { suit: "diamonds", label: "\u2666 Diamonds" },
  { suit: "spades",   label: "\u2660 Spades" },
];

interface MagicianGuessContentProps {
  onGuess: (suit: string) => void;
}

export function MagicianGuessContent({ onGuess }: MagicianGuessContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body2" sx={{ color: "silver.light", textAlign: "center" }}>
        Guess the suit of the top card. If correct, you keep it as an extra hole card.
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
        {SUIT_BUTTONS.map(({ suit, label }) => (
          <Button
            key={suit}
            variant="outlined"
            onClick={() => onGuess(suit)}
            sx={{
              color: suit === "hearts" || suit === "diamonds" ? "redSuit.main" : "silver.light",
              borderColor:
                suit === "hearts" || suit === "diamonds" ? "redSuit.main" : "silver.dark",
              "&:hover": { borderColor: "gold.main", color: "gold.main" },
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modals/MagicianGuessContent.tsx
git commit -m "feat: extract MagicianGuessContent modal (owns SUIT_BUTTONS)"
```

---

### Task 18: `src/components/Modals/JudgementReturnContent.tsx`

**Files:**
- Create: `src/components/Modals/JudgementReturnContent.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Dialog content for The Judgement arcana interaction.
 * A folded player may pay one big blind to rejoin the hand with new cards.
 */
import { Button, Stack, Typography } from "@mui/material";

interface JudgementReturnContentProps {
  /** Cost to rejoin, shown in the prompt text. */
  bigBlind: number;
  onRejoin: () => void;
  onSitOut: () => void;
}

export function JudgementReturnContent({
  bigBlind,
  onRejoin,
  onSitOut,
}: JudgementReturnContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Pay 1 big blind ({bigBlind} chips) to rejoin the hand with new cards?
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" color="success" onClick={onRejoin}>
          Rejoin
        </Button>
        <Button variant="outlined" color="error" onClick={onSitOut}>
          Sit Out
        </Button>
      </Stack>
    </Stack>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modals/JudgementReturnContent.tsx
git commit -m "feat: extract JudgementReturnContent modal"
```

---

### Task 19: Slim `src/components/Modals/InteractionModal.tsx`

**Files:**
- Modify: `src/components/Modals/InteractionModal.tsx`

- [ ] **Step 1: Replace InteractionModal.tsx with the slimmed version**

Replace the entire file with:

```tsx
/**
 * Modal dialog for arcana interactions that require a multi-choice decision.
 * Supports minimize to a chip so the player can see the table state first.
 *
 * Interactions handled here (multi-choice, minimize-able):
 *   star-discard, moon-swap, magician-guess, judgement-return
 *
 * Interactions handled inline on the table (ActionBar overlay):
 *   priestess-reveal, chariot-pass, arcana-reveal, page-challenge
 */
import { useState } from "react";
import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import { StarDiscardContent } from "./StarDiscardContent";
import { MoonSwapContent } from "./MoonSwapContent";
import { MagicianGuessContent } from "./MagicianGuessContent";
import { JudgementReturnContent } from "./JudgementReturnContent";

/** Maps interaction type to a dialog title string. Also used for the minimized chip label. */
function dialogTitle(type: string): string {
  switch (type) {
    case "star-discard":     return "The Star: Discard or Keep?";
    case "moon-swap":        return "The Moon: Swap for 3rd Card?";
    case "magician-guess":   return "The Magician: Guess a Suit";
    case "judgement-return": return "Judgement: Rejoin the Hand?";
    // Inline types retained so the minimized chip still gets a label if needed.
    case "priestess-reveal": return "The High Priestess: Reveal a Card";
    default:                 return "Choose";
  }
}

const paperSx = {
  background: "linear-gradient(135deg, #0F3D20 0%, #1a0a2e 100%)",
  border: "1px solid",
  borderColor: "secondary.dark",
  boxShadow: "0 0 40px rgba(155,89,182,0.2)",
};

const titleSx = {
  color: "secondary.main",
  fontFamily: '"Georgia", "Times New Roman", serif',
  textAlign: "center",
  borderBottom: "1px solid rgba(155,89,182,0.2)",
};

export function InteractionModal() {
  const { state, dispatch } = useGame();
  const { pendingInteraction } = state;
  const [minimized, setMinimized] = useState(false);

  // These interaction types are handled inline on the table or in TableOverlayContent.
  if (
    pendingInteraction === null ||
    pendingInteraction.type === "tarot-reading" ||
    pendingInteraction.type === "arcana-reveal" ||
    pendingInteraction.type === "page-challenge" ||
    pendingInteraction.type === "chariot-pass" ||
    pendingInteraction.type === "priestess-reveal"
  ) {
    return null;
  }

  if (minimized) {
    return (
      <Chip
        label={dialogTitle(pendingInteraction.type)}
        onClick={() => setMinimized(false)}
        sx={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 1300,
          bgcolor: "secondary.dark",
          color: "gold.light",
          fontWeight: "bold",
          cursor: "pointer",
          "&:hover": { bgcolor: "secondary.main" },
        }}
      />
    );
  }

  return (
    <Dialog open maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogTitle
        sx={{ ...titleSx, display: "flex", alignItems: "center", justifyContent: "center", pr: 6 }}
      >
        {dialogTitle(pendingInteraction.type)}
        <IconButton
          size="small"
          onClick={() => setMinimized(true)}
          sx={{ position: "absolute", right: 8, top: 8, color: "secondary.light" }}
          title="Minimize"
        >
          &#8722;
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {pendingInteraction.type === "star-discard" && (
          <StarDiscardContent
            onDiscard={() => dispatch({ type: "RESOLVE_STAR", payload: { discard: true } })}
            onKeep={() => dispatch({ type: "RESOLVE_STAR", payload: { discard: false } })}
          />
        )}
        {pendingInteraction.type === "moon-swap" && (
          <MoonSwapContent
            onSwap={() => dispatch({ type: "RESOLVE_MOON", payload: { swap: true } })}
            onKeep={() => dispatch({ type: "RESOLVE_MOON", payload: { swap: false } })}
          />
        )}
        {pendingInteraction.type === "magician-guess" && (
          <MagicianGuessContent
            onGuess={(suit) => dispatch({ type: "RESOLVE_MAGICIAN", payload: { suit } })}
          />
        )}
        {pendingInteraction.type === "judgement-return" && (
          <JudgementReturnContent
            bigBlind={state.bigBlind}
            onRejoin={() => dispatch({ type: "RESOLVE_JUDGEMENT", payload: { rejoin: true } })}
            onSitOut={() => dispatch({ type: "RESOLVE_JUDGEMENT", payload: { rejoin: false } })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Run all tests to verify nothing regressed**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Modals/InteractionModal.tsx
git commit -m "refactor: slim InteractionModal — pre-bind dispatch, compose *Content components"
```

---

## Final Verification

- [ ] **Run the full test suite one last time**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Run the dev server and smoke-test manually**

```bash
npm run dev
```

Open the game and verify:
- Player seats render with cards
- Action bar shows raise slider and buttons on hero's turn
- Community cards deal correctly
- Arcana card animates in when drawn
- Pot/winner display works at showdown
- Tarot and Next Hand buttons appear at showdown
- Interaction modals appear for Star / Moon / Magician / Judgement arcana
- Modals can be minimized
- DEV drawer opens
