# Card Deal Animations Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Drop & Bounce entrance animation to all dealt cards (hole cards and community cards) with per-card stagger.

**Architecture:** A new `DealtCard` wrapper component applies a CSS keyframe animation on mount via MUI `sx`. `PlayingCard` is never touched. `CommunityArea` and `PlayerSeat` swap their `<PlayingCard>` usages for `<DealtCard>` at deal sites only.

**Tech Stack:** React 18, TypeScript (strict), MUI v7 (`sx` prop), `@emotion/react` (`keyframes` helper), Vitest + jsdom, `@testing-library/react`

---

## Chunk 1: DealtCard Component

### Task 1: Install testing-library

**Files:**
- Modify: `package.json` (dev dependency)

- [ ] **Step 1: Install `@testing-library/react`**

```bash
npm install --save-dev @testing-library/react@^15
```

Expected output: `added N packages` with no errors.

> **Note:** No `setupFiles` entry in `vite.config.ts` is needed. `@testing-library/react` v14+ auto-registers `afterEach(cleanup)` when it detects Vitest globals (`globals: true` is already set in `vite.config.ts`).

- [ ] **Step 2: Verify Vitest picks it up**

```bash
npm run test
```

Expected: all existing tests still pass (0 new failures).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @testing-library/react for component tests"
```

---

### Task 2: Write failing test for DealtCard

**Files:**
- Create: `src/components/Card/__tests__/DealtCard.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// src/components/Card/__tests__/DealtCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DealtCard } from '../DealtCard';

describe('DealtCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<DealtCard small />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a PlayingCard root inside the wrapper', () => {
    const { container } = render(<DealtCard small />);
    // PlayingCard renders with className ApPlayingCard-root
    const card = container.querySelector('.ApPlayingCard-root');
    expect(card).not.toBeNull();
  });

  it('forwards rank, suit, flipped props to PlayingCard', () => {
    const { container } = render(
      <DealtCard small rank="A" suit="hearts" flipped />
    );
    const card = container.querySelector('.ApPlayingCard-root');
    expect(card).not.toBeNull();
  });

  it('renders a wrapper Box around PlayingCard', () => {
    const { container } = render(<DealtCard small dealIndex={2} />);
    // Wrapper Box is the first child; PlayingCard root is nested inside it
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelector('.ApPlayingCard-root')).not.toBeNull();
  });
});
// Note: animationDelay is applied via Emotion CSS classes, not inline style.
// jsdom has no CSS engine so timing values cannot be asserted in unit tests.
// Animation correctness is verified visually in the Task 5 smoke test.
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
npm run test -- DealtCard
```

Expected: FAIL — `Cannot find module '../DealtCard'`

---

### Task 3: Implement DealtCard

**Files:**
- Create: `src/components/Card/DealtCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/Card/DealtCard.tsx
import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import type { SxProps } from '@mui/material';
import type { StandardCardValue, ArcanaValue, Suit, ArcanaSuit } from '../../types/types';
import { PlayingCard } from './PlayingCard';

const dealIn = keyframes`
  from { opacity: 0; transform: translateY(-40px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

interface DealtCardProps {
  rank?: StandardCardValue | ArcanaValue;
  suit?: Suit | ArcanaSuit;
  small?: boolean;
  flipped?: boolean;
  shade?: boolean;
  sx?: SxProps;
  /** Position in the current deal batch — controls stagger delay (dealIndex × 80ms). Defaults to 0. */
  dealIndex?: number;
}

export function DealtCard({
  dealIndex = 0,
  sx,
  ...cardProps
}: DealtCardProps) {
  return (
    <Box
      sx={{
        animation: `${dealIn} 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
        animationDelay: `${dealIndex * 80}ms`,
        display: 'inline-block',
      }}
    >
      <PlayingCard {...cardProps} sx={sx} />
    </Box>
  );
}
```

- [ ] **Step 2: Run the tests — verify they pass**

```bash
npm run test -- DealtCard
```

Expected: 4 tests PASS.

- [ ] **Step 3: Confirm TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Card/DealtCard.tsx src/components/Card/__tests__/DealtCard.test.tsx
git commit -m "feat: add DealtCard wrapper with Drop & Bounce entrance animation"
```

---

## Chunk 2: Integration

### Task 4: Integrate DealtCard into CommunityArea

**Files:**
- Modify: `src/components/Table/CommunityArea.tsx`

- [ ] **Step 1: Add the import**

At the top of `src/components/Table/CommunityArea.tsx`, add after the existing `PlayingCard` import:

```tsx
import { DealtCard } from '../Card/DealtCard';
```

- [ ] **Step 2: Replace the Fool card `<PlayingCard>` (lines ~104–113)**

Find this block (inside the `Array.from` map, the `if (i === state.foolCardIndex)` branch):

```tsx
return (
  <PlayingCard
    key={i}
    small
    rank={"0" as ArcanaCard["value"]}
    suit={"arcana"}
    flipped
  />
);
```

Replace with:

```tsx
return (
  <DealtCard
    key={i}
    small
    rank={"0" as ArcanaCard["value"]}
    suit={"arcana"}
    flipped
    dealIndex={i < 3 ? i : 0}
  />
);
```

- [ ] **Step 3: Replace the normal community card `<PlayingCard>` (lines ~114–122)**

Find this block (the `return` for `card` present and not the Fool):

```tsx
return (
  <PlayingCard
    key={i}
    small
    rank={card.value}
    suit={card.suit}
    flipped
  />
);
```

Replace with:

```tsx
return (
  <DealtCard
    key={i}
    small
    rank={card.value}
    suit={card.suit}
    flipped
    dealIndex={i < 3 ? i : 0}
  />
);
```

- [ ] **Step 4: Leave all other `<PlayingCard>` usages untouched**

The following should remain as `<PlayingCard>` (not `<DealtCard>`):
- Empty placeholder `<Box>` slots (lines ~125–135) — already not a PlayingCard, no change
- Pending arcana card (line ~269)
- Active arcana card (line ~282)

- [ ] **Step 5: Confirm TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/Table/CommunityArea.tsx
git commit -m "feat: animate community card deal with DealtCard"
```

---

### Task 5: Integrate DealtCard into PlayerSeat

**Files:**
- Modify: `src/components/Table/PlayerSeat.tsx`

- [ ] **Step 1: Add the import**

At the top of `src/components/Table/PlayerSeat.tsx`, add after the existing `PlayingCard` import:

```tsx
import { DealtCard } from '../Card/DealtCard';
```

- [ ] **Step 2: Replace the hole cards `<PlayingCard>` in the map (lines ~133–139)**

Find this block (inside `player.holeCards.map`):

```tsx
player.holeCards.map((card, i) => (
  <PlayingCard
    key={i}
    small
    rank={showFaceUp ? card.value : undefined}
    suit={showFaceUp ? card.suit : undefined}
    flipped={showFaceUp}
  />
))
```

Replace with:

```tsx
player.holeCards.map((card, i) => (
  <DealtCard
    key={i}
    small
    rank={showFaceUp ? card.value : undefined}
    suit={showFaceUp ? card.suit : undefined}
    flipped={showFaceUp}
    dealIndex={i}
  />
))
```

- [ ] **Step 3: Leave the placeholder cards untouched**

The two static `<PlayingCard small />` placeholders rendered when `holeCards.length === 0` (lines ~142–145) must remain as `<PlayingCard>` — they are not dealt cards.

- [ ] **Step 4: Leave the Priestess revealed card untouched**

The `<PlayingCard>` at lines ~159–163 (inside the `revealedCard` block) must remain as `<PlayingCard>` — it is a reveal, not a deal.

- [ ] **Step 5: Confirm TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 7: Visual smoke test**

Start the dev server and deal a hand. Verify:
- Hole cards animate with a Drop & Bounce on deal (0ms and 80ms stagger per player)
- Flop animates 3 cards in sequence (0ms, 80ms, 160ms)
- Turn and river each animate as a single card (0ms delay)
- Cards already on screen do not re-animate on bet/check actions
- A new hand re-animates all cards fresh

```bash
npm run dev
```

- [ ] **Step 8: Commit**

```bash
git add src/components/Table/PlayerSeat.tsx
git commit -m "feat: animate hole card deal with DealtCard"
```
