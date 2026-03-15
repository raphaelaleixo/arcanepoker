import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import type { SxProps } from "@mui/material";
import { keyframes } from "@emotion/react";
import { PlayingCard } from "../Card/PlayingCard";
import { DealtCard } from "../Card/DealtCard";
import { useGame } from "../../store/useGame";
import tarot from "../../data/tarot";
import type { ArcanaCard } from "../../types/types";

const arcanaRiseIn = keyframes`
  from { opacity: 0; transform: translateY(30px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const arcanaFloatBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-5px); }
`;

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
  const { state } = useGame();


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

  // Pre-fetch from pending card so the description box has stable dimensions before reveal
  const displayArcanaData =
    arcanaData ??
    (pendingArcanaCard
      ? (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[
          pendingArcanaCard.value
        ]
      : null);

  const arcanaCardToShow = pendingArcanaCard ?? state.activeArcana?.card ?? null;

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
            const di = i < 3 ? i : 0;
            if (i === state.foolCardIndex) {
              return (
                <DealtCard
                  key={i}
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
                key={i}
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

      {/* Unified arcana area — always rendered to reserve space, fades in when active */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          opacity: arcanaCardToShow ? 1 : 0,
          pointerEvents: arcanaCardToShow ? "auto" : "none",
          transition: "opacity 400ms ease",
        }}
      >
          {/* Card: single instance — flipped changes false→true, PlayingCard's CSS transition animates the flip */}
          <Box sx={{ display: "inline-block", animation: pendingArcanaCard ? `${arcanaRiseIn} 500ms ease-out both` : undefined }}>
            <Box
              sx={{
                display: "inline-block",
                borderRadius: 1,
                animation: pendingArcanaCard ? `${arcanaFloatBob} 2.4s ease-in-out 500ms infinite` : undefined,
                boxShadow: pendingArcanaCard ? "0 0 12px 4px rgba(179, 57, 219, 0.55)" : undefined,
              }}
            >
              <PlayingCard
                small
                rank={arcanaCardToShow?.value}
                suit={arcanaCardToShow?.suit}
                flipped={!!arcanaCardToShow && !pendingArcanaCard}
              />
            </Box>
          </Box>

          {/* Description box: fixed size, CSS grid stack inside so height never changes */}
          <Box
            sx={{
              border: "1px solid",
              borderColor: "secondary.dark",
              borderRadius: 2,
              p: 1,
              maxWidth: 180,
              minWidth: 120,
              background: "rgba(108,52,131,0.2)",
              textAlign: "center",
            }}
          >
            <Box sx={{ display: "grid" }}>
              {/* "An arcana stirs..." — visible when pending */}
              <Box
                sx={{
                  gridArea: "1 / 1",
                  opacity: pendingArcanaCard ? 1 : 0,
                  pointerEvents: pendingArcanaCard ? "auto" : "none",
                  transition: "opacity 300ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "secondary.light", fontStyle: "italic" }}
                >
                  An arcana stirs...
                </Typography>
              </Box>

              {/* Arcana name + effect — visible when revealed */}
              <Box
                sx={{
                  gridArea: "1 / 1",
                  opacity: pendingArcanaCard ? 0 : 1,
                  pointerEvents: pendingArcanaCard ? "none" : "auto",
                  transition: "opacity 300ms ease",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "secondary.main", fontWeight: "bold", fontSize: "0.75rem" }}
                >
                  {displayArcanaData?.fullName}
                </Typography>
                {displayArcanaData?.gameEffect && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", color: "silver.light", fontSize: "0.65rem", fontStyle: "italic", mt: 0.25 }}
                  >
                    {displayArcanaData.gameEffect}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
