import { Box, Chip, Stack, Typography } from "@mui/material";
import type { SxProps } from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import { useGame } from "../../store/useGame";
import tarot from "../../data/tarot";

interface CommunityAreaProps {
  sx?: SxProps;
}

function stagePill(stage: string): string {
  switch (stage) {
    case "pre-flop":
      return "Pre-Flop";
    case "flop":
      return "Flop";
    case "turn":
      return "Turn";
    case "river":
      return "River";
    case "showdown":
      return "Showdown";
    default:
      return stage;
  }
}

function stageColor(
  stage: string
): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (stage) {
    case "pre-flop":
      return "info";
    case "flop":
      return "primary";
    case "turn":
      return "warning";
    case "river":
      return "secondary";
    case "showdown":
      return "success";
    default:
      return "default";
  }
}

export function CommunityArea({ sx }: CommunityAreaProps) {
  const { state } = useGame();

  const totalSlots =
    state.activeArcana?.effectKey === "empress-sixth-card" ? 6 : 5;

  const arcanaData =
    state.activeArcana != null
      ? (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[
          state.activeArcana.card.value
        ]
      : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.35)",
        minWidth: { xs: "100%", md: 320 },
        ...sx,
      }}
    >
      {/* Stage pill */}
      <Chip
        label={stagePill(state.stage)}
        color={stageColor(state.stage)}
        size="small"
        sx={{ fontWeight: "bold", letterSpacing: "0.05em" }}
      />

      {/* Community cards */}
      <Stack direction="row" spacing={0.75} alignItems="center">
        {Array.from({ length: totalSlots }).map((_, i) => {
          const card = state.communityCards[i];
          if (card) {
            return (
              <PlayingCard
                key={i}
                rank={card.value}
                suit={card.suit}
                flipped
              />
            );
          }
          return (
            <Box
              key={i}
              sx={{
                width: "3.5em",
                aspectRatio: "5/7",
                borderRadius: 1,
                border: "1px dashed rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.2)",
              }}
            />
          );
        })}
      </Stack>

      {/* Pot and bet */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography
          variant="body2"
          sx={{ color: "gold.main", fontWeight: "bold" }}
        >
          Pot: {state.potSize}
        </Typography>
        {state.currentBet > 0 && (
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Bet: {state.currentBet}
          </Typography>
        )}
      </Stack>

      {/* Active Arcana */}
      {state.activeArcana && arcanaData && (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "secondary.dark",
            borderRadius: 2,
            p: 1,
            maxWidth: 260,
            background: "rgba(108,52,131,0.2)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "secondary.main",
              fontWeight: "bold",
              fontSize: "0.75rem",
            }}
          >
            {arcanaData.fullName}
          </Typography>
          {arcanaData.gameEffect && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "silver.light",
                fontSize: "0.65rem",
                fontStyle: "italic",
                mt: 0.25,
              }}
            >
              {arcanaData.gameEffect}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
