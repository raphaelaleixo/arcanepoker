import { Box, Chip, Stack, Typography } from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import { DealtCard } from "../Card/DealtCard";
import { useGame } from "../../store/useGame";
import type { GamePlayer } from "../../store/storeTypes";

interface PlayerSeatProps {
  player: GamePlayer;
  playerIndex: number;
  isHero?: boolean;
}

function actionLabel(action: string): string {
  switch (action) {
    case "fold":
      return "Fold";
    case "check":
      return "Check";
    case "call":
      return "Call";
    case "raise":
      return "Raise";
    case "bet":
      return "Bet";
    case "all-in":
      return "All-In";
    case "smallBlind":
      return "SB";
    case "bigBlind":
      return "BB";
    default:
      return action;
  }
}

function actionColor(
  action: string
): "default" | "error" | "warning" | "success" | "info" | "primary" | "secondary" {
  switch (action) {
    case "fold":
      return "error";
    case "raise":
    case "bet":
    case "all-in":
      return "warning";
    case "call":
      return "info";
    case "check":
      return "success";
    default:
      return "default";
  }
}

function formatHandRank(rank: string): string {
  return rank
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PlayerSeat({ player, playerIndex, isHero = false }: PlayerSeatProps) {
  const { state } = useGame();

  const isDealer = playerIndex === state.dealerIndex;
  const isActive =
    state.players[state.activePlayerIndex]?.id === player.id &&
    ["pre-flop", "flop", "turn", "river"].includes(state.stage);
  const isShowdown = state.stage === "showdown";
  const revealedCard = state.priestessRevealedCards?.[player.id] ?? null;

  const showHandResult = isShowdown && !player.folded;
  const handResult = state.handResults.find((r) => r.playerId === player.id);
  const isWinner = state.winnerIds.includes(player.id);

  // Show cards face up: hero always, everyone at showdown (if not folded)
  const showFaceUp = isHero || (isShowdown && !player.folded);

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        p: 1.5,
        minWidth: { xs: 140, sm: 160 },
        maxWidth: 200,
        opacity: player.folded ? 0.55 : 1,
        transition: "opacity 0.3s",
      }}
    >
      {/* Player name and stack */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: isHero ? "gold.light" : "silver.light",
          fontWeight: "bold",
          mb: 0.5,
          fontSize: "0.75rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {player.name}{isWinner ? " ★" : ""} &mdash; &#9824; {player.stack}
      </Typography>

      {/* Cards — data-dealer-anchor lets DealerChip find this element by player id */}
      <Box
        data-dealer-anchor={player.id}
        sx={{ position: "relative", display: "flex", justifyContent: "center", mb: 0.5 }}
      >
        <Stack direction="row" justifyContent="center" alignItems="flex-end">
          {player.holeCards.length > 0 ? (
            player.holeCards.map((card, i) => (
              <Box key={i} sx={{ transform: i === 0 ? "rotate(-6deg)" : "rotate(6deg)", transformOrigin: "bottom center", ml: i === 0 ? 0 : -1.5 }}>
                <DealtCard
                  small
                  rank={showFaceUp ? card.value : undefined}
                  suit={showFaceUp ? card.suit : undefined}
                  flipped={showFaceUp}
                  dealIndex={playerIndex * 2 + i}
                />
              </Box>
            ))
          ) : (
            <>
              <Box sx={{ transform: "rotate(-6deg)", transformOrigin: "bottom center" }}><PlayingCard small /></Box>
              <Box sx={{ transform: "rotate(6deg)", transformOrigin: "bottom center", ml: -1.5 }}><PlayingCard small /></Box>
            </>
          )}
        </Stack>
      </Box>

      {/* Priestess revealed card */}
      {revealedCard && (
        <Box sx={{ mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ color: "secondary.light", fontSize: "0.6rem", display: "block", textAlign: "center" }}
          >
            Revealed
          </Typography>
          <Stack direction="row" justifyContent="center">
            <PlayingCard
              small
              rank={revealedCard.value}
              suit={revealedCard.suit}
              flipped
            />
          </Stack>
        </Box>
      )}

      {/* Action chip / hand rank — shared grid cell, no layout shift */}
      <Box sx={{ display: "grid", mt: 0.5 }}>
        {/* Action chip — fades out at showdown */}
        <Box
          sx={{
            gridArea: "1 / 1",
            display: "flex",
            justifyContent: "center",
            opacity: showHandResult ? 0 : 1,
            pointerEvents: showHandResult ? "none" : "auto",
            transition: "opacity 250ms ease",
          }}
        >
          <Chip
            label={player.currentAction ? actionLabel(player.currentAction) : "\u00A0"}
            color={player.currentAction ? actionColor(player.currentAction) : "default"}
            size="small"
            sx={{
              fontSize: "0.65rem",
              height: 18,
              visibility: player.currentAction ? "visible" : "hidden",
            }}
          />
        </Box>

        {/* Hand rank — fades in at showdown */}
        <Box
          sx={{
            gridArea: "1 / 1",
            display: "flex",
            justifyContent: "center",
            opacity: showHandResult ? 1 : 0,
            pointerEvents: showHandResult ? "auto" : "none",
            transition: "opacity 250ms ease",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isWinner ? "gold.light" : "silver.light",
              fontSize: "0.65rem",
              fontStyle: "italic",
              textAlign: "center",
              visibility: handResult ? "visible" : "hidden",
            }}
          >
            {handResult ? formatHandRank(handResult.rankName) : "\u00A0"}
          </Typography>
        </Box>
      </Box>

      {/* Bet / All-In — always occupies space, visible only when applicable */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          color: "gold.main",
          fontSize: "0.65rem",
          mt: 0.25,
          visibility: (player.currentBet > 0 || player.isAllIn) && !showHandResult ? "visible" : "hidden",
        }}
      >
        {player.currentBet > 0 ? `Bet: ${player.currentBet}` : "\u00A0"}
        {player.isAllIn ? " · All-In" : ""}
      </Typography>
    </Box>
  );
}
