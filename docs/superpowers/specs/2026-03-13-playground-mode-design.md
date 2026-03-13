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

Add to the `GameAction` union, using the narrow `ArcanaValue` type (not `string`) to preserve type safety:

```typescript
| { type: "FORCE_ARCANA"; payload: { value: ArcanaValue } }
```

`ArcanaValue` is already imported from `../types/types` in `storeTypes.ts`.

### Reducer handler (`src/store/gameReducer.ts`)

```
case "FORCE_ARCANA":
  1. Guard (allowlist): only proceed if stage is one of
     "pre-flop" | "flop" | "turn" | "river"
     Return state unchanged for all other stages ("pre-game", "deal", "showdown", "results").
     Rationale: these are the only stages where an active arcana is meaningful. "deal" and
     "results" exist in the GameStage type but are unused by the current reducer; guarding
     them explicitly is defensive-correct.

  2. Build ArcanaCard: { suit: "arcana", value: action.payload.value }

  3. Build resetState = {
       ...state,
       activeArcana: null,
       hierophantShield: false,       ← MUST be cleared before applyArcana is called.
       arcanaTriggeredThisRound: false ← applyArcana sets it back to true; resetting first
     }                                   ensures the flag cycle is clean.

  4. return applyArcana(resetState, arcanaCard)
```

**Routing through `applyArcana`** means all 22 arcana behave exactly as during normal play:

| Category | Arcana | Behaviour |
|---|---|---|
| Immediate terminal | Wheel=10, Death=13, Sun=19 | Transitions game state; no lasting `activeArcana` set |
| Immediate modifier | Tower=16 | Modifies pot, sets `activeArcana` |
| Visual-only (no interaction) | Priestess=2 | Returns `base` with `activeArcana` set; no `pendingInteraction` |
| Interactive | Chariot=7, Magician=1, Star=17, Moon=18, Judgement=20, Temperance=14 | Sets `pendingInteraction` → `InteractionModal` opens as the drawer closes |
| Evaluation flag | Strength=8, Emperor=4, Fool=0, Hermit=9, Lovers=6, Devil=15, Empress=3, Hierophant=5, World=21 | Sets `activeArcana`; effect applied at showdown or stage transition |

**Known limitation — terminal arcana:** Wheel (10), Death (13), and Sun (19) do not leave a lasting `activeArcana`. The "Active" chip in the drawer will not appear for them after forcing.

**Interactive arcana + drawer close:** For interactive arcana, dispatching `FORCE_ARCANA` causes `pendingInteraction` to be set in the same state update that closes the drawer. The drawer closes and the `InteractionModal` opens in the next render. This is the expected behaviour for a dev tool.

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

The component calls `useGame()` internally for `state` and `dispatch` — consistent with the pattern used throughout the codebase (`InteractionModal`, `ActionBar`, etc.). No state or dispatch props are needed.

### Data

```typescript
const ARCANA_LIST = Array.from({ length: 22 }, (_, i) => {
  const value = String(i) as ArcanaValue;
  const data = (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[value];
  return { value, fullName: data.fullName, gameEffect: data.gameEffect ?? null };
});
```

Several arcana entries in `src/data/tarot.ts` are missing `gameEffect` (arcana 16–21). When `gameEffect` is `null`, the description line is simply not rendered — no fallback text is shown.

### Behaviour

- MUI `<Drawer anchor="right">` styled to match existing dark arcane UI (`#0F1A2E` background, purple borders), width ~300px
- Header: "⚗ Arcana Playground" title + subtitle "Dev tool — force any arcana immediately"
- Scrollable list of all 22 arcana (0–21):
  - Row: `"{value}. {fullName}"` in bold + `gameEffect` as secondary text (only if non-null)
  - "Force" button on the right of each row
  - An "Active" chip on the row when `state.activeArcana?.card.value === row.value`
- Force buttons **disabled** when `state.stage` is not in `["pre-flop", "flop", "turn", "river"]`, with a `helperText`-style note: "Start a hand to force arcana"
- On Force click: dispatch `{ type: "FORCE_ARCANA", payload: { value } }`, call `onClose()`

**Note:** arcana 20 displays as `"Judgment"` (from `tarot.ts`) while internal keys spell it `"judgement"`. Display-only inconsistency; no functional impact.

---

## 3. Integration in `PokerTable`

**File:** `src/components/Table/PokerTable.tsx`

### Changes

1. Import `PlaygroundDrawer` from `"../Dev/PlaygroundDrawer"`
2. Add local state: `const [playgroundOpen, setPlaygroundOpen] = useState(false)`
3. Add fixed corner button (unconditional — stage-gating lives inside the drawer):

```tsx
<Button
  size="small"
  variant="outlined"
  onClick={() => setPlaygroundOpen(true)}
  sx={{
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 1200,      // below InteractionModal chip (zIndex: 1300)
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
```

4. Render `<PlaygroundDrawer open={playgroundOpen} onClose={() => setPlaygroundOpen(false)} />` after the existing `<InteractionModal />`

**UI note:** The minimized `InteractionModal` chip lives at `bottom: 80, right: 16`. The DEV button at `bottom: 16` is below it — no visual overlap, acceptable proximity for a dev tool.

---

## 4. Tests

New test cases for `FORCE_ARCANA` (add to `src/engine/__tests__/` or a new `src/store/__tests__/gameReducer.test.ts`):

| Test | Assertion |
|------|-----------|
| Guard — `"pre-game"` stage | Returns state unchanged |
| Guard — `"showdown"` stage | Returns state unchanged |
| Guard — `"deal"` stage | Returns state unchanged |
| Valid force in `"pre-flop"` (Strength=8) | `state.activeArcana?.card.value === "8"` |
| `arcanaTriggeredThisRound` after force | Result state has `arcanaTriggeredThisRound: true` (set by `applyArcana`) |
| Hierophant shield bypass | Forcing any arcana while `hierophantShield: true` still sets `activeArcana` (shield does not cancel) |
| Replaces existing arcana | Forcing arcana B while arcana A is active sets `activeArcana.card.value` to B |

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/store/storeTypes.ts` | Add `FORCE_ARCANA` to `GameAction` union (typed with `ArcanaValue`) |
| `src/store/gameReducer.ts` | Add `case "FORCE_ARCANA"` handler |
| `src/components/Dev/PlaygroundDrawer.tsx` | New file (create `Dev/` directory) |
| `src/components/Table/PokerTable.tsx` | Import drawer, add toggle state, add DEV button, render drawer |
| `src/engine/__tests__/` or new `src/store/__tests__/gameReducer.test.ts` | Add `FORCE_ARCANA` test cases |

---

## Out of Scope

- No persistence of forced arcana across hands (`startHand` resets `activeArcana` normally)
- No undo/reset button (forcing a different arcana or starting a new hand is sufficient)
- No `import.meta.env.DEV` production-strip for now (button is 50% opacity and unobtrusive); trivially addable later
- No completion of missing `gameEffect` fields in `tarot.ts` — component handles nulls by omitting the description line
