/**
 * Dialog content for The Magician arcana interaction.
 * The hero guesses the suit of the top card of the deck.
 * A correct guess grants that card as an extra hole card.
 */
import { Button, Stack, Typography } from "@mui/material";

const SUIT_BUTTONS: { suit: string; label: string }[] = [
  { suit: "hearts",   label: "\u2665 Hearts" },
  { suit: "clubs",    label: "\u2663 Clubs" },
  { suit: "diamonds", label: "\u2666 Diamonds" },
  { suit: "spades",   label: "\u2660 Spades" },
];

interface MagicianGuessContentProps {
  onGuess: (suit: string) => void;
}

export function MagicianGuessContent({ onGuess }: MagicianGuessContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body2" sx={{ color: "silver.light", textAlign: "center" }}>
        Guess the suit of the top card. If correct, you keep it as an extra hole card.
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
        {SUIT_BUTTONS.map(({ suit, label }) => (
          <Button
            key={suit}
            variant="outlined"
            onClick={() => onGuess(suit)}
            sx={{
              color: suit === "hearts" || suit === "diamonds" ? "redSuit.main" : "silver.light",
              borderColor:
                suit === "hearts" || suit === "diamonds" ? "redSuit.main" : "silver.dark",
              "&:hover": { borderColor: "gold.main", color: "gold.main" },
            }}
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
