/**
 * Renders the two hole cards for a player seat.
 * Handles the High Priestess reveal edge case (a single opponent card shown
 * face-up without revealing the rest) and card selection for
 * Chariot/Priestess interactions.
 */
import { Box, Stack } from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard } from "../../types/types";

interface PlayerCardsProps {
  holeCards: StandardCard[];
  showFaceUp: boolean;
  /** Single card revealed face-up by the High Priestess arcana (opponent-only). */
  priestessCard: StandardCard | null;
  /** Called when the hero clicks a card during a Priestess or Chariot interaction. */
  onCardClick?: (card: StandardCard) => void;
  selectedCard?: StandardCard | null;
  /** Used to stagger deal animation timing across seats. */
  playerIndex: number;
  /** Incremented each hand — used as React key seed to replay deal animations. */
  wheelRound: number;
  /** The player's ID — attached as data-dealer-anchor so DealerChip can locate this element. */
  dealerAnchorId: string;
  /** Hero cards are revealed immediately (no animation delay). */
  isHero?: boolean;
}

export function PlayerCards({
  holeCards,
  showFaceUp,
  priestessCard,
  onCardClick,
  selectedCard,
  playerIndex,
  wheelRound,
  dealerAnchorId,
  isHero = false,
}: PlayerCardsProps) {
  return (
    <Box
      data-dealer-anchor={dealerAnchorId}
      sx={{ position: "relative", display: "flex", justifyContent: "center", mb: 0.5 }}
    >
      <Stack direction="row" justifyContent="center" alignItems="flex-end">
        {holeCards.length > 0 ? (
          holeCards.map((card, i) => {
            // Priestess reveal: isPriestessRevealed allows a single opponent card
            // to appear face-up without showFaceUp being true for the whole hand.
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
            return (
              <Box
                key={`${wheelRound}-${i}`}
                onClick={onCardClick ? () => onCardClick(card) : undefined}
                sx={{
                  transform: isSelected
                    ? (i === 0 ? "rotate(-6deg) translateY(-10px)" : "rotate(6deg) translateY(-10px)")
                    : (i === 0 ? "rotate(-6deg)" : "rotate(6deg)"),
                  transformOrigin: "bottom center",
                  ml: i === 0 ? 0 : -1.5,
                  cursor: onCardClick ? "pointer" : "default",
                  transition: "transform 0.15s ease",
                  outline: isSelected ? "2px solid gold" : "none",
                  borderRadius: 1,
                }}
              >
                <DealtCard
                  small
                  rank={faceUp ? card.value : undefined}
                  suit={faceUp ? card.suit : undefined}
                  flipped={faceUp}
                  dealIndex={playerIndex * 2 + i}
                  revealDelay={!isHero ? 200 + playerIndex * 300 + i * 100 : undefined}
                />
              </Box>
            );
          })
        ) : (
          <>
            <Box sx={{ transform: "rotate(-6deg)", transformOrigin: "bottom center" }}>
              <PlayingCard small />
            </Box>
            <Box sx={{ transform: "rotate(6deg)", transformOrigin: "bottom center", ml: -1.5 }}>
              <PlayingCard small />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
