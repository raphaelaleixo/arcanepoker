# Arcana Playground Mode — Design Spec

**Date:** 2026-03-13
**Status:** Approved
**Scope:** Dev-only tool for forcing any Major Arcana to be immediately active during a hand

---

## Overview

A developer testing tool that lets the user force any of the 22 Major Arcana to activate immediately on the current game state. Accessed via a small fixed corner button that opens a right-side drawer. Intended for testing arcana effects without waiting for a Page card to appear naturally.

---

## 1. New Game Action: `FORCE_ARCANA`

### Type definition (`src/store/storeTypes.ts`)

Add to the `GameAction` union:

```typescript
| { type: "FORCE_ARCANA"; payload: { value: string } }
```

### Reducer handler (`src/store/gameReducer.ts`)

```
case "FORCE_ARCANA":
  1. Guard: if stage is "pre-game" or "showdown", return state unchanged
  2. Build ArcanaCard: { suit: "arcana", value: payload.value }
  3. Reset arcana state: clear activeArcana, hierophantShield: false, arcanaTriggeredThisRound: false
  4. Call applyArcana(resetState, arcanaCard) — identical code path to a normal arcana reveal
```

**Key behaviour:** By routing through `applyArcana`, all arcana effects work exactly as they do during normal play:
- Immediate effects (Death, Sun, Tower, Wheel) apply instantly
- Interactive flows (Star, Chariot, Moon, Magician, Judgement, Temperance) set `pendingInteraction` and open the `InteractionModal`
- Evaluation modifiers (Strength, Emperor, Fool, Hermit, Lovers, Devil) set `activeArcana` for use at showdown

Forcing an arcana while another is already active replaces it cleanly (prior `activeArcana` is cleared in step 3).

---

## 2. `PlaygroundDrawer` Component

**File:** `src/components/Dev/PlaygroundDrawer.tsx`

### Props

```typescript
interface PlaygroundDrawerProps {
  open: boolean;
  onClose: () => void;
}
```

### Behaviour

- MUI `<Drawer anchor="right">` styled to match the existing dark arcane UI (`#0F1A2E` background, purple borders)
- Header: "⚗ Arcana Playground" title + subtitle "Dev tool — force any arcana immediately"
- Scrollable list of all 22 arcana (0–21) sourced from existing `src/data/tarot.ts`
- Each row displays:
  - Arcana number + full name (e.g. "8. Strength")
  - Game effect description from tarot data
  - A "Force" button
  - An "Active" chip when that arcana is the current `state.activeArcana`
- **Force buttons disabled** when `state.stage` is `"pre-game"` or `"showdown"` — with a helper text explaining why
- On Force click: dispatch `FORCE_ARCANA`, call `onClose()`

### Data source

```typescript
const ARCANA_LIST = Array.from({ length: 22 }, (_, i) => {
  const value = String(i);
  const data = tarot.arcana[value]; // fullName, gameEffect
  return { value, fullName: data.fullName, gameEffect: data.gameEffect };
});
```

---

## 3. Integration in `PokerTable`

**File:** `src/components/Table/PokerTable.tsx`

### Changes

1. Import `PlaygroundDrawer`
2. Add local state: `const [playgroundOpen, setPlaygroundOpen] = useState(false)`
3. Add fixed corner button:

```tsx
<Button
  onClick={() => setPlaygroundOpen(true)}
  sx={{
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 1200,  // below game modals (1300+)
    minWidth: 0,
    px: 1.5,
    py: 0.5,
    fontSize: "0.7rem",
    opacity: 0.6,
    "&:hover": { opacity: 1 },
    // styled to be unobtrusive
  }}
>
  ⚗ DEV
</Button>
```

4. Render `<PlaygroundDrawer open={playgroundOpen} onClose={() => setPlaygroundOpen(false)} />`

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/store/storeTypes.ts` | Add `FORCE_ARCANA` to `GameAction` union |
| `src/store/gameReducer.ts` | Add `case "FORCE_ARCANA"` handler |
| `src/components/Dev/PlaygroundDrawer.tsx` | New component |
| `src/components/Table/PokerTable.tsx` | Import drawer, add toggle state, add DEV button, render drawer |

---

## Out of Scope

- No persistence of forced arcana across hands (each new hand resets `activeArcana` normally)
- No undo/reset button (forcing a different arcana or starting a new hand is sufficient)
- No production build stripping (tool is always present but visually unobtrusive)
