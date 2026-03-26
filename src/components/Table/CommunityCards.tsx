/**
 * Renders the row of community cards on the poker table.
 * Handles the Fool substitution (a community card secretly replaced by the
 * Fool arcana) and the Empress sixth-card slot.
 */
import { useEffect, useRef, useState } from "react";
import { Box, Stack } from "@mui/material";
import { keyframes } from "@mui/system";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard, ArcanaCard } from "../../types/types";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

const dealOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const slotExpand = keyframes`
  from { width: 0; min-width: 0; opacity: 0; }
  to   { width: 2.5em; opacity: 1; }
`;

interface CommunityCardsProps {
  communityCards: StandardCard[];
  /**
   * 5 normally; 6 when the Empress arcana (effectKey "empress-sixth-card") is active.
   * The 6th slot renders as an empty placeholder until the card is dealt.
   */
  totalSlots: number;
  /** True when the Empress arcana (empress-sixth-card) is active — triggers grow-in animation on the 6th slot. */
  empressActive: boolean;
  /**
   * Index of the community card secretly replaced by the Fool arcana.
   * That position renders as a Major Arcana face instead of the card's true value.
   * Null when no Fool substitution is active.
   */
  foolCardIndex: number | null;
  /**
   * Index of the community card hidden face-down by the Moon arcana.
   * Null when no card is hidden.
   */
  moonHiddenCommunityIndex: number | null;
  /**
   * Same slot as moonHiddenCommunityIndex but persists through showdown so the
   * React key stays stable when the card flips face-up, preventing a second animation.
   */
  moonAffectedIndex: number | null;
  /** React key seed — incremented each hand to replay deal animations. */
  wheelRound: number;
  /** Incremented when any community card changes mid-hand (Fool, Moon); triggers remount → dealIn animation. */
  communityChangeKey: number;
}

export function CommunityCards({
  communityCards,
  totalSlots,
  empressActive,
  foolCardIndex,
  moonHiddenCommunityIndex,
  moonAffectedIndex,
  wheelRound,
  communityChangeKey,
}: CommunityCardsProps) {
  const highlights = useTutorialOptional()?.highlightCards ?? null;

  const [displayCommunityCards, setDisplayCommunityCards] = useState(communityCards);
  const [renderedRound, setRenderedRound] = useState(wheelRound);
  const [isExiting, setIsExiting] = useState(false);
  const prevRoundRef = useRef(wheelRound);

  useEffect(() => {
    if (wheelRound !== prevRoundRef.current) {
      // Round reset: animate out the old cards (still in displayCommunityCards),
      // then swap in the new state.
      setIsExiting(true);
      const t = setTimeout(() => {
        prevRoundRef.current = wheelRound;
        setRenderedRound(wheelRound);
        setDisplayCommunityCards(communityCards);
        setIsExiting(false);
      }, 300);
      return () => clearTimeout(t);
    }
    // Mid-hand update (new card dealt) — sync immediately.
    setDisplayCommunityCards(communityCards);
  }, [communityCards, wheelRound]);

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      useFlexGap
      sx={
        isExiting
          ? { animation: `${dealOut} 280ms ease-in both`, pointerEvents: "none" }
          : undefined
      }
    >
      {Array.from({ length: totalSlots }).map((_, i) => {
        const card = displayCommunityCards[i];
        const isHighlighted =
          highlights != null &&
          highlights.some(
            (h) => h.type === "community" && h.communityIndex === i,
          );

        const highlight = isHighlighted
          ? {
              zIndex: 1295,
              boxShadow: "0 0 18px 6px rgba(201,169,110,0.75)",
            }
          : {};

        // Turn/river cards are dealt individually, so each resets stagger to 0.
        const di = card && i < 3 ? i : 0;

        // Fool substitution: render this slot as The Fool arcana face
        // rather than the card's true value.
        if (i === foolCardIndex) {
          return (
            <Box
              key={`${renderedRound}-fool-${communityChangeKey}-${i}`}
              sx={{
                position: "relative",
                width: "2.5em",
                aspectRatio: "5/7",
                borderRadius: 1,
                border: "1px dashed rgba(255,255,255,0.2)",
                ...highlight,
              }}
            >
              {card && (
                <Box
                  sx={{ position: "absolute", top: 0, left: 0, lineHeight: 0 }}
                >
                  <DealtCard
                    small
                    rank={"0" as ArcanaCard["value"]}
                    suit={"arcana"}
                    flipped
                    dealIndex={di}
                    revealDelay={di * 80 + 400}
                  />
                </Box>
              )}
            </Box>
          );
        }

        // Moon: use a stable key (moonAffectedIndex persists through showdown so the
        // key doesn't change on reveal, avoiding a second remount animation).
        if (i === moonAffectedIndex) {
          return (
            <Box
              key={`${renderedRound}-moon-${communityChangeKey}-${i}`}
              sx={{
                position: "relative",
                width: "2.5em",
                aspectRatio: "5/7",
                borderRadius: 1,
                border: "1px dashed rgba(255,255,255,0.2)",
                ...highlight,
              }}
            >
              {card && (
                <Box
                  sx={{ position: "absolute", top: 0, left: 0, lineHeight: 0 }}
                >
                  <DealtCard
                    small
                    rank={card.value}
                    suit={card.suit}
                    flipped={i !== moonHiddenCommunityIndex}
                    dealIndex={di}
                    revealDelay={di * 80 + 400}
                  />
                </Box>
              )}
            </Box>
          );
        }

        const isEmpressSlot = empressActive && i === 5;

        return (
          <Box
            key={card ? `${renderedRound}-${i}` : i}
            sx={{
              position: "relative",
              width: "2.5em",
              aspectRatio: "5/7",
              borderRadius: 1,
              border: "1px dashed rgba(255,255,255,0.2)",
              ...(isEmpressSlot && !card
                ? {
                    overflow: "hidden",
                    animation: `${slotExpand} 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                  }
                : {}),
              ...highlight,
            }}
          >
            {card && (
              <Box
                sx={{ position: "absolute", top: 0, left: 0, lineHeight: 0 }}
              >
                <DealtCard
                  small
                  rank={card.value}
                  suit={card.suit}
                  flipped
                  dealIndex={di}
                  revealDelay={di * 80 + 400}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
