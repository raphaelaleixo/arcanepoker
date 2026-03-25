# Tutorial Action Bar Integration — Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Context

The current `TutorialOverlay` renders as a fixed-position bottom panel (180px tall) independent of the game UI. On mobile screens this overlaps the table, clips, and generally breaks the layout. The action bar already supports an `overlayContent` prop using a CSS grid-stack pattern — the same mechanism used for arcana reveals, card picks, and showdown buttons. The tutorial narration should use this same mechanism instead of a separate fixed overlay.

---

## Goal

Move tutorial narration into the action bar's existing `overlayContent` slot, removing the standalone fixed overlay. The result works naturally on all screen sizes with no extra height or layout shifts.

---

## Design

### 1. Strip `TutorialOverlay.tsx`

Remove from `TutorialOverlay`:
- The narration panel (title, body, Continue button)
- The pointer-events blocker box (lines 37–44)
- The fixed `maxHeight: 180px` bottom panel

Keep in `TutorialOverlay`:
- The darkening backdrop (`rgba(0,0,0,0.72)`, z-index 1290, `pointerEvents: "none"`)
- The card highlight logic (`highlightCards` array → elevated z-index on matching cards)

**Guard change:** Replace the current `if (!narration) return null` early-return on line 20 with `if (!tutorial) return null`. Then gate the backdrop and highlight rendering on `highlightCards && highlightCards.length > 0`. This ensures card highlights render even on steps that have no narration text.

**Pointer-events:** The backdrop already has `pointerEvents: "none"`. Remove the separate interaction-blocking box. The `tutorialAllowedAction` mechanism in `ActionButtons` already gates which game actions the hero can take, so free table interaction during narration is safe — no replacement blocker is needed.

### 2. Create `TutorialNarrationContent.tsx`

New small component in `src/components/Tutorial/`. It reads its data directly via `useTutorial()` hook (safe because it is only ever rendered inside the `TutorialProvider` tree).

Two-row layout:

```
Row 1: [TUTORIAL · {title}]  [{Next →} button]   ← gold label, purple button
Row 2: {body text, full wrap, line-height 1.4}    ← white/85% opacity
```

- Container: `1px solid rgba(201,169,110,0.3)` border, full width, padding 8px 10px
- Label: `#c9a96e`, 11px, uppercase, letter-spacing 1px
- Body: `rgba(255,255,255,0.85)`, 13px
- Button: MUI `size="small"` contained, purple (`#7b5ea7`), label **"Next →"** (intentional change from current "Continue →")
- On button click: calls `tutorial.dismissNarration()`

### 3. Update `PokerTable.tsx`

**a) Add tutorial context:**
```tsx
const tutorial = useTutorialOptional();
const isTutorial = tutorial?.isTutorial ?? false;
const narration = tutorial?.narration ?? null;
```

**b) ActionBar visibility:**
```tsx
// Before
isVisible={isHeroTurn}

// After
isVisible={isHeroTurn || (isTutorial && narration !== null)}
```

**c) overlayContent — update the `const overlayContent` declaration in `PokerTable.tsx`:**

`TutorialContext` uses `setTimeout(100ms)` between `dismissNarration` and dispatching `REVEAL_ARCANA` / page-challenge. In that 100ms window `narration` becomes null while `pendingInteraction` is still active, which would cause `TableOverlayContent` to flash in the "Reveal Arcana" button briefly.

Fix: in tutorial mode, skip `TableOverlayContent` entirely — the tutorial manages all interactive flow via `pendingDispatchOnDismiss` automatically. Replace the existing `const overlayContent = TableOverlayContent({...})` block with:

```tsx
// Existing overlayContent call is replaced with:
const overlayContent = isTutorial
  ? (narration ? <TutorialNarrationContent /> : undefined)
  : TableOverlayContent({
      cardPickInteraction,
      selectedCard,
      stage: state.stage,
      pendingInteraction: state.pendingInteraction,
      winnerIds: state.winnerIds,
      communityCards: state.communityCards,
      bigBlind: state.bigBlind,
      isFinalHand: state.isFinalHand,
      onConfirmCardPick: confirmCardPick,
      onKeepBothStar: keepBothStar,
      onNextHand: () => { setShowTarot(false); dispatch({ type: "NEXT_HAND" }); },
      onShowTarot: () => setShowTarot(true),
      dispatch,
    });
```

`TableOverlayContent.tsx` requires no changes.

### 4. `ActionBar.tsx` — No changes

The existing `overlayContent` grid-stack and 200ms opacity fade handle tutorial narration without modification.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Tutorial/TutorialOverlay.tsx` | Remove narration panel + blocker; fix early-return guard; gate backdrop on `highlightCards` |
| `src/components/Tutorial/TutorialNarrationContent.tsx` | **New** — two-row narration component, reads from `useTutorial()` |
| `src/components/Table/PokerTable.tsx` | Add `useTutorialOptional()`, update `isVisible` and `overlayContent` const for ActionBar; skip `TableOverlayContent` entirely in tutorial mode |

---

## Out of Scope

- `ActionBar.tsx` — no changes
- `TutorialContext.tsx` — no changes
- `tutorialScript.ts` — no changes
- `ActionButtons.tsx` — no changes (tutorialAllowedAction highlighting already works)

---

## Verification

1. Run `npm run dev`, navigate to `/tutorial`
2. Narration steps show inside the action bar (two-row layout: title+button / body)
3. Card highlights still appear on relevant steps; backdrop darkens non-highlighted elements
4. "Next →" button advances through narration correctly; `dismissNarration` fires
5. When it's not the hero's turn but narration is active, action bar is still visible
6. When narration is null and it's the hero's turn, normal action buttons show as expected
7. During the `arcana-pending` step: narration shows → user clicks Next → arcana reveals immediately. No "Reveal Arcana" button should appear, even briefly at partial opacity during the ActionBar's 200ms fade transition
8. At narrow viewport width (≤400px), the narration text is not clipped within the ActionBar (note: the table itself is fixed 800px — this verifies only the ActionBar row)
9. Run `npm run test` — all existing tests pass
