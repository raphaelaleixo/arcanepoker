# Arcana Tooltip & Info Modal

**Date:** 2026-03-27

## Context

Players encountering the Major Arcana card during a game have no in-context explanation of what it is or how the system works. The goal is to surface a tooltip on the arcana card display and a modal that explains the arcana system and shows all 22 cards with their current game status (upcoming / active / played).

---

## Tooltip

**Location:** `ArcanaDisplayCard.tsx` — wraps the card visual
**Trigger:** Hover, only when `arcanaCardToShow` is not null
**Content:** Static text: `"This is a Major Arcana card. Click to learn more."`
**Pattern:** Same controlled tooltip as Page cards — `onMouseDown` + `onClick` with `stopPropagation`, `setOpen(null)` before calling `onOpenArcanaInfo()`

---

## ArcanaInfoModal

**File:** `src/components/Modals/ArcanaInfoModal.tsx`
**Style:** Identical to `PageInfoModal` — `Dialog` with `backgroundColor: "rgba(0,0,0,0.8)"`, `borderColor: "gold.dark"`, `borderRadius: 2`, serif title, dividers, overline section headers, "Got it" close button.

### Sections

**Intro** (always shown)
One short paragraph explaining what Major Arcana cards are: a 22-card deck that modifies game rules; the first Page dealt to the community triggers the top arcana once per round.

**All 22 Arcana Cards** (always shown)
Listed in order (value 0–21). Each entry uses the same `CardEntry` pattern from `PageInfoModal`:
- Card art (`PlayingCard` with `rank` + `suit="arcana"` + `flipped`)
- Full name (gold serif)
- Tags (silver uppercase)
- Description (white body)
- Game effect (gold italic)

**Visual states:**

| State | Condition | Treatment |
|---|---|---|
| Active | `activeArcana?.card.value === entry.value` | Full opacity + gold left border or subtle gold `outline` |
| Played | value NOT in `arcanaDeck` AND not active | `opacity: 0.45`, grayscale filter |
| Upcoming | value in `arcanaDeck` | Full opacity, no decoration |

---

## Data

Played arcana derivation (inside modal, reads from `useGame()`):
```ts
const playedValues = new Set(
  ALL_ARCANA_VALUES.filter(
    v => !state.arcanaDeck.some(c => c.value === v) && state.activeArcana?.card.value !== v
  )
);
```
`ALL_ARCANA_VALUES` = `["0","1",...,"21"]` — constant defined in the modal file.

---

## Prop Chain

| Component | Change |
|---|---|
| `PokerTable.tsx` | Add `arcanaInfoOpen` state; render `<ArcanaInfoModal>`; pass `onOpenArcanaInfo` to `ArcanaDisplayCard` |
| `ArcanaDisplayCard.tsx` | Add `onOpenArcanaInfo?: () => void` prop; add controlled tooltip with local `open` state |

---

## Verification

1. `npm run dev` — hover arcana card → tooltip appears with static text
2. Click "Learn more →" → `ArcanaInfoModal` opens, tooltip dismisses
3. Check upcoming arcana entries are full opacity, played are dimmed + grayscale, active has gold highlight
4. Close with "Got it"
5. `npm run test` — no engine tests broken
