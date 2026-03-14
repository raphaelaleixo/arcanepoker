# Card Deal Animations — Design Spec
_Date: 2026-03-14_

## Overview

Add entrance animations to card dealing in Arcane Poker. When hole cards or community cards are dealt, each card plays a **Drop & Bounce** animation, staggered one after the other.

## Animation Style

**Drop & Bounce** — the card drops in from slightly above with a springy overshoot on landing.

```css
@keyframes dealIn {
  from { opacity: 0; transform: translateY(-40px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
/* timing: 350ms, cubic-bezier(0.34, 1.56, 0.64, 1) */
```

Stagger delay per card: `dealIndex * 80ms`.

## New Component

**`src/components/Card/DealtCard.tsx`**

A thin wrapper around `PlayingCard` that applies the deal animation on mount.

```tsx
interface DealtCardProps extends PlayingCardProps {
  dealIndex?: number; // controls stagger delay, defaults to 0
}
```

- Wraps `PlayingCard` in a `Box` that holds the `@keyframes dealIn` animation via MUI `sx`
- `animation-delay` = `dealIndex * 80ms`
- `animation-fill-mode: both` so the card starts invisible and lands in final position
- `PlayingCard` itself is **not modified**

## Integration Points

### `CommunityArea.tsx`
- Replace `<PlayingCard>` with `<DealtCard dealIndex={i}>` for slots where `card` exists
- Empty placeholder slots remain as `<Box>` (no change)
- Natural stagger: flop cards animate at 0ms, 80ms, 160ms; turn at 0ms; river at 0ms

### `PlayerSeat.tsx`
- Replace `<PlayingCard>` with `<DealtCard dealIndex={i}>` in the hole cards map
- Cards only mount when `player.holeCards.length > 0`, so animation fires at deal time
- Two cards stagger at 0ms and 80ms per player

## What Does NOT Animate
- Empty placeholder slots in `CommunityArea`
- The Priestess revealed card (separate reveal mechanic)
- Cards already visible before a re-render (already mounted)

## Constraints
- `PlayingCard.tsx`, `CardFront.tsx`, and all `*Art.tsx` files remain unmodified (per CLAUDE.md)
- No changes to game state or the `/engine` directory
- No custom CSS files — animation defined via MUI `sx` prop
- TypeScript strict mode — no `any`
