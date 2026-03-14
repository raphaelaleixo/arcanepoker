# Card Deal Animations — Design Spec
_Date: 2026-03-14_

## Overview

Add entrance animations to card dealing in Arcane Poker. When hole cards or community cards are dealt, each card plays a **Drop & Bounce** animation, staggered one after the other.

## Animation Style

**Drop & Bounce** — the card drops in from slightly above with a springy overshoot on landing.

Using the Emotion `keyframes` helper (from `@emotion/react`):

```tsx
import { keyframes } from '@emotion/react';

const dealIn = keyframes`
  from { opacity: 0; transform: translateY(-40px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;
```

Applied via MUI `sx`:
```tsx
sx={{
  animation: `${dealIn} 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
  animationDelay: `${dealIndex * 80}ms`,
}}
```

No custom CSS files. Keyframe defined inline with the Emotion helper.

## New Component

**`src/components/Card/DealtCard.tsx`**

A thin wrapper around `PlayingCard` that applies the deal animation on mount.

```tsx
import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import { PlayingCard } from './PlayingCard';
import type { SxProps } from '@mui/material';
import type { StandardCardValue, ArcanaValue, Suit, ArcanaSuit } from '../../types/types';

// Standalone props — PlayingCard interface is not exported, so we do not extend it
interface DealtCardProps {
  rank?: StandardCardValue | ArcanaValue;
  suit?: Suit | ArcanaSuit;
  small?: boolean;
  flipped?: boolean;
  shade?: boolean;
  sx?: SxProps;
  dealIndex?: number; // controls stagger delay; defaults to 0
}
```

- Wraps `PlayingCard` in a `Box` that holds the animation via MUI `sx`
- `animationDelay` = `dealIndex * 80ms`
- `animation-fill-mode: both` (via the `both` keyword) so the card starts invisible and lands in final position
- **`PlayingCard.tsx` is not modified**

### When animation fires

The animation runs on component **mount only**. It does not re-fire on parent re-renders (e.g., pot updates, active player changes) because React does not remount nodes that survive a re-render. It *will* re-fire when the component unmounts and remounts — for example, at the start of each new hand when `holeCards` resets from filled to empty and back. This is intentional: each new deal gets a fresh animation.

## Integration Points

### `CommunityArea.tsx`

Replace `<PlayingCard>` with `<DealtCard>` only for the main community card slots (the `Array.from({ length: totalSlots })` loop, lines ~100–136).

**Stagger logic:** Pass `dealIndex` equal to the card's position *within the current batch*, not the absolute slot index. This ensures turn and river cards (single cards) always animate at 0ms delay rather than inheriting their slot index delay:

```tsx
// Inside the map over totalSlots:
const previouslyRevealedCount = Math.min(i, state.communityCards.filter((c, j) => j < i && c).length);
const dealIndex = i - previouslyRevealedCount; // 0 for turn/river, 0-2 for flop
```

A simpler approximation that is correct in practice:
- If `state.communityCards[i]` is the first card in this batch (i.e., slot `i-1` was already filled before this render), use `dealIndex={0}`
- Otherwise use the relative position within the batch

The practical implementation: pass `dealIndex={i < 3 ? i : 0}` — this correctly staggers the flop (0, 80, 160ms) and resets to 0ms for turn and river.

**Fool card substitution (slot i where `i === state.foolCardIndex`):** The Fool card occupies a community slot — it **does animate** the same as any other community card. Replace with `<DealtCard>` as normal.

### `PlayerSeat.tsx`

Replace `<PlayingCard>` with `<DealtCard dealIndex={i}>` in the `player.holeCards.map`. Each player's two cards stagger at 0ms and 80ms.

## What Animates vs. What Does Not

| Card | Animates? | Reason |
|------|-----------|--------|
| Community cards (flop/turn/river) | ✅ Yes | Mount when deal happens |
| Hole cards | ✅ Yes | Mount when holeCards populated |
| Fool card in community slot | ✅ Yes | Same slot substitution |
| Empty placeholder slots | ❌ No | `<Box>` element, not a card |
| Priestess revealed card | ❌ No | Separate reveal mechanic, not a deal |
| Pending arcana card (face-down) | ❌ No | Arcana reveal, not a deal |
| Active arcana card (face-up panel) | ❌ No | Arcana state card, not a deal |

## Constraints
- `PlayingCard.tsx`, `CardFront.tsx`, and all `*Art.tsx` files remain unmodified (per CLAUDE.md)
- No changes to game state or the `/engine` directory
- No custom CSS files — animation defined via Emotion `keyframes` + MUI `sx`
- `DealtCardProps` is a standalone interface; does not extend the unexported `PlayingCard` interface
- TypeScript strict mode — no `any`
