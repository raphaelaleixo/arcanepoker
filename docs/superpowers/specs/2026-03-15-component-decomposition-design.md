# Component Decomposition Design

**Date:** 2026-03-15
**Scope:** Break large UI components into focused single-responsibility files, add comments and documentation throughout.

---

## Goal

Several components have grown to 230–304 lines and mix layout, data derivation, and multiple distinct UI concerns into a single file. This makes it hard for a human to find and change a specific piece of the UI. The goal is to split each large component into focused sub-components (each ~40–80 lines), extract shared helper functions into utility files, and add JSDoc comments so every file's purpose is immediately clear.

**Card components (`src/components/Card/`) are FINALIZED and will not be touched.**

---

## Architecture

### Approach: Co-located sibling files

Sub-components live as sibling files in the same existing folder as their parent. Shared pure helpers move to `src/utils/`. No barrel (`index.ts`) files — import directly by path.

---

## Utils

### `src/utils/cardUtils.ts` (new)

Pure functions with no React dependencies.

- `actionLabel(action: string): string` — maps action strings to display labels
- `actionColor(action: string)` — maps action strings to MUI chip color variants
- `formatHandRank(rank: string): string` — converts `"two-pair"` → `"Two Pair"`

**Migration:** delete the originals from `Table/PlayerSeat.tsx` after creating this file.

### `src/utils/stageUtils.ts` (new)

Pure functions with no React dependencies.

- `stagePill(stage: string): string` — display label for a game stage (includes `"empress"`)
- `stageColor(stage: string)` — MUI chip color for a game stage (includes `"empress"`)

**Migration:** delete the originals from `Table/CommunityArea.tsx` after creating this file.

---

## Table Components

### `Table/PlayerCards.tsx` (new) — pure presentational

**Props:** `holeCards: StandardCard[]`, `showFaceUp: boolean`, `priestessCard: StandardCard | null`, `onCardClick?: (card: StandardCard) => void`, `selectedCard?: StandardCard | null`, `playerIndex: number`, `wheelRound: number`

No store access. `wheelRound` is read from `useGame()` by `PlayerSeat` and passed down as a prop — it is used as part of React key seeds to force re-mount on new hands. Renders the two hole cards (or empty back-face placeholders). Applies rotation transforms and selection lift.

**Inline comment:** Priestess reveal edge case — `isPriestessRevealed` allows a single opponent card shown face-up without `showFaceUp` being true.

---

### `Table/PlayerStatusBar.tsx` (new) — pure presentational

**Props:** `currentAction: string | null`, `currentBet: number`, `isAllIn: boolean`, `handResult: { rankName: string } | undefined`, `isWinner: boolean`, `showHandResult: boolean`

No store access. Renders the action chip (Fold/Call/Raise/etc.) and the hand rank label via CSS grid cross-fade, plus the bet/all-in line.

**Inline comment:** CSS grid stack — `gridArea: "1/1"` places action chip and hand rank in the same cell; opacity transitions swap them without layout shift.

---

### `Table/PlayerSeat.tsx` (slimmed)

Continues to call `useGame()` directly (all 5 bot seats and the hero seat render via `PlayerSeat`, so each independently subscribes to the store — this is the existing pattern and is kept). Derives `isShowdown`, `showFaceUp`, `priestessCard`, `handResult`, `isWinner` from state. Renders the player name/stack header. Composes `<PlayerCards>` and `<PlayerStatusBar>`.

---

### `Table/RaiseSlider.tsx` (new) — pure presentational

**Props:** `value: number`, `minRaise: number`, `maxRaise: number`, `bigBlind: number`, `disabled: boolean`, `onChange: (value: number) => void`

No store access. Renders the raise-amount label row and MUI Slider. `raiseAmount` state lives in the parent `ActionBar`.

---

### `Table/ActionButtons.tsx` (new) — pure presentational

**Props:** `canCheck: boolean`, `callExceedsStack: boolean`, `heroStack: number`, `toCall: number`, `isAllIn: boolean`, `clampedRaise: number`, `onFold: () => void`, `onCheckOrCall: () => void`, `onRaiseOrAllIn: () => void`

No store access. Renders Fold / Check|Call / Raise|All-In button row.

**Inline comment:** `callExceedsStack` — when `toCall >= heroStack`, the Call button becomes an all-in action since the hero cannot call more than their remaining stack.

---

### `Table/ActionBar.tsx` (slimmed)

The current `ActionBarInner` internal component is **deleted** — its logic is absorbed directly into the slimmed `ActionBar`. The slimmed `ActionBar`:

- Calls `useGame()` to derive `toCall`, `canCheck`, `minRaise`, `maxRaise` (with Devil arcana modifier)
- Owns `raiseAmount` state via `useState`
- Retains **both** existing props: `isVisible?: boolean` (controls opacity of the action controls layer) and `overlayContent?: ReactNode` (passed in from `PokerTable`)
- Renders the CSS grid overlay stack (action controls and overlay in the same cell)
- Composes `<RaiseSlider>` and `<ActionButtons>`

**Inline comments:**
- Devil arcana modifier: when `effectKey === "devil-double-raise"`, minimum raise is `currentBet * 4` instead of `currentBet * 2`
- CSS grid overlay stack: action controls and `overlayContent` occupy `gridArea: "1/1"`, cross-fading via opacity

---

### `Table/CommunityCards.tsx` (new) — pure presentational

**Props:** `communityCards: StandardCard[]`, `totalSlots: number`, `foolCardIndex: number | null`, `wheelRound: number`

No store access. Renders the community card row. `totalSlots` is 5 normally, 6 when the Empress arcana (`effectKey === "empress-sixth-card"`) is active. When a card index matches `foolCardIndex`, renders it as a Major Arcana face.

**Inline comment:** Fool substitution — `foolCardIndex` marks a community card that is secretly a Fool arcana and must render as arcana face rather than its true value.

---

### `Table/PotDisplay.tsx` (new) — pure presentational

**Props:** `stage: string`, `potWon: number`, `currentBet: number`, `potSize: number`, `winnerIds: string[]`, `players: GamePlayer[]`

No store access. Renders "Pot: X / Bet: Y" during active betting, "Name wins X!" or "Split Pot — X each" at showdown. The hero is re-derived from `players` by `p.type === "human"` (same logic as the existing code — no separate `heroId` prop needed).

---

### `Table/ArcanaDisplay.tsx` (new) — pure presentational

**Props:** `arcanaCardToShow: ArcanaCard | null`, `pendingArcanaCard: ArcanaCard | null`, `displayArcanaData: { fullName: string; gameEffect?: string } | null` (type mirrors the shape from `tarot.arcana`)

No store access. Renders the floating Major Arcana card and its description box. The `arcanaRiseIn` and `arcanaFloatBob` keyframes currently defined in `CommunityArea.tsx` **move into this file** (they are only used here after the split).

**Inline comment:** "An arcana stirs…" pending state — `displayArcanaData` is pre-fetched from the pending card so the description box has stable dimensions before the reveal. A CSS grid stack cross-fades between the pending placeholder text and the revealed name/effect. Rise-in and float-bob keyframe animations apply while pending.

---

### `Table/CommunityArea.tsx` (slimmed)

Retains the existing `sx?: SxProps` prop (PokerTable passes `sx={{ flex: 1 }}` for layout). Calls `useGame()` to derive `pendingArcanaCard`, `displayArcanaData`, `totalSlots`, `arcanaCardToShow`. Composes `<CommunityCards>`, `<PotDisplay>`, and `<ArcanaDisplay>`.

---

### `Table/TableOverlayContent.tsx` (new)

Returns whichever overlay `ReactNode` is active, or `undefined` if none. Constructed by `PokerTable` and passed as the `overlayContent` prop to `ActionBar` (that prop is **retained unchanged**).

**Full prop contract:**

```ts
interface TableOverlayContentProps {
  cardPickInteraction: "priestess-reveal" | "chariot-pass" | null;
  selectedCard: StandardCard | null;
  stage: string;
  pendingInteraction: GameState["pendingInteraction"];
  winnerIds: string[];
  communityCards: StandardCard[];
  bigBlind: number;
  isFinalHand: boolean;
  onConfirmCardPick: () => void;
  onNextHand: () => void;
  onShowTarot: () => void;
  dispatch: ReturnType<typeof useGame>["dispatch"];
}
```

| Branch | Trigger |
|--------|---------|
| Card-pick confirm | `cardPickInteraction === "priestess-reveal"` or `"chariot-pass"` |
| Page Challenge | `pendingInteraction.type === "page-challenge"` |
| Arcana Reveal button | `pendingInteraction.type === "arcana-reveal"` |
| Showdown buttons | `stage === "showdown" && pendingInteraction === null` |

**Inline comment:** Which interactions are handled inline on the table (chariot-pass, priestess-reveal, arcana-reveal, page-challenge — simple one-button confirmations or card-click flows) vs. inside `InteractionModal` (star-discard, moon-swap, magician-guess, judgement-return — multi-choice dialogs that need minimize support).

---

### `Table/PokerTable.tsx` (slimmed)

Owns: layout rows (top bots / middle community+bots / bottom hero), card-pick state (`selectedCard`, `handleCardPick`, `confirmCardPick`), `isHeroTurn` derivation, tarot/playground modal state. Constructs `<TableOverlayContent .../>` and passes result as `overlayContent` to `<ActionBar>`.

---

## Modal Components

Each `*Content` component renders a **complete fragment**: both the body text (what would go in `<DialogContent>`) and the action buttons (what would go in `<DialogActions>`). `InteractionModal` places the chosen content component inside a single `<DialogContent>` wrapper — there is no separate `<DialogActions>` block in the shell.

**Dispatch ownership:** `InteractionModal` calls `useGame()` and is responsible for all `dispatch` calls. It passes **pre-bound callbacks** (e.g. `onDiscard={() => dispatch({ type: "RESOLVE_STAR", payload: { discard: true } })}`) to each `*Content` component. The content components themselves never call `dispatch` and have no store dependency.

### `Modals/StarDiscardContent.tsx` (new) — pure presentational

**Props:** `onDiscard: () => void`, `onKeep: () => void`

Renders prompt text + Discard / Keep buttons as a single fragment. The Star arcana: hero may discard their lowest card and draw a replacement.

---

### `Modals/MoonSwapContent.tsx` (new) — pure presentational

**Props:** `onSwap: () => void`, `onKeep: () => void`

Renders prompt text + Swap / Keep buttons. The Moon arcana: hero may swap one hole card for a 3rd dealt card.

---

### `Modals/MagicianGuessContent.tsx` (new) — pure presentational

**Props:** `onGuess: (suit: string) => void`

Renders prompt text + 4 suit buttons. The Magician arcana: hero guesses the suit of the top card; correct guess grants it as an extra hole card. The `SUIT_BUTTONS` constant (`{ suit, label }[]`) moves into this file.

---

### `Modals/JudgementReturnContent.tsx` (new) — pure presentational

**Props:** `bigBlind: number`, `onRejoin: () => void`, `onSitOut: () => void`

Renders prompt text (with cost) + Rejoin / Sit Out buttons. The Judgement arcana: a folded player may pay one big blind to rejoin with new cards.

---

### `Modals/InteractionModal.tsx` (slimmed)

Owns: minimized chip state, Dialog shell (title + single `<DialogContent>`), `dialogTitle()` helper. `dialogTitle()` stays co-located — maps interaction type strings to dialog title text, used for both the Dialog title and the minimized chip label. Existing cases for inline interaction types (`"priestess-reveal"`, `"chariot-pass"`, etc.) are **retained** since they still label the minimized chip even though those types are guarded out before the Dialog renders.

Composes the appropriate `*Content` component inside a single `<DialogContent>`.

---

## Comments & Documentation Style

Every new file gets:

1. **File-level JSDoc** (1–3 lines): what the component does and which game mechanic it relates to (where applicable).
2. **Prop-level JSDoc** on non-obvious props only (e.g. `/** Staggered deal animation index */`).
3. **Inline comments** at the specific locations called out per file above.

No comments on self-evident code.

---

## What Is Not Changing

- `src/components/Card/` — all card visual components are finalized
- `src/components/Dev/PlaygroundDrawer.tsx` — already under 140 lines
- `src/components/Modals/ResultsModal.tsx` and `TarotModal.tsx` — single responsibility, no split needed
- `src/components/Table/DealerChip.tsx` — already small and single-purpose
- Game engine (`/engine`), store (`/store`), and API (`/api`) — out of scope
