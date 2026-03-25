# Tutorial Action Bar Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move tutorial narration from a broken fixed-position overlay into the ActionBar's existing `overlayContent` slot, making the tutorial work on mobile.

**Architecture:** Create a new `TutorialNarrationContent` component that reads from `useTutorial()` and renders a two-row narration panel. Strip `TutorialOverlay` down to backdrop+highlights only. Update `PokerTable` to feed narration as `overlayContent` and force ActionBar visible during narration steps.

**Tech Stack:** React 18, TypeScript, MUI v5, Vitest, @testing-library/react

**Spec:** `docs/superpowers/specs/2026-03-25-tutorial-action-bar-design.md`

---

## Chunk 1: New component + stripped overlay

### Task 1: TutorialNarrationContent component

**Files:**
- Create: `src/components/Tutorial/TutorialNarrationContent.tsx`
- Create: `src/components/Tutorial/__tests__/TutorialNarrationContent.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/Tutorial/__tests__/TutorialNarrationContent.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TutorialNarrationContent } from '../TutorialNarrationContent';

const mockDismiss = vi.fn();

vi.mock('../../../tutorial/TutorialContext', () => ({
  useTutorial: () => ({
    isTutorial: true as const,
    narration: { title: 'The Page Card', body: 'Lowest card in isolation.' },
    dismissNarration: mockDismiss,
    tutorialAllowedAction: null,
    isComplete: false,
    highlightCards: null,
    currentRound: 1 as const,
  }),
}));

describe('TutorialNarrationContent', () => {
  it('renders the narration title and body', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    expect(getByText(/The Page Card/)).not.toBeNull();
    expect(getByText(/Lowest card in isolation/)).not.toBeNull();
  });

  it('renders TUTORIAL label in uppercase', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    expect(getByText(/TUTORIAL/i)).not.toBeNull();
  });

  it('calls dismissNarration when Next button is clicked', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    fireEvent.click(getByText('Next →'));
    expect(mockDismiss).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/raphaelavellar/Documents/Projects/arcanepoker
npm run test -- src/components/Tutorial/__tests__/TutorialNarrationContent.test.tsx
```

Expected: FAIL — `TutorialNarrationContent` does not exist yet.

- [ ] **Step 3: Implement TutorialNarrationContent**

Create `src/components/Tutorial/TutorialNarrationContent.tsx`:

```tsx
// src/components/Tutorial/TutorialNarrationContent.tsx
import { Box, Button, Typography } from "@mui/material";
import { useTutorial } from "../../tutorial/TutorialContext";

/**
 * Two-row narration panel rendered inside the ActionBar's overlayContent slot.
 * Row 1: gold label + title on left, "Next →" button on right.
 * Row 2: body text, full wrap.
 * Reads state directly from TutorialContext — only render inside TutorialProvider.
 */
export function TutorialNarrationContent() {
  const { narration, dismissNarration } = useTutorial();

  if (!narration) return null;

  return (
    <Box
      sx={{
        width: "100%",
        border: "1px solid rgba(201,169,110,0.3)",
        borderRadius: 1,
        px: 1.25,
        py: 1,
      }}
    >
      {/* Row 1: label + title + button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.5,
        }}
      >
        <Typography
          sx={{
            color: "#c9a96e",
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            lineHeight: 1,
          }}
        >
          Tutorial · {narration.title}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={dismissNarration}
          sx={{
            background: "#7b5ea7",
            "&:hover": { background: "#9370cc" },
            flexShrink: 0,
            fontSize: "0.7rem",
            py: 0.25,
          }}
        >
          Next →
        </Button>
      </Box>

      {/* Row 2: body */}
      <Typography
        sx={{
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.75rem",
          lineHeight: 1.4,
        }}
      >
        {narration.body}
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/components/Tutorial/__tests__/TutorialNarrationContent.test.tsx
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/Tutorial/TutorialNarrationContent.tsx src/components/Tutorial/__tests__/TutorialNarrationContent.test.tsx
git commit -m "feat: add TutorialNarrationContent component for action bar slot"
```

---

### Task 2: Strip TutorialOverlay to highlights-only

**Files:**
- Modify: `src/components/Tutorial/TutorialOverlay.tsx`
- Create: `src/components/Tutorial/__tests__/TutorialOverlay.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/Tutorial/__tests__/TutorialOverlay.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TutorialOverlay } from '../TutorialOverlay';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Shared mock factory
function makeTutorialMock(overrides = {}) {
  return {
    isTutorial: true as const,
    narration: null,
    dismissNarration: vi.fn(),
    tutorialAllowedAction: null,
    isComplete: false,
    highlightCards: null,
    currentRound: 1 as const,
    ...overrides,
  };
}

vi.mock('../../../tutorial/TutorialContext', () => ({
  useTutorialOptional: vi.fn(),
}));

import { useTutorialOptional } from '../../../tutorial/TutorialContext';

describe('TutorialOverlay (stripped)', () => {
  it('renders nothing when there is no tutorial context', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(null);
    const { container } = render(<TutorialOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the backdrop when highlightCards is non-empty', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(
      makeTutorialMock({
        highlightCards: [{ suit: 'hearts', value: 'A' }],
      })
    );
    const { container } = render(<TutorialOverlay />);
    // Backdrop box should be present
    expect(container.firstChild).not.toBeNull();
  });

  it('renders nothing when highlightCards is empty', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(
      makeTutorialMock({ highlightCards: [] })
    );
    const { container } = render(<TutorialOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('does NOT render a narration panel', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(
      makeTutorialMock({
        narration: { title: 'Test', body: 'Should not appear' },
        highlightCards: [{ suit: 'hearts', value: 'A' }],
      })
    );
    const { queryByText } = render(<TutorialOverlay />);
    expect(queryByText('Should not appear')).toBeNull();
    expect(queryByText('Continue →')).toBeNull();
    expect(queryByText('Next →')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/components/Tutorial/__tests__/TutorialOverlay.test.tsx
```

Expected: FAIL — current `TutorialOverlay` still has narration panel and the guard is `!narration`.

- [ ] **Step 3: Rewrite TutorialOverlay**

> **Note on "card highlight logic":** The existing code does not implement per-card z-index elevation. The backdrop darkening IS the highlight mechanism — it dims everything, and cards with elevated z-index would show through. That per-card elevation is not in the current codebase and is out of scope here. The stripped overlay keeps the backdrop, which is the only visual effect that existed.

Replace the full contents of `src/components/Tutorial/TutorialOverlay.tsx`:

```tsx
// src/components/Tutorial/TutorialOverlay.tsx
import { useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

/**
 * Visual-effects-only layer for the tutorial.
 * Renders the darkening backdrop and card highlight z-index elevation.
 * Narration text is handled by TutorialNarrationContent inside ActionBar.
 */
export function TutorialOverlay() {
  const tutorial = useTutorialOptional();
  const navigate = useNavigate();

  const isComplete = tutorial?.isComplete ?? false;
  useEffect(() => {
    if (isComplete) navigate("/game");
  }, [isComplete, navigate]);

  if (!tutorial) return null;

  const { highlightCards } = tutorial;

  if (!highlightCards || highlightCards.length === 0) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1290,
        background: "rgba(0,0,0,0.72)",
        pointerEvents: "none",
      }}
    />
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- src/components/Tutorial/__tests__/TutorialOverlay.test.tsx
```

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/Tutorial/TutorialOverlay.tsx src/components/Tutorial/__tests__/TutorialOverlay.test.tsx
git commit -m "refactor: strip TutorialOverlay to backdrop+highlights only"
```

---

## Chunk 2: PokerTable wiring

### Task 3: Wire TutorialNarrationContent into PokerTable

**Files:**
- Modify: `src/components/Table/PokerTable.tsx` (lines 7–95)

This task has no new unit tests — the changes are wiring-level and covered by the manual verification checklist at the end.

- [ ] **Step 1: Add the import for TutorialNarrationContent and useTutorialOptional**

In `src/components/Table/PokerTable.tsx`, the existing imports already include `TutorialOverlay`. Add two new imports after line 21:

```tsx
import { useTutorialOptional } from "../../tutorial/TutorialContext";
import { TutorialNarrationContent } from "../Tutorial/TutorialNarrationContent";
```

- [ ] **Step 2: Derive tutorial state inside the component**

Inside `PokerTable()`, after the existing `useGame()` call (line 27), add:

```tsx
const tutorial = useTutorialOptional();
const isTutorial = tutorial?.isTutorial ?? false;
const narration = tutorial?.narration ?? null;
```

- [ ] **Step 3: Replace the overlayContent const**

Replace lines 78–95 (the `const overlayContent = TableOverlayContent({...})` block) with:

```tsx
// In tutorial mode, skip TableOverlayContent entirely — the tutorial manages
// all interactive flow via pendingDispatchOnDismiss automatically.
// This also prevents the arcana-reveal button from flashing during the 100ms
// gap between dismissNarration() and the REVEAL_ARCANA dispatch.
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
      onNextHand: () => {
        setShowTarot(false);
        dispatch({ type: "NEXT_HAND" });
      },
      onShowTarot: () => setShowTarot(true),
      dispatch,
    });
```

- [ ] **Step 4: Update ActionBar's isVisible prop**

Find the `<ActionBar` JSX element and update its `isVisible` prop:

```tsx
// Before
isVisible={isHeroTurn}

// After
isVisible={isHeroTurn || (isTutorial && narration !== null)}
```

- [ ] **Step 5: Run all tests**

```bash
npm run test
```

Expected: All tests pass. No regressions.

- [ ] **Step 6: Commit**

```bash
git add src/components/Table/PokerTable.tsx
git commit -m "feat: wire tutorial narration into ActionBar overlayContent"
```

---

## Verification Checklist

Run `npm run dev` and navigate to `/tutorial`. Verify each item manually:

- [ ] Narration steps show inside the action bar (two-row: title+button top row, body below)
- [ ] "Next →" label (not "Continue →") advances each step
- [ ] Card highlights render with backdrop darkening on relevant steps
- [ ] Backdrop does NOT block clicks (pointerEvents: none)
- [ ] When it is not the hero's betting turn but narration is active, the action bar is visible
- [ ] When narration is null and it is the hero's turn, normal Fold / Call / Raise buttons show
- [ ] During the arcana step: narration shows → click Next → arcana reveals immediately with no "Reveal Arcana" button flash (check at both normal and slow network in devtools)
- [ ] At narrow viewport width (resize browser to ~400px): narration text is not clipped within the ActionBar row
- [ ] Tutorial completes successfully and navigates to `/game`
- [ ] Run `npm run test` — all existing tests pass
