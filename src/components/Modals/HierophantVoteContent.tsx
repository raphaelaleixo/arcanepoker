/**
 * Dialog content for The Hierophant arcana interaction.
 * Three arcana cards are revealed; the hero votes on which one applies.
 * Bots have already voted. The card with the most votes wins; dealer breaks ties.
 */
import { Box, Button, Stack, Typography } from "@mui/material";
import type { ArcanaCard } from "../../types/types";
import tarot from "../../data/tarot";

interface HierophantVoteContentProps {
  options: [ArcanaCard, ArcanaCard, ArcanaCard];
  onVote: (choice: ArcanaCard["value"]) => void;
}

export function HierophantVoteContent({ options, onVote }: HierophantVoteContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body2" sx={{ color: "silver.light", textAlign: "center" }}>
        Three arcana have been revealed. Vote for the one that applies this round.
        The card with the most votes wins — the dealer breaks ties.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        {options.map((card) => {
          const data = (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[card.value];
          return (
            <Box
              key={card.value}
              sx={{
                border: "1px solid",
                borderColor: "gold.dark",
                borderRadius: 2,
                p: 2,
                maxWidth: 160,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": { borderColor: "gold.main", background: "rgba(255,215,0,0.05)" },
              }}
              onClick={() => onVote(card.value)}
            >
              <Typography variant="subtitle2" sx={{ color: "gold.main", fontWeight: "bold", mb: 0.5 }}>
                {data?.fullName ?? `Arcana ${card.value}`}
              </Typography>
              <Typography variant="caption" sx={{ color: "silver.light", display: "block", mb: 1.5 }}>
                {data?.gameEffect ?? ""}
              </Typography>
              <Button variant="outlined" size="small" sx={{ borderColor: "gold.dark", color: "gold.light" }}>
                Vote
              </Button>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
