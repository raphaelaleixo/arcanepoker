/**
 * Renders the two hole cards for a player seat.
 * Handles the High Priestess reveal edge case (a single opponent card shown
 * face-up without revealing the rest) and card selection for
 * Chariot/Priestess interactions.
 *
 * When any arcana causes a hole card redraw, the old cards animate out (dealOut)
 * and the new cards deal in (dealIn) automatically via key-based remounting.
 */
import { useEffect, useRef, useState } from "react";
import { keyframes } from "@emotion/react";
import { Box, Stack } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { PlayingCard } from "../Card/PlayingCard";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard } from "../../types/types";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

const dealOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

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
  /** Incremented when this player's cards are replaced by the Magician redraw effect. */
  redrawSeed?: number;
  /** The player's ID — used for tutorial card spotlight. */
  playerId?: string;
  /** When true, applies a secondary-color glow behind the cards. */
  isActive?: boolean;
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
  redrawSeed = 0,
  playerId,
  isActive = false,
}: PlayerCardsProps) {
  const highlights = useTutorialOptional()?.highlightCards ?? null;
  const anyHighlighted =
    highlights != null &&
    highlights.some((h) => h.type === "hole" && h.playerId === playerId);
  // Local card buffer — holds old cards during the exit animation so they stay
  // visible while fading out before the new cards deal in.
  const [displayCards, setDisplayCards] = useState<StandardCard[]>(holeCards);
  const [isExiting, setIsExiting] = useState(false);
  // Incremented when new cards arrive after a redraw — forces DealtCard remount → dealIn fires.
  const [cardKey, setCardKey] = useState(0);

  const prevSeedRef = useRef(redrawSeed);
  const prevWheelRef = useRef(wheelRound);

  useEffect(() => {
    // New hand: wheelRound changed — animate cards out, then swap in new cards.
    if (wheelRound !== prevWheelRef.current) {
      setIsExiting(true);
      const t = setTimeout(() => {
        prevWheelRef.current = wheelRound;
        prevSeedRef.current = redrawSeed;
        setDisplayCards(holeCards);
        setCardKey((k) => k + 1);
        setIsExiting(false);
      }, 300);
      return () => clearTimeout(t);
    }

    // Magician redraw: seed increased within the same hand.
    if (redrawSeed > prevSeedRef.current) {
      setIsExiting(true);
      const t = setTimeout(() => {
        setDisplayCards(holeCards);
        setCardKey((k) => k + 1); // force DealtCard remount → dealIn
        setIsExiting(false);
        prevSeedRef.current = redrawSeed;
      }, 320);
      return () => clearTimeout(t);
    }

    // Normal state update (bet, fold, etc.) — sync immediately.
    setDisplayCards(holeCards);
    prevSeedRef.current = redrawSeed;
  }, [holeCards, redrawSeed, wheelRound]);

  return (
    <Box
      data-dealer-anchor={dealerAnchorId}
      sx={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        mb: 0.5,
        ...(anyHighlighted ? { zIndex: 1295 } : {}),
      }}
    >
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="flex-end"
        sx={{
          ...(isExiting
            ? {
                animation: `${dealOut} 280ms ease-in both`,
                pointerEvents: "none",
              }
            : {}),
          filter: (theme: Theme) =>
            isActive
              ? `drop-shadow(0 0 8px ${theme.palette.secondary.main}99)`
              : `drop-shadow(0 0 0px transparent)`,
          transition: "filter 400ms ease",
        }}
      >
        {displayCards.length > 0 ? (
          displayCards.map((card, i) => {
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
                  h.cardIndex === i,
              );
            return (
              <Box
                key={`${wheelRound}-${cardKey}-${i}`}
                onClick={onCardClick ? () => onCardClick(card) : undefined}
                sx={{
                  // transform: isSelected
                  //   ? i === 0
                  //     ? "rotate(-6deg) translateY(-10px)"
                  //     : "rotate(6deg) translateY(-10px)"
                  //   : i === 0
                  //     ? "rotate(-6deg)"
                  //     : "rotate(6deg)",
                  transformOrigin: "bottom center",
                  ml: i === 0 ? 0 : -0.75,
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
                  dealIndex={playerIndex * 2 + i}
                  revealDelay={
                    !isHero ? 200 + playerIndex * 300 + i * 100 : undefined
                  }
                />
              </Box>
            );
          })
        ) : (
          <>
            <Box
              sx={{
                transform: "rotate(-6deg)",
                transformOrigin: "bottom center",
              }}
            >
              <PlayingCard small />
            </Box>
            <Box
              sx={{
                transform: "rotate(6deg)",
                transformOrigin: "bottom center",
                ml: -0.5,
              }}
            >
              <PlayingCard small />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
