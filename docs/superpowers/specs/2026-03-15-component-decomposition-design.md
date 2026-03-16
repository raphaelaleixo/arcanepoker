# Component Decomposition Design

**Date:** 2026-03-15
**Scope:** Break large UI components into focused single-responsibility files, add comments and documentation throughout.

---

## Goal

Several components have grown to 230–304 lines and mix layout, data derivation, and multiple distinct UI concerns into a single file. This makes it hard for a human to find and change a specific piece of the UI. The goal is to split each large component into focused sub-components (each ~40–80 lines), extract shared helper functions into utility files, and add JSDoc comments so every file's purpose is immediately clear.

**Card components (`src/components/Card/`) are FINALIZED and will not be touched.**

---

## Architecture

### Approach: Co-located sibling files (Option A)

Sub-components live as sibling files in the same existing folder as their parent. This matches the current folder structure (`Table/`, `Modals/`, `Card/`, `Dev/`).

Shared pure helper functions move to `src/utils/`.

---

## Files to Create

### `src/utils/cardUtils.ts`

Pure functions with no React dependencies.

- `actionLabel(action: string): string` — maps action strings (`"fold"`, `"call"`, etc.) to display labels
- `actionColor(action: string)` — maps action strings to MUI chip color variants
- `formatHandRank(rank: string): string` — converts kebab-case rank names to Title Case (e.g. `"two-pair"` → `"Two Pair"`)

### `src/utils/stageUtils.ts`

Pure functions with no React dependencies.

- `stagePill(stage: string): string` — returns the display label for a game stage
- `stageColor(stage: string)` — returns the MUI chip color for a game stage

---

### Table sub-components

#### `Table/PlayerCards.tsx`

**Props:** `holeCards`, `showFaceUp`, `priestessCard`, `onCardClick`, `selectedCard`, `playerIndex`, `wheelRound`

Renders the two hole cards (or empty back-face placeholders). Handles the Priestess reveal edge case (a single opponent card shown face-up without exposing the rest). Applies CSS rotation transforms and the selection lift animation.

#### `Table/PlayerStatusBar.tsx`

**Props:** `currentAction`, `currentBet`, `isAllIn`, `handResult`, `isWinner`, `showHandResult`

Renders the action chip (Fold/Call/Raise/etc.) and the hand rank label. Uses a CSS grid stack (`gridArea: "1/1"`) so the two elements occupy the same cell and cross-fade without causing layout shift. Also renders the bet/all-in line below.

#### `Table/PlayerSeat.tsx` (slimmed)

Derives `isShowdown`, `showFaceUp`, `priestessCard`, `handResult`, `isWinner`. Renders player name/stack header. Composes `<PlayerCards>` and `<PlayerStatusBar>`.

---

#### `Table/RaiseSlider.tsx`

**Props:** `raiseAmount`, `minRaise`, `maxRaise`, `bigBlind`, `sliderDisabled`, `onChange`

Renders the raise-amount label row and the MUI Slider.

#### `Table/ActionButtons.tsx`

**Props:** `canCheck`, `callExceedsStack`, `heroStack`, `toCall`, `isAllIn`, `clampedRaise`, `onFold`, `onCheckOrCall`, `onRaiseOrAllIn`

Renders the Fold / Check|Call / Raise|All-In button row. Documents why `callExceedsStack` changes the Call button into an all-in action.

#### `Table/ActionBar.tsx` (slimmed)

Derives game state values (`toCall`, `canCheck`, `minRaise`, `maxRaise`, Devil arcana modifier). Owns the overlay grid (action controls and overlay content occupy the same CSS grid cell). Composes `<RaiseSlider>` and `<ActionButtons>`.

---

#### `Table/CommunityCards.tsx`

**Props:** `communityCards`, `totalSlots`, `foolCardIndex`, `wheelRound`

Renders the community card row. Handles Fool substitution: when a card's index matches `foolCardIndex`, it renders as a Major Arcana face instead of the standard card face. Also renders empty placeholder slots.

#### `Table/PotDisplay.tsx`

**Props:** `stage`, `potWon`, `winnerIds`, `players`

Renders "Pot: X / Bet: Y" during active betting, and "Name wins X!" (or "Split Pot — X each") at showdown.

#### `Table/ArcanaDisplay.tsx`

**Props:** `arcanaCardToShow`, `pendingArcanaCard`, `displayArcanaData`

Renders the floating Major Arcana card and its description box. Uses a CSS grid stack to cross-fade between the "An arcana stirs…" pending state and the revealed name/effect text. Applies rise-in and float-bob keyframe animations while pending.

#### `Table/CommunityArea.tsx` (slimmed)

Derives `pendingArcanaCard`, `displayArcanaData`, `totalSlots`, `arcanaCardToShow` from game state. Composes `<CommunityCards>`, `<PotDisplay>`, and `<ArcanaDisplay>`.

---

#### `Table/TableOverlayContent.tsx`

**Props:** `cardPickInteraction`, `selectedCard`, `stage`, `pendingInteraction`, `communityCards`, `winnerIds`, `bigBlind`, `isFinalHand`, `onConfirmCardPick`, `onNextHand`, `onShowTarot`, `dispatch`

Returns whichever overlay UI is currently active, or `undefined` if none:

| Branch | Trigger |
|--------|---------|
| Card-pick confirm | `cardPickInteraction === "priestess-reveal"` or `"chariot-pass"` |
| Page Challenge | `pendingInteraction.type === "page-challenge"` |
| Arcana Reveal button | `pendingInteraction.type === "arcana-reveal"` |
| Showdown buttons | `stage === "showdown" && pendingInteraction === null` |

Documents which interactions are handled inline on the table vs. inside `InteractionModal`.

#### `Table/PokerTable.tsx` (slimmed)

Owns: layout rows (top bots / middle community+bots / bottom hero), card-pick state (`selectedCard`), `isHeroTurn` derivation, tarot/playground modal wiring. Composes `<TableOverlayContent>` and passes it as `overlayContent` to `<ActionBar>`.

---

### Modal sub-components

Each content component is self-contained: it receives only the callbacks it needs, renders its own prompt text and buttons, and exports nothing else.

#### `Modals/StarDiscardContent.tsx`
**Props:** `onDiscard`, `onKeep`
The Star arcana: hero may discard their lowest card and draw a replacement.

#### `Modals/MoonSwapContent.tsx`
**Props:** `onSwap`, `onKeep`
The Moon arcana: hero may swap one hole card for a 3rd card dealt to them.

#### `Modals/MagicianGuessContent.tsx`
**Props:** `onGuess(suit: string): void`
The Magician arcana: hero guesses the suit of the top card; a correct guess grants it as an extra hole card.

#### `Modals/JudgementReturnContent.tsx`
**Props:** `bigBlind`, `onRejoin`, `onSitOut`
The Judgement arcana: a folded player may pay one big blind to rejoin the hand with new cards.

#### `Modals/InteractionModal.tsx` (slimmed)
Owns: minimized chip state, Dialog shell, `dialogTitle()` helper, guard clause (returns null for interaction types handled on the table). Composes the appropriate `*Content` component.

---

## Comments & Documentation Style

Every new file gets:

1. **File-level JSDoc** (1–3 lines at the top): what the component does and, where relevant, which game mechanic it serves.
2. **Prop-level JSDoc** on non-obvious props only (e.g. `/** Staggered deal animation index */`).
3. **Inline comments** on tricky patterns:
   - CSS grid stack (`gridArea: "1/1"`) for no-layout-shift cross-fades
   - Priestess reveal edge case in `PlayerCards`
   - Fool substitution in `CommunityCards`
   - "An arcana stirs…" pending state in `ArcanaDisplay`
   - Devil arcana minimum-raise doubling in `ActionBar`

No comments on self-evident code.

---

## What Is Not Changing

- `src/components/Card/` — all card visual components are finalized
- `src/components/Dev/PlaygroundDrawer.tsx` — already under 140 lines, fine as-is
- `src/components/Modals/ResultsModal.tsx` and `TarotModal.tsx` — under 220 lines each with a single clear responsibility; no split needed
- Game engine (`/engine`), store (`/store`), and API (`/api`) — out of scope
