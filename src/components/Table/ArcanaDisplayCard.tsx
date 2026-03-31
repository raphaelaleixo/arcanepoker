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
import { CardBack } from "../Card/CardBack";
import type { ArcanaCard } from "../../types/types";
import backgroundTableUrl from "../../assets/background-table.svg?url";

const arcanaFloatBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-5px); }
`;

const arcanaThrowOff = keyframes`
  0%   { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
  100% { opacity: 0; transform: translateY(-80px) translateX(100px) rotate(30deg); }
`;

interface ArcanaDisplayProps {
  /** The arcana card to show (pending or active). Null hides the whole display. */
  arcanaCardToShow: ArcanaCard | null;
  /**
   * Set while the arcana is pending reveal (before the player clicks "Reveal Arcana").
   * When non-null, the card shows its back and the description shows the pending placeholder.
   */
  pendingArcanaCard: ArcanaCard | null;
  /** When true, the top card animates flying off the deck before the round resets. */
  isDiscarding?: boolean;
  /** Opens the Arcana info modal when "Learn more" is clicked in the tooltip. */
  onOpenArcanaInfo?: () => void;
}

export function ArcanaDisplayCard({
  arcanaCardToShow,
  pendingArcanaCard,
  isDiscarding = false,
  onOpenArcanaInfo,
}: ArcanaDisplayProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const showTooltip = !!onOpenArcanaInfo;

  const tooltipTitle = (
    <Box sx={{ textAlign: "center" }}>
      <Typography
        variant="caption"
        sx={{
          color: "white",
          display: "block",
          lineHeight: 1.2,
          fontWeight: 500,
        }}
      >
        A Major Arcana card.
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
          fontWeight: "bold",
        }}
      >
        Learn more
      </Typography>
    </Box>
  );

  const card = (
    <Box
      sx={{
        display: "inline-block",
        lineHeight: 0,
        borderRadius: 1,
        position: "relative",
      }}
    >
      <CardBack sx={{ position: "absolute", top: 0, left: 0, zIndex: -1 }} />
      <CardBack
        sx={{
          position: "absolute",
          top: "4px",
          left: 0,
          zIndex: -2,
          transform: "rotate(-1.5deg)",
          boxShadow:
            "inset 0 0 0 4px, 0 0 0 1px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.5)",
        }}
      />
      <CardBack
        sx={{
          position: "absolute",
          top: "8px",
          left: 0,
          zIndex: -3,
          transform: "rotate(1deg)",
          boxShadow:
            "inset 0 0 0 4px, 0 0 0 1px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.45)",
        }}
      />
      <CardBack
        sx={{
          position: "absolute",
          top: "12px",
          left: 0,
          zIndex: -4,
          transform: "rotate(-0.5deg)",
          boxShadow:
            "inset 0 0 0 4px, 0 0 0 1px rgba(255,255,255,0.06), 0 8px 16px 4px rgba(0,0,0,0.6)",
        }}
      />
      <Box
        sx={{
          display: "inline-block",
          lineHeight: 0,
          borderRadius: 1,
          animation: isDiscarding
            ? `${arcanaThrowOff} 320ms ease-in both`
            : pendingArcanaCard
              ? `${arcanaFloatBob} 2.4s ease-in-out 500ms infinite`
              : undefined,
          boxShadow:
            pendingArcanaCard && !isDiscarding
              ? "0 0 12px 4px rgba(179, 57, 219, 0.55)"
              : undefined,
        }}
      >
        <PlayingCard
          key={`${arcanaCardToShow?.value ?? "none"}-${arcanaCardToShow?.suit ?? "none"}`}
          rank={arcanaCardToShow?.value}
          suit={arcanaCardToShow?.suit}
          flipped={!!arcanaCardToShow && !pendingArcanaCard}
        />
      </Box>
    </Box>
  );

  const cardContent = (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{
        gridArea: "1 / 1",
        opacity: 1,
        pointerEvents: "auto",
        transition: "opacity 400ms ease",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Box sx={{ display: "inline-block", scale: 0.7 }}>
        {showTooltip ? (
          <Tooltip
            placement="top"
            arrow
            enterDelay={750}
            disableInteractive={false}
            open={tooltipOpen}
            onOpen={() => setTooltipOpen(true)}
            onClose={() => setTooltipOpen(false)}
            title={tooltipTitle}
          >
            {card}
          </Tooltip>
        ) : (
          card
        )}
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
        zIndex: 0,
      }}
    >
      <Box
        style={{ viewTransitionName: "bg-top" }}
        sx={{
          display: "block",
          position: "absolute",
          width: "160%",
          maxWidth: "10em",
          aspectRatio: "69/57",
          backgroundImage: `url(${backgroundTableUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />
      <Box
        style={{ viewTransitionName: "bg-bottom" }}
        sx={{
          display: "block",
          position: "absolute",
          width: "160%",
          maxWidth: "10em",
          aspectRatio: "69/57",
          backgroundImage: `url(${backgroundTableUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%) rotate(180deg)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />
      {cardContent}
    </Box>
  );
}
