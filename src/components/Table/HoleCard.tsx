/**
 * Renders a single hole card with rotation, selection highlight, priestess
 * reveal state, tutorial spotlight, and optional Page tooltip.
 */
import { Box, Tooltip } from "@mui/material";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard } from "../../types/types";
import type { CardHighlight } from "../../tutorial/tutorialScript";
import { CardTooltipTitle } from "./CardTooltipTitle";
import { useTranslation } from "../../i18n";

interface HoleCardProps {
  card: StandardCard;
  index: number;
  cardKey: number;
  showFaceUp: boolean;
  priestessCard: StandardCard | null;
  selectedCard?: StandardCard | null;
  onCardClick?: (card: StandardCard) => void;
  playerIndex: number;
  isHero: boolean;
  highlights: CardHighlight[] | null;
  playerId?: string;
  onOpenPageInfo?: () => void;
  openPageTooltip: string | null;
  onSetPageTooltip: (key: string | null) => void;
  displayCardsLength: number;
}

export function HoleCard({
  card,
  index,
  cardKey,
  showFaceUp,
  priestessCard,
  selectedCard,
  onCardClick,
  playerIndex,
  isHero,
  highlights,
  playerId,
  onOpenPageInfo,
  openPageTooltip,
  onSetPageTooltip,
  displayCardsLength,
}: HoleCardProps) {
  const { t } = useTranslation();
  const isPriestessRevealed =
    !showFaceUp &&
    priestessCard != null &&
    card.value === priestessCard.value &&
    card.suit === priestessCard.suit;
  const faceUp = showFaceUp || isPriestessRevealed;
  const isSelected =
    selectedCard != null &&
    card.value === selectedCard.value &&
    card.suit === selectedCard.suit;
  const isHighlighted =
    highlights != null &&
    highlights.some(
      (h) =>
        h.type === "hole" &&
        h.playerId === playerId &&
        h.cardIndex === index,
    );
  const isPageCard = card.value === "0";
  const showPageTooltip = isHero && faceUp && isPageCard && !!onOpenPageInfo;

  const center = (displayCardsLength - 1) / 2;
  const rotDeg = (index - center) * 6;
  const transform = isSelected
    ? `rotate(${rotDeg}deg) translateY(-8px)`
    : `rotate(${rotDeg}deg)`;

  const cardBox = (
    <Box
      key={`${cardKey}-${card.value}-${card.suit}`}
      onClick={onCardClick ? () => onCardClick(card) : undefined}
      sx={{
        transform,
        transformOrigin: "bottom center",
        ml: index === 0 ? 0 : -0.75,
        cursor: onCardClick ? "pointer" : "default",
        transition: "transform 0.15s ease",
        outline: isSelected ? "2px solid gold" : "none",
        borderRadius: 1,
        lineHeight: 0,
        ...(isHighlighted
          ? {
              position: "relative",
              zIndex: 1295,
              boxShadow: "0 0 18px 6px rgba(201,169,110,0.75)",
            }
          : {}),
      }}
    >
      <DealtCard
        small
        rank={faceUp ? card.value : undefined}
        suit={faceUp ? card.suit : undefined}
        flipped={faceUp}
        dealIndex={playerIndex * 2 + index}
        revealDelay={!isHero ? 200 + playerIndex * 300 + index * 100 : undefined}
      />
    </Box>
  );

  if (showPageTooltip) {
    const tooltipKey = `${cardKey}-${card.value}-${card.suit}`;
    return (
      <Tooltip
        key={tooltipKey}
        open={openPageTooltip === tooltipKey}
        onOpen={() => onSetPageTooltip(tooltipKey)}
        onClose={() => onSetPageTooltip(null)}
        title={
          <CardTooltipTitle
            label={t("tooltips.pageTooltip")}
            onLearnMore={() => onOpenPageInfo!()}
            onCloseTooltip={() => onSetPageTooltip(null)}
          />
        }
      >
        {cardBox}
      </Tooltip>
    );
  }

  return cardBox;
}
