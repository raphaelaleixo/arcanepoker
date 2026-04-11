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
import { DealerBadge } from "./DealerBadge";
import type { StandardCard } from "../../types/types";
import { useTutorialOptional } from "../../tutorial/TutorialContext";
import { useDealerBadge } from "./useDealerBadge";
import { HoleCard } from "./HoleCard";

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
  /** When true, shows the dealer badge on this seat. */
  isDealer?: boolean;
  /** Opens the Page card info modal when a Page (Ø) card is hovered. */
  onOpenPageInfo?: () => void;
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
  isDealer = false,
  onOpenPageInfo,
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
  // Tracks which Page card tooltip is open (by card key string) so we can close it programmatically.
  const [openPageTooltip, setOpenPageTooltip] = useState<string | null>(null);

  const prevSeedRef = useRef(redrawSeed);
  const prevWheelRef = useRef(wheelRound);

  const { showBadge, badgeExiting } = useDealerBadge(isDealer);

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

    // Mid-hand redraw (Star, Magician, Wheel): seed increased within the same hand.
    // Swap display cards immediately — card identity change in the key causes only
    // the replaced card to remount and deal in. No whole-stack fade needed.
    if (redrawSeed > prevSeedRef.current) {
      setDisplayCards(holeCards);
      prevSeedRef.current = redrawSeed;
      return;
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
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        {showBadge && <DealerBadge exiting={badgeExiting} />}
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
            displayCards.map((card, i) => (
              <HoleCard
                key={`${cardKey}-${card.value}-${card.suit}`}
                card={card}
                index={i}
                cardKey={cardKey}
                showFaceUp={showFaceUp}
                priestessCard={priestessCard}
                selectedCard={selectedCard}
                onCardClick={onCardClick}
                playerIndex={playerIndex}
                isHero={isHero}
                highlights={highlights}
                playerId={playerId}
                onOpenPageInfo={onOpenPageInfo}
                openPageTooltip={openPageTooltip}
                onSetPageTooltip={setOpenPageTooltip}
                displayCardsLength={displayCards.length}
              />
            ))
          ) : (
            <>
              <Box
                sx={{
                  transform: "rotate(-3deg)",
                  transformOrigin: "bottom center",
                  visibility: "hidden",
                }}
              >
                <PlayingCard small />
              </Box>
              <Box
                sx={{
                  transform: "rotate(3deg)",
                  transformOrigin: "bottom center",
                  ml: -0.75,
                  visibility: "hidden",
                }}
              >
                <PlayingCard small />
              </Box>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
