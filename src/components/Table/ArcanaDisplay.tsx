/**
 * Displays the active Major Arcana card and its game-effect description.
 *
 * While the arcana is pending (not yet revealed), the card shows its back
 * and the description reads "An arcana stirs…". After reveal, the card flips
 * and the name/effect fades in. Both states share the same container height
 * via a CSS grid stack so no layout shift occurs.
 */
import { Box, Stack, Typography } from "@mui/material";
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
  /**
   * Pre-fetched from the pending card so the description box has stable dimensions
   * before the reveal animation. Null when no arcana is active.
   * Shape matches tarot.arcana record values: { fullName, gameEffect? }.
   */
  displayArcanaData: { fullName: string; gameEffect?: string } | null;
}

export function ArcanaDisplay({
  arcanaCardToShow,
  pendingArcanaCard,
  displayArcanaData,
}: ArcanaDisplayProps) {
  return (
    <Box sx={{ display: "grid", width: "100%" }}>
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
            animation: pendingArcanaCard ? `${arcanaRiseIn} 500ms ease-out both` : undefined,
          }}
        >
          <Box
            sx={{
              display: "inline-block",
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
              small
              rank={arcanaCardToShow?.value}
              suit={arcanaCardToShow?.suit}
              flipped={!!arcanaCardToShow && !pendingArcanaCard}
            />
          </Box>
        </Box>

        {/* Description box: fixed size, CSS grid stack inside */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: "secondary.dark",
            borderRadius: 2,
            p: 1,
            maxWidth: 180,
            minWidth: 120,
            background: "rgba(108,52,131,0.2)",
            textAlign: "center",
          }}
        >
          {/*
            displayArcanaData is pre-fetched from the pending card so the box
            has stable dimensions before the reveal. The CSS grid stack cross-fades
            between the "An arcana stirs…" placeholder and the revealed name/effect.
          */}
          <Box sx={{ display: "grid" }}>
            {/* Pending placeholder — visible before reveal */}
            <Box
              sx={{
                gridArea: "1 / 1",
                opacity: pendingArcanaCard ? 1 : 0,
                pointerEvents: pendingArcanaCard ? "auto" : "none",
                transition: "opacity 300ms ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "secondary.light", fontStyle: "italic" }}>
                An arcana stirs...
              </Typography>
            </Box>

            {/* Revealed name + effect — visible after reveal */}
            <Box
              sx={{
                gridArea: "1 / 1",
                opacity: pendingArcanaCard ? 0 : 1,
                pointerEvents: pendingArcanaCard ? "none" : "auto",
                transition: "opacity 300ms ease",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "secondary.main",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                }}
              >
                {displayArcanaData?.fullName}
              </Typography>
              {displayArcanaData?.gameEffect && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "silver.light",
                    fontSize: "0.65rem",
                    fontStyle: "italic",
                    mt: 0.25,
                  }}
                >
                  {displayArcanaData.gameEffect}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
