/**
 * Dialog content for The Star arcana interaction.
 * The hero picks which hole card to discard and redraw, or keeps both.
 */
import { Button, Stack, Typography } from "@mui/material";
import type { StandardCard } from "../../types/types";

interface StarDiscardContentProps {
  holeCards: StandardCard[];
  onDiscard: (card: StandardCard) => void;
  onKeep: () => void;
}

export function StarDiscardContent({ holeCards, onDiscard, onKeep }: StarDiscardContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Choose a card to discard and redraw, or keep both.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        {holeCards.map((card, i) => (
          <Button
            key={i}
            variant="contained"
            color="warning"
            onClick={() => onDiscard(card)}
          >
            Discard {card.value} of {card.suit}
          </Button>
        ))}
        <Button
          variant="outlined"
          onClick={onKeep}
          sx={{ color: "silver.light", borderColor: "silver.dark" }}
        >
          Keep Both
        </Button>
      </Stack>
    </Stack>
  );
}
