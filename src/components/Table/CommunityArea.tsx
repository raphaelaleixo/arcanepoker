import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import type { SxProps } from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import { useGame } from "../../store/useGame";
import tarot from "../../data/tarot";
import type { ArcanaCard, StandardCard } from "../../types/types";

function formatHandRank(rank: string): string {
  return rank
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
  const { state, dispatch } = useGame();

  const temperancePending = state.pendingInteraction?.type === "temperance-pick";
  const temperanceCandidates = state.temperanceCandidates;
  // The hero's chosen river card (set after pick, stays for showdown)
  const heroTemperanceChoice = state.temperanceChoices[
    state.players.find((p) => p.type === "human")?.id ?? ""
  ] ?? null;

  function handleTemperancePick(card: StandardCard) {
    dispatch({ type: "RESOLVE_TEMPERANCE", payload: { card } });
  }

  const totalSlots =
    state.activeArcana?.effectKey === "empress-sixth-card" ? 6 : 5;

  const pendingArcanaCard =
    state.pendingInteraction?.type === "arcana-reveal"
      ? (state.pendingInteraction as { type: "arcana-reveal"; arcanaCard: ArcanaCard }).arcanaCard
      : null;

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
            if (i === state.foolCardIndex) {
              return (
                <PlayingCard
                  key={i}
                  small
                  rank={"0" as ArcanaCard["value"]}
                  suit={"arcana"}
                  flipped
                />
              );
            }
            return (
              <PlayingCard
                key={i}
                small
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

      {/* Temperance: three river candidates — visible from pick through showdown */}
      {temperanceCandidates && (
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "secondary.light",
              fontStyle: "italic",
              mb: 0.75,
              letterSpacing: "0.04em",
            }}
          >
            {temperancePending
              ? "Temperance — Choose your river card"
              : "Temperance — River options"}
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            {temperanceCandidates.map((card, i) => {
              const isChosen =
                heroTemperanceChoice !== null &&
                card.value === heroTemperanceChoice.value &&
                card.suit === heroTemperanceChoice.suit;
              const isPickable = temperancePending;
              return (
                <Box
                  key={i}
                  onClick={isPickable ? () => handleTemperancePick(card) : undefined}
                  sx={{
                    cursor: isPickable ? "pointer" : "default",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    borderRadius: 1,
                    boxShadow: isChosen
                      ? "0 0 14px rgba(155,89,182,0.8)"
                      : "none",
                    opacity: !temperancePending && !isChosen ? 0.45 : 1,
                    ...(isPickable && {
                      "&:hover": {
                        transform: "translateY(-6px)",
                        boxShadow: "0 0 12px rgba(155,89,182,0.6)",
                      },
                    }),
                  }}
                >
                  <PlayingCard small rank={card.value} suit={card.suit} flipped />
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

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

      {/* Showdown results */}
      {state.stage === "showdown" && state.pendingInteraction === null && (
        <Box sx={{ width: "100%", mt: 1 }}>
          <Divider sx={{ borderColor: "rgba(255,215,0,0.2)", mb: 1.5 }} />
          {/* Winner headline */}
          <Box sx={{ textAlign: "center", mb: 1 }}>
            {state.winnerIds.length > 1 ? (
              <Typography
                variant="body1"
                sx={{ color: "gold.main", fontWeight: "bold" }}
              >
                Split Pot
              </Typography>
            ) : state.winnerIds.length === 1 ? (
              <Box>
                <Typography
                  variant="body1"
                  sx={{ color: "gold.main", fontWeight: "bold" }}
                >
                  {state.players.find((p) => p.id === state.winnerIds[0])?.name} Wins!
                </Typography>
                {state.handResults.find((r) => r.playerId === state.winnerIds[0]) && (
                  <Typography
                    variant="caption"
                    sx={{ color: "silver.light", fontStyle: "italic" }}
                  >
                    {formatHandRank(
                      state.handResults.find((r) => r.playerId === state.winnerIds[0])!.rankName
                    )}
                  </Typography>
                )}
              </Box>
            ) : null}
          </Box>
          {/* Per-player results */}
          <Stack spacing={0.5}>
            {state.players
              .filter((p) => !p.folded)
              .map((player) => {
                const result = state.handResults.find((r) => r.playerId === player.id);
                const isWinner = state.winnerIds.includes(player.id);
                return (
                  <Box
                    key={player.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: isWinner ? "gold.dark" : "rgba(255,255,255,0.08)",
                      background: isWinner ? "rgba(255,215,0,0.08)" : "rgba(0,0,0,0.2)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: isWinner ? "gold.main" : "silver.light", fontWeight: isWinner ? "bold" : "normal" }}
                    >
                      {player.name}{isWinner && " ★"}
                    </Typography>
                    {result && (
                      <Typography
                        variant="caption"
                        sx={{ color: isWinner ? "gold.light" : "rgba(255,255,255,0.5)", fontStyle: "italic" }}
                      >
                        {formatHandRank(result.rankName)}
                      </Typography>
                    )}
                  </Box>
                );
              })}
          </Stack>
        </Box>
      )}

      {/* Challenge of the Page */}
      {state.pendingInteraction?.type === "page-challenge" && (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "gold.dark",
            borderRadius: 2,
            p: 1,
            maxWidth: 260,
            background: "rgba(123,63,0,0.25)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ display: "block", color: "gold.main", fontWeight: "bold", fontSize: "0.75rem" }}
          >
            Challenge of the Page
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", color: "silver.light", fontSize: "0.65rem", fontStyle: "italic", mt: 0.25 }}
          >
            The winner holds a Page — all others pay {state.bigBlind} chips.
          </Typography>
        </Box>
      )}

      {/* Arcana pending reveal — face-down card */}
      {pendingArcanaCard && (
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="caption"
            sx={{ display: "block", color: "secondary.light", fontStyle: "italic", mb: 0.75 }}
          >
            An arcana stirs...
          </Typography>
          <PlayingCard
            small
            rank={pendingArcanaCard.value}
            suit={pendingArcanaCard.suit}
            flipped={false}
          />
        </Box>
      )}

      {/* Active Arcana — face-up card + chip */}
      {state.activeArcana && arcanaData && (
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <PlayingCard
            small
            rank={state.activeArcana.card.value}
            suit={state.activeArcana.card.suit}
            flipped
          />
          <Box
            sx={{
              border: "1px solid",
              borderColor: "secondary.dark",
              borderRadius: 2,
              p: 1,
              maxWidth: 180,
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
        </Stack>
      )}
    </Box>
  );
}
