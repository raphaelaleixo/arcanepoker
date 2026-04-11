/**
 * Shared wrapper for a single community card slot.
 * Renders the dashed-border placeholder, optional highlight glow,
 * Empress grow-in animation, and the DealtCard inside.
 */
import { Box, Tooltip } from "@mui/material";
import { keyframes } from "@mui/system";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard, StandardCardValue, ArcanaValue, Suit, ArcanaSuit } from "../../types/types";
import { CardTooltipTitle } from "./CardTooltipTitle";

const slotExpand = keyframes`
  from { width: 0; min-width: 0; opacity: 0; }
  to   { width: 2.5em; opacity: 1; }
`;

interface CommunitySlotProps {
  slotKey: string;
  card: StandardCard | undefined;
  /** Override rank/suit for the rendered card (e.g. Fool shows arcana face). */
  overrideRank?: StandardCardValue | ArcanaValue;
  overrideSuit?: Suit | ArcanaSuit;
  flipped: boolean;
  dealIndex: number;
  isHighlighted: boolean;
  /** Empress 6th slot grow-in animation. */
  empressGrowIn?: boolean;
  onOpenPageInfo?: () => void;
  openPageTooltipIndex: number | null;
  slotIndex: number;
  onSetPageTooltipIndex: (index: number | null) => void;
}

export function CommunitySlot({
  slotKey,
  card,
  overrideRank,
  overrideSuit,
  flipped,
  dealIndex,
  isHighlighted,
  empressGrowIn = false,
  onOpenPageInfo,
  openPageTooltipIndex,
  slotIndex,
  onSetPageTooltipIndex,
}: CommunitySlotProps) {
  const highlight = isHighlighted
    ? {
        zIndex: 1295,
        boxShadow: "0 0 18px 6px rgba(201,169,110,0.75)",
      }
    : {};

  const rank = overrideRank ?? card?.value;
  const suit = overrideSuit ?? card?.suit;
  const isPageCard = card?.value === "0" && flipped && !!onOpenPageInfo;

  const slot = (
    <Box
      key={slotKey}
      sx={{
        position: "relative",
        width: "2.5em",
        aspectRatio: "5/7",
        borderRadius: 1,
        border: "1px dashed rgba(255,255,255,0.2)",
        ...(empressGrowIn
          ? {
              overflow: "hidden",
              animation: `${slotExpand} 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
            }
          : {}),
        ...highlight,
      }}
    >
      {card && (
        <Box sx={{ position: "absolute", top: 0, left: 0, lineHeight: 0 }}>
          <DealtCard
            small
            rank={rank}
            suit={suit}
            flipped={flipped}
            dealIndex={dealIndex}
            revealDelay={dealIndex * 80 + 400}
          />
        </Box>
      )}
    </Box>
  );

  if (isPageCard) {
    return (
      <Tooltip
        key={slotKey}
        open={openPageTooltipIndex === slotIndex}
        onOpen={() => onSetPageTooltipIndex(slotIndex)}
        onClose={() => onSetPageTooltipIndex(null)}
        title={
          <CardTooltipTitle
            label="The Page (Ø) — lowest card"
            onLearnMore={onOpenPageInfo!}
            onCloseTooltip={() => onSetPageTooltipIndex(null)}
            learnMoreText="Learn more →"
          />
        }
      >
        {slot}
      </Tooltip>
    );
  }

  return slot;
}
