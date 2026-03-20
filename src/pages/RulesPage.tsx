import type { ElementType } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const ARCANA: { name: string; effect: string }[] = [
  { name: "The Fool",          effect: "Acts as a wildcard; evaluator finds the best possible hand for each player." },
  { name: "The Magician",      effect: "Players guess a suit; a correct guess earns an extra hole card." },
  { name: "The High Priestess",effect: "All active players reveal one hole card face up." },
  { name: "The Empress",       effect: "A 6th community card is dealt after the River." },
  { name: "The Emperor",       effect: "All hands are treated as high-card hands. Players compare highest card, then next highest, and so on." },
  { name: "The Hierophant",    effect: "Reveal 3 upcoming Arcana; players still in the round vote on which applies. The dealer breaks ties. Discard the other two." },
  { name: "The Lovers",        effect: "The pot is split between the two best hands." },
  { name: "The Chariot",       effect: "Active players pass one hole card to the left." },
  { name: "Strength",          effect: "Card values are inverted — 2 is highest, Ace is lowest, Page stays 0." },
  { name: "The Hermit",        effect: "The board is ignored; hands are formed from hole cards only." },
  { name: "Wheel of Fortune",  effect: "All players' hole cards are shuffled together and redealt. Each player receives the same number of cards they had. Community cards remain unchanged." },
  { name: "Justice",           effect: "One random player still in the round reveals all cards in their hand. Those cards remain face up for the rest of the round." },
  { name: "The Hanged Man",    effect: "An all-in player receives a 3rd hole card." },
  { name: "Death",             effect: "The round ends immediately; hands are compared at the current stage." },
  { name: "Temperance",        effect: "River reveals 3 cards; each player chooses 1 to keep on the board." },
  { name: "The Devil",         effect: "Raises must be at least double the current total bet." },
  { name: "The Tower",         effect: "Half the pot (rounded up) is set aside as a ruins pot, awarded to the winner of the next round." },
  { name: "The Star",          effect: "Players may discard 1 hole card and draw a new one." },
  { name: "The Moon",          effect: "One random community card is turned face down and hidden until showdown, when it is revealed and used normally." },
  { name: "The Sun",           effect: "Round ends; pot is split equally among active players." },
  { name: "Judgement",         effect: "All folded players may re-enter at the start of the next betting phase by paying the current highest bet. They are dealt two new hole cards." },
  { name: "The World",         effect: "Announces the final hand of the entire game." },
];

export function RulesPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
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
            "&:hover": {
              borderColor: "gold.main",
              background: "rgba(255,215,0,0.05)",
            },
          }}
        >
          ← Back to Home
        </Button>

        <Typography
          variant="h3"
          sx={{
            color: "gold.main",
          }}
        >
          How to Play
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: "silver.light", opacity: 0.8 }}
        >
          Arcane Poker follows standard Texas Hold'Em rules with two additions:
          the Page card and the Major Arcana deck.
        </Typography>

        {/* Section 1: The Page Card */}
        <Stack spacing={1.5}>
          <Typography variant="h5" sx={{ color: "gold.light" }}>
            The Page Card (0)
          </Typography>
          <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            Each suit contains a <strong>Page</strong> card with a value of 0 —
            the lowest card in a standard comparison. However, in straights, the
            Page connects <em>before</em> the Ace:{" "}
            <strong>Page, A, 2, 3, 4</strong> is a valid straight.
          </Typography>
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            <strong>Board trigger:</strong> When a Page is revealed in the
            community cards, the top card of the Arcana modifier deck is drawn
            and its effect activates immediately. Only one Arcana card can be
            active per round — subsequent Pages on the board do not trigger new
            draws.
          </Typography>
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            <strong>Showdown bonus:</strong> If the winning player holds a Page
            in their hole cards, all other players (including folded ones) pay
            them 1 Big Blind.
          </Typography>
        </Stack>

        {/* Section 2: Hand Rankings */}
        <Stack spacing={1.5}>
          <Typography variant="h5" sx={{ color: "gold.light" }}>
            Hand Rankings
          </Typography>
          <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
          <Typography variant="body1" sx={{ color: "silver.light", opacity: 0.8 }}>
            Arcane Poker uses a modified ranking where a <strong>Straight beats a Flush</strong>.
            The odds change below reflects the shift in probability from standard poker.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, pl: 3, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: "silver.light", opacity: 0.4, minWidth: 160, flexShrink: 0 }}>Hand</Typography>
            <Typography variant="caption" sx={{ color: "silver.light", opacity: 0.4, minWidth: 80, flexShrink: 0 }}>Standard</Typography>
            <Typography variant="caption" sx={{ color: "silver.light", opacity: 0.4, minWidth: 80, flexShrink: 0 }}>Arcane</Typography>
            <Typography variant="caption" sx={{ color: "silver.light", opacity: 0.4 }}>Change</Typography>
          </Box>
          <Box
            component="ol"
            sx={{ m: 0, pl: 3, display: "flex", flexDirection: "column", gap: 0.5, "& li::marker": { fontFamily: "Rubik, sans-serif" } }}
          >
            {[
              { hand: "Straight Flush",  standard: "0.0015%", arcane: "0.0011%", note: "-25.16%" },
              { hand: "Four of a Kind",  standard: "0.0240%", arcane: "0.0190%", note: "-20.62%" },
              { hand: "Full House",      standard: "0.1440%", arcane: "0.1143%", note: "-20.62%" },
              { hand: "Straight",        standard: "0.3924%", arcane: "0.2937%", note: "-25.16%" },
              { hand: "Flush",           standard: "0.1965%", arcane: "0.2084%", note: "+6.08%"  },
              { hand: "Three of a Kind", standard: "2.1128%", arcane: "1.8296%", note: "-13.41%" },
              { hand: "Two Pair",        standard: "4.7539%", arcane: "4.1166%", note: "-13.41%" },
              { hand: "One Pair",        standard: "42.2569%",arcane: "40.2515%",note: "-4.75%"  },
              { hand: "High Card",       standard: "50.1177%",arcane: "53.1653%",note: "+6.08%"  },
            ].map(({ hand, standard, arcane, note }) => (
              <Box component="li" key={hand} sx={{ color: "silver.light", fontSize: "0.875rem" }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography variant="body2" sx={{ color: "silver.light", minWidth: 160, flexShrink: 0 }}>
                    {hand}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "silver.light", opacity: 0.5, minWidth: 80, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {standard}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "silver.light", opacity: 0.7, minWidth: 80, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {arcane}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: note.startsWith("+") ? "success.main" : "error.main",
                      fontVariantNumeric: "tabular-nums",
                      opacity: 0.8,
                    }}
                  >
                    {note}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Stack>

        {/* Section 3: The Major Arcana Deck */}
        <Stack spacing={1.5}>
          <Typography variant="h5" sx={{ color: "gold.light" }}>
            The Major Arcana Deck
          </Typography>
          <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            A separate 22-card deck runs alongside the playing deck.{" "}
            <strong>Setup:</strong> The World (21) is set aside, the remaining
            21 cards are split in half, The World is shuffled into the second
            half, and the first half is placed on top — ensuring The World only
            appears late in the game.
          </Typography>
          <Typography variant="body1" sx={{ color: "silver.light" }}>
            A card is drawn only when a Page appears on the board. Its effect
            modifies the rules for the rest of that round.
          </Typography>

          <Box
            component="ol"
            start={0}
            sx={{ m: 0, pl: 3, display: "flex", flexDirection: "column", gap: 0.5, "& li::marker": { fontFamily: "Rubik, sans-serif" } }}
          >
            {ARCANA.map(({ name, effect }) => (
              <Box component="li" key={name} sx={{ color: "silver.light", fontSize: "0.875rem" }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography variant="body2" sx={{ color: "silver.light", minWidth: 200, flexShrink: 0 }}>
                    {name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "silver.light", opacity: 0.8 }}>
                    {effect}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
