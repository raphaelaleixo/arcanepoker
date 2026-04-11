import { Box, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import type {
  StandardCardValue,
  ArcanaValue,
  Suit,
  ArcanaSuit,
} from "../../types/types";

export interface CardEntryInfo {
  fullName: string;
  tags: string[];
  description: string;
  gameEffect?: string;
}

interface CardEntryProps {
  card: { value: string; suit: string };
  info: CardEntryInfo;
  showGameEffect?: boolean;
  /** Extra element rendered beside the title (e.g. Active chip). */
  titleAdornment?: React.ReactNode;
  /** Override wrapping Stack sx (e.g. padding for active highlight). */
  sx?: SxProps<Theme>;
}

export function CardEntry({
  card,
  info,
  showGameEffect,
  titleAdornment,
  sx,
}: CardEntryProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={sx}>
      <Box sx={{ display: "inline-block", scale: 0.7, flexShrink: 0 }}>
        <PlayingCard
          rank={card.value as StandardCardValue | ArcanaValue}
          suit={card.suit as Suit | ArcanaSuit}
          flipped
        />
      </Box>
      <Stack spacing={0}>
        {titleAdornment ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography variant="cardTitle" sx={{ color: "gold.main" }}>
              {info.fullName}
            </Typography>
            {titleAdornment}
          </Box>
        ) : (
          <Typography variant="cardTitle" sx={{ color: "gold.main" }}>
            {info.fullName}
          </Typography>
        )}
        <Typography component="div" variant="cardTags" sx={{ my: 0.5, color: "silver.main" }}>
          {info.tags.join(" · ")}
        </Typography>
        <Typography variant="cardDesc" sx={{ color: "white" }}>
          {info.description}
        </Typography>
        {showGameEffect && info.gameEffect && (
          <Typography variant="cardEffect" sx={{ mt: 0.5, color: "gold.light" }}>
            {info.gameEffect}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
