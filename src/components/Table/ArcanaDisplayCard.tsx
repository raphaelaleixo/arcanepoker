/**
 * Displays the active Major Arcana card and its game-effect description.
 *
 * While the arcana is pending (not yet revealed), the card shows its back
 * and the description reads "An arcana stirs…". After reveal, the card flips
 * and the name/effect fades in. Both states share the same container height
 * via a CSS grid stack so no layout shift occurs.
 */
import { Box, Stack } from "@mui/material";
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
}

export function ArcanaDisplayCard({
  arcanaCardToShow,
  pendingArcanaCard,
}: ArcanaDisplayProps) {
  return (
    <Box
      sx={{ display: "grid", width: "100%", gridRow: "2 / 4", gridColumn: "2" }}
    >
      {/* Arcana card + description — same grid cell, fades in when active */}
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
    </Box>
  );
}
