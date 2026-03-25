/**
 * Renders the row of community cards on the poker table.
 * Handles the Fool substitution (a community card secretly replaced by the
 * Fool arcana) and the Empress sixth-card slot.
 */
import { Box, Stack } from "@mui/material";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard, ArcanaCard } from "../../types/types";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

interface CommunityCardsProps {
  communityCards: StandardCard[];
  /**
   * 5 normally; 6 when the Empress arcana (effectKey "empress-sixth-card") is active.
   * The 6th slot renders as an empty placeholder until the card is dealt.
   */
  totalSlots: number;
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
  foolCardIndex,
  moonHiddenCommunityIndex,
  moonAffectedIndex,
  wheelRound,
  communityChangeKey,
}: CommunityCardsProps) {
  const highlights = useTutorialOptional()?.highlightCards ?? null;

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {Array.from({ length: totalSlots }).map((_, i) => {
        const card = communityCards[i];
        const isHighlighted =
          highlights != null &&
          highlights.some(
            (h) => h.type === "community" && h.communityIndex === i,
          );
        if (card) {
          // Turn/river cards are dealt individually, so each resets stagger to 0.
          const di = i < 3 ? i : 0;
          // Fool substitution: render this slot as The Fool arcana face
          // rather than the card's true value.
          if (i === foolCardIndex) {
            return (
              <Box
                key={`${wheelRound}-fool-${communityChangeKey}-${i}`}
                sx={{
                  lineHeight: 0,
                  ...(isHighlighted
                    ? {
                        position: "relative",
                        zIndex: 1295,
                        borderRadius: 1,
                        boxShadow: "0 0 18px 6px rgba(201,169,110,0.75)",
                      }
                    : {}),
                }}
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
            );
          }
          // Moon: use a stable key (moonAffectedIndex persists through showdown so the
          // key doesn't change on reveal, avoiding a second remount animation).
          if (i === moonAffectedIndex) {
            return (
              <Box
                key={`${wheelRound}-moon-${communityChangeKey}-${i}`}
                sx={{
                  lineHeight: 0,
                  ...(isHighlighted
                    ? {
                        position: "relative",
                        zIndex: 1295,
                        borderRadius: 1,
                        boxShadow: "0 0 18px 6px rgba(201,169,110,0.75)",
                      }
                    : {}),
                }}
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
            );
          }
          return (
            <Box
              key={`${wheelRound}-${i}`}
              sx={{
                lineHeight: 0,
                ...(isHighlighted
                  ? {
                      position: "relative",
                      zIndex: 1295,
                      borderRadius: 1,
                      boxShadow: "0 0 18px 6px rgba(201,169,110,0.75)",
                    }
                  : {}),
              }}
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
          );
        }
        return (
          <Box
            key={i}
            sx={{
              width: "2.5em",
              aspectRatio: "5/7",
              borderRadius: 1,

              ...(isHighlighted
                ? {
                    position: "relative",
                    zIndex: 1295,
                    boxShadow: "0 0 18px 6px rgba(201,169,110,0.75)",
                  }
                : {}),
            }}
          />
        );
      })}
    </Stack>
  );
}
