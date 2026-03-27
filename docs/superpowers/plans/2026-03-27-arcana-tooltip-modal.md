# Arcana Tooltip & Info Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hover tooltip on the arcana card display and a modal showing all 22 Major Arcana cards with their current game status (active / played / upcoming).

**Architecture:** New `ArcanaInfoModal` component reads game state directly via `useGame()` to derive card statuses. `ArcanaDisplayCard` gains a controlled tooltip + `onOpenArcanaInfo` prop. `PokerTable` wires up the open state and renders the modal alongside existing modals.

**Tech Stack:** React 18, TypeScript, MUI v5 (Dialog, Tooltip, Typography, Box, Stack, Divider), existing `PlayingCard` component, `useGame` hook, `tarot` data.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/Modals/ArcanaInfoModal.tsx` | **Create** | All 22 arcana entries with status styling, intro text, "Got it" button |
| `src/components/Table/ArcanaDisplayCard.tsx` | **Modify** | Add `onOpenArcanaInfo` prop + controlled tooltip |
| `src/components/Table/PokerTable.tsx` | **Modify** | Add `arcanaInfoOpen` state, render `<ArcanaInfoModal>`, pass callback |

---

## Task 1: Create `ArcanaInfoModal`

**Files:**
- Create: `src/components/Modals/ArcanaInfoModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
/**
 * Modal showing all 22 Major Arcana cards with their current game status.
 * Active card gets a gold highlight; played cards are dimmed + grayscale;
 * upcoming cards are shown at full opacity.
 */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import tarot from "../../data/tarot";
import { useGame } from "../../store/useGame";
import type { ArcanaValue } from "../../types/types";

const ALL_ARCANA_VALUES: ArcanaValue[] = [
  "0","1","2","3","4","5","6","7","8","9","10",
  "11","12","13","14","15","16","17","18","19","20","21",
];

type ArcanaEntry = {
  fullName: string;
  tags: string[];
  description: string;
  gameEffect?: string;
};

type CardStatus = "active" | "played" | "upcoming";

function ArcanaCardEntry({
  value,
  status,
}: {
  value: ArcanaValue;
  status: CardStatus;
}) {
  const info = (tarot.arcana as Record<string, ArcanaEntry>)[value];
  if (!info) return null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        opacity: status === "played" ? 0.45 : 1,
        filter: status === "played" ? "grayscale(1)" : "none",
        outline: status === "active" ? "1px solid" : "none",
        outlineColor: status === "active" ? "gold.dark" : "transparent",
        borderRadius: 1,
        p: status === "active" ? 0.5 : 0,
        transition: "opacity 0.3s",
      }}
    >
      <Box sx={{ display: "inline-block", scale: 0.7, flexShrink: 0 }}>
        <PlayingCard rank={value} suit="arcana" flipped />
      </Box>
      <Stack spacing={0}>
        <Typography
          variant="caption"
          sx={{
            color: "gold.main",
            fontWeight: "bold",
            fontSize: "0.875rem",
            fontFamily: 'Young Serif, "Georgia", serif',
          }}
        >
          {info.fullName}
        </Typography>
        <Typography
          component="div"
          variant="caption"
          sx={{
            my: 0.5,
            color: "silver.main",
            fontSize: "0.6rem",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {info.tags.join(" · ")}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "white", fontSize: "0.75rem", lineHeight: 1.5 }}
        >
          {info.description}
        </Typography>
        {info.gameEffect && (
          <Typography
            variant="caption"
            sx={{
              color: "gold.light",
              fontSize: "0.65rem",
              fontStyle: "italic",
              mt: 0.5,
            }}
          >
            {info.gameEffect}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

interface ArcanaInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function ArcanaInfoModal({ open, onClose }: ArcanaInfoModalProps) {
  const { state } = useGame();

  const activeValue = state.activeArcana?.card.value ?? null;
  const deckValues = new Set(state.arcanaDeck.map((c) => c.value));

  function getStatus(value: ArcanaValue): CardStatus {
    if (value === activeValue) return "active";
    if (!deckValues.has(value)) return "played";
    return "upcoming";
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.8)",
            border: "1px solid",
            borderColor: "gold.dark",
            borderRadius: 2,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "gold.main",
          fontFamily: 'Young Serif, "Georgia", serif',
          textAlign: "center",
          fontSize: "1.4rem",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
        }}
      >
        Major Arcana
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
        >
          About
        </Typography>
        <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
          The Major Arcana is a 22-card deck that modifies the rules of the
          game. When the first Page is dealt to the community cards each round,
          the top Arcana card is drawn and its effect takes hold for that hand.
        </Typography>

        <Divider sx={{ my: 2, borderColor: "rgba(255,215,0,0.2)" }} />

        <Typography
          variant="overline"
          sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1.5 }}
        >
          The 22 Arcanas
        </Typography>
        <Stack direction="column" gap={1.5}>
          {ALL_ARCANA_VALUES.map((value) => (
            <ArcanaCardEntry key={value} value={value} status={getStatus(value)} />
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button variant="contained" size="small" onClick={onClose}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output (no errors)

---

## Task 2: Add tooltip to `ArcanaDisplayCard`

**Files:**
- Modify: `src/components/Table/ArcanaDisplayCard.tsx`

- [ ] **Step 1: Update the component**

Replace the full file content:

```tsx
/**
 * Displays the active Major Arcana card and its game-effect description.
 *
 * While the arcana is pending (not yet revealed), the card shows its back
 * and the description reads "An arcana stirs…". After reveal, the card flips
 * and the name/effect fades in. Both states share the same container height
 * via a CSS grid stack so no layout shift occurs.
 */
import { useState } from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { PlayingCard } from "../Card/PlayingCard";
import type { ArcanaCard } from "../../types/types";

// Keyframes live here — they are only used by ArcanaDisplay after the split.
const arcanaRiseIn = keyframes`
  from { opacity: 0; transform: translateY(30px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const arcanaFloatBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-5px); }
`;

interface ArcanaDisplayProps {
  /** The arcana card to show (pending or active). Null hides the whole display. */
  arcanaCardToShow: ArcanaCard | null;
  /**
   * Set while the arcana is pending reveal (before the player clicks "Reveal Arcana").
   * When non-null, the card shows its back and the description shows the pending placeholder.
   */
  pendingArcanaCard: ArcanaCard | null;
  /** Opens the Arcana info modal when "Learn more" is clicked in the tooltip. */
  onOpenArcanaInfo?: () => void;
}

export function ArcanaDisplayCard({
  arcanaCardToShow,
  pendingArcanaCard,
  onOpenArcanaInfo,
}: ArcanaDisplayProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const showTooltip = !!arcanaCardToShow && !!onOpenArcanaInfo;

  const cardContent = (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{
        gridArea: "1 / 1",
        opacity: arcanaCardToShow ? 1 : 0,
        pointerEvents: arcanaCardToShow ? "auto" : "none",
        transition: "opacity 400ms ease",
      }}
    >
      {/* Card animates in and bobs while pending */}
      <Box
        sx={{
          display: "inline-block",
          scale: 0.7,
          animation: pendingArcanaCard
            ? `${arcanaRiseIn} 500ms ease-out both`
            : undefined,
        }}
      >
        <Box
          sx={{
            display: "inline-block",
            lineHeight: 0,
            borderRadius: 1,
            animation: pendingArcanaCard
              ? `${arcanaFloatBob} 2.4s ease-in-out 500ms infinite`
              : undefined,
            boxShadow: pendingArcanaCard
              ? "0 0 12px 4px rgba(179, 57, 219, 0.55)"
              : undefined,
          }}
        >
          <PlayingCard
            rank={arcanaCardToShow?.value}
            suit={arcanaCardToShow?.suit}
            flipped={!!arcanaCardToShow && !pendingArcanaCard}
          />
        </Box>
      </Box>
    </Stack>
  );

  return (
    <Box
      sx={{
        display: "grid",
        width: "100%",
        gridRow: "2 / 4",
        gridColumn: "2",
        position: "relative",
        zIndex: -1,
        "&:before, &:after": {
          content: "''",
          display: "block",
          position: "absolute",
          width: "160%",
          maxWidth: "10em",
          aspectRatio: "69/57",
          backgroundImage: "url(art/background-table.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.3,
        },
        "&:after": {
          zIndex: -1,
          transform: "translateX(-50%) rotate(180deg)",
          top: "auto",
          bottom: 0,
        },
      }}
    >
      {showTooltip ? (
        <Tooltip
          placement="left"
          arrow
          disableInteractive={false}
          open={tooltipOpen}
          onOpen={() => setTooltipOpen(true)}
          onClose={() => setTooltipOpen(false)}
          title={
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "white", display: "block" }}>
                This is a Major Arcana card.
              </Typography>
              <Typography
                variant="caption"
                component="span"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltipOpen(false);
                  onOpenArcanaInfo!();
                }}
                sx={{
                  color: "gold.light",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.65rem",
                }}
              >
                Learn more →
              </Typography>
            </Box>
          }
        >
          {cardContent}
        </Tooltip>
      ) : (
        cardContent
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output (no errors)

---

## Task 3: Wire up `PokerTable`

**Files:**
- Modify: `src/components/Table/PokerTable.tsx`

- [ ] **Step 1: Add import**

Find the existing import block near the top of `PokerTable.tsx` and add:

```tsx
import { ArcanaInfoModal } from "../Modals/ArcanaInfoModal";
```

- [ ] **Step 2: Add state**

Inside `PokerTable()`, alongside the existing `useState` calls:

```tsx
const [arcanaInfoOpen, setArcanaInfoOpen] = useState(false);
```

- [ ] **Step 3: Pass callback to `ArcanaDisplayCard`**

Find the `<ArcanaDisplayCard` usage and add the prop:

```tsx
<ArcanaDisplayCard
  pendingArcanaCard={pendingArcanaCard}
  arcanaCardToShow={arcanaCardToShow}
  onOpenArcanaInfo={() => setArcanaInfoOpen(true)}
/>
```

- [ ] **Step 4: Render the modal**

Find the block where `<PageInfoModal>` is rendered and add directly after it:

```tsx
<ArcanaInfoModal
  open={arcanaInfoOpen}
  onClose={() => setArcanaInfoOpen(false)}
/>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output (no errors)

- [ ] **Step 6: Run tests**

Run: `npm run test -- --run`
Expected: all 134 tests pass, no failures

- [ ] **Step 7: Commit**

```bash
git add src/components/Modals/ArcanaInfoModal.tsx \
        src/components/Table/ArcanaDisplayCard.tsx \
        src/components/Table/PokerTable.tsx \
        docs/superpowers/specs/2026-03-27-arcana-tooltip-modal-design.md \
        docs/superpowers/plans/2026-03-27-arcana-tooltip-modal.md
git commit -m "feat: add tooltip and info modal to arcana card display"
```

---

## Verification Checklist

- [ ] Hover over the arcana card (when visible) → tooltip appears with "This is a Major Arcana card. / Learn more →"
- [ ] Click "Learn more →" → tooltip dismisses, `ArcanaInfoModal` opens
- [ ] Upcoming arcanas render at full opacity, no filter
- [ ] Active arcana has gold outline highlight
- [ ] Played arcanas render at `opacity: 0.45` with `grayscale(1)` filter
- [ ] "Got it" closes the modal
- [ ] No tooltip shown when no arcana card is displayed
