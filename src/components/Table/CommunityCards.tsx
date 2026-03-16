/**
 * Renders the row of community cards on the poker table.
 * Handles the Fool substitution (a community card secretly replaced by the
 * Fool arcana) and the Empress sixth-card slot.
 */
import { Box, Stack } from "@mui/material";
import { DealtCard } from "../Card/DealtCard";
import type { StandardCard, ArcanaCard } from "../../types/types";

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
  /** React key seed — incremented each hand to replay deal animations. */
  wheelRound: number;
}

export function CommunityCards({
  communityCards,
  totalSlots,
  foolCardIndex,
  wheelRound,
}: CommunityCardsProps) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {Array.from({ length: totalSlots }).map((_, i) => {
        const card = communityCards[i];
        if (card) {
          const di = i < 3 ? i : 0;
          // Fool substitution: render this slot as The Fool arcana face
          // rather than the card's true value.
          if (i === foolCardIndex) {
            return (
              <DealtCard
                key={`${wheelRound}-${i}`}
                small
                rank={"0" as ArcanaCard["value"]}
                suit={"arcana"}
                flipped
                dealIndex={di}
                revealDelay={di * 80 + 400}
              />
            );
          }
          return (
            <DealtCard
              key={`${wheelRound}-${i}`}
              small
              rank={card.value}
              suit={card.suit}
              flipped
              dealIndex={di}
              revealDelay={di * 80 + 400}
            />
          );
        }
        return (
          <Box
            key={i}
            sx={{
              width: "3em",
              aspectRatio: "5/7",
              borderRadius: 1,
              border: "1px dashed rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
            }}
          />
        );
      })}
    </Stack>
  );
}
