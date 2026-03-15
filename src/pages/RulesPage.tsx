import type { ElementType } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const ARCANA: { name: string; effect: string }[] = [
  { name: "0 – The Fool", effect: "Acts as a wildcard; evaluator finds the best possible hand for each player." },
  { name: "1 – The Magician", effect: "Players guess a suit; a correct guess earns an extra hole card." },
  { name: "2 – The High Priestess", effect: "All active players reveal one hole card face up." },
  { name: "3 – The Empress", effect: "A 6th community card is dealt after the River." },
  { name: "4 – The Emperor", effect: "In tie-breakers, only J, Q, K, and Page count as kickers." },
  { name: "5 – The Hierophant", effect: "Effect persists into subsequent hands until a new Arcana is drawn." },
  { name: "6 – The Lovers", effect: "The pot is split between the two best hands." },
  { name: "7 – The Chariot", effect: "Active players pass one hole card to the left." },
  { name: "8 – Strength", effect: "Card values are inverted — 2 is highest, Ace is lowest, Page stays 0." },
  { name: "9 – The Hermit", effect: "The board is ignored; hands are formed from hole cards only." },
  { name: "10 – Wheel of Fortune", effect: "Complete redeal, keeping the current betting round structure." },
  { name: "11 – Justice", effect: "Players may bet less than the call amount; excess is returned." },
  { name: "12 – The Hanged Man", effect: "An all-in player receives a 3rd hole card." },
  { name: "13 – Death", effect: "The round ends immediately; hands are compared at the current stage." },
  { name: "14 – Temperance", effect: "River reveals 3 cards; each player chooses 1 to keep on the board." },
  { name: "15 – The Devil", effect: "Raises must be at least double the current total bet." },
  { name: "16 – The Tower", effect: "Half the pot (rounded up) is destroyed and removed from play." },
  { name: "17 – The Star", effect: "Players may discard 1 hole card and draw a new one." },
  { name: "18 – The Moon", effect: "Players receive a 3rd hole card face down; may swap it at showdown." },
  { name: "19 – The Sun", effect: "Round ends; pot is split equally among active players." },
  { name: "20 – Judgement", effect: "Folded players may pay 1 BB to return with 2 new hole cards." },
  { name: "21 – The World", effect: "Announces the final hand of the entire game." },
];

export function RulesPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at center, #0F3D20 0%, #0A2F1A 70%, #061a0f 100%)",
        p: { xs: 2, sm: 4 },
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={4} maxWidth={720} mx="auto">
        <Button
          component={Link as ElementType}
          to="/"
          variant="outlined"
          size="small"
          sx={{
            alignSelf: "flex-start",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": { borderColor: "gold.main", background: "rgba(255,215,0,0.05)" },
          }}
        >
          ← Back to Home
        </Button>

        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: "gold.main",
            textShadow: "0 0 20px rgba(255,215,0,0.4)",
          }}
        >
          How to Play
        </Typography>

        <Typography variant="body1" sx={{ color: "silver.light", opacity: 0.8 }}>
          Arcane Poker follows standard Texas Hold'Em rules with two additions: the Page card and the Major Arcana deck.
        </Typography>

        {/* Section 1: The Page Card */}
        <Stack spacing={1.5}>
          <Typography
            variant="h5"
            sx={{ color: "gold.light", fontFamily: '"Georgia", serif' }}
          >
            The Page Card (0)
          </Typography>
          <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            Each suit contains a <strong>Page</strong> card with a value of 0 — the lowest card in a standard
            comparison. However, in straights, the Page connects <em>before</em> the Ace:{" "}
            <strong>Page, A, 2, 3, 4</strong> is a valid straight.
          </Typography>
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            <strong>Board trigger:</strong> When a Page is revealed in the community cards, the top card of the
            Arcana modifier deck is drawn and its effect activates immediately. Only one Arcana card can be active per
            round — subsequent Pages on the board do not trigger new draws.
          </Typography>
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            <strong>Showdown bonus:</strong> If the winning player holds a Page in their hole cards, all other players
            (including folded ones) pay them 1 Big Blind.
          </Typography>
        </Stack>

        {/* Section 2: The Major Arcana Deck */}
        <Stack spacing={1.5}>
          <Typography
            variant="h5"
            sx={{ color: "gold.light", fontFamily: '"Georgia", serif' }}
          >
            The Major Arcana Deck
          </Typography>
          <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            A separate 22-card deck runs alongside the playing deck. <strong>Setup:</strong> The World (21) is set
            aside, the remaining 21 cards are split in half, The World is shuffled into the second half, and the first
            half is placed on top — ensuring The World only appears late in the game.
          </Typography>
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            A card is drawn only when a Page appears on the board. Its effect modifies the rules for the rest of that
            round.
          </Typography>

          <Stack spacing={1} pt={1}>
            {ARCANA.map(({ name, effect }) => (
              <Stack key={name} direction="row" spacing={1.5} alignItems="flex-start">
                <Typography
                  variant="body2"
                  sx={{ color: "gold.light", minWidth: 200, fontWeight: 600, flexShrink: 0 }}
                >
                  {name}
                </Typography>
                <Typography variant="body2" sx={{ color: "silver.light", opacity: 0.85 }}>
                  {effect}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
