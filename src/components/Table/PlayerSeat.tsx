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

export function PlayerSeat({ player, playerIndex, isHero = false }: PlayerSeatProps) {
  const { state } = useGame();

  const isDealer = playerIndex === state.dealerIndex;
  const isActive =
    state.players[state.activePlayerIndex]?.id === player.id &&
    ["pre-flop", "flop", "turn", "river"].includes(state.stage);
  const isShowdown = state.stage === "showdown";
  const revealedCard = state.priestessRevealedCards?.[player.id] ?? null;

  // Show cards face up: hero always, everyone at showdown (if not folded)
  const showFaceUp = isHero || (isShowdown && !player.folded);

  return (
    <Box
      sx={{
        position: "relative",
        border: "2px solid",
        borderColor: isActive ? "gold.main" : "rgba(255,255,255,0.15)",
        borderRadius: 2,
        p: 1.5,
        minWidth: { xs: 140, sm: 160 },
        maxWidth: 200,
        background: player.folded
          ? "rgba(0,0,0,0.6)"
          : "rgba(15,61,32,0.85)",
        boxShadow: isActive
          ? "0 0 16px 4px rgba(255,215,0,0.4)"
          : "rgba(0,0,0,0.4) 0px 4px 12px",
        opacity: player.folded ? 0.55 : 1,
        transition: "border-color 0.3s, box-shadow 0.3s, opacity 0.3s",
      }}
    >
      {/* Dealer chip */}
      {isDealer && (
        <Box
          sx={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFD700, #B8860B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.65rem",
            fontWeight: "bold",
            color: "#000",
            border: "1px solid #B8860B",
            zIndex: 1,
          }}
        >
          D
        </Box>
      )}

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
        {player.name} &mdash; &#9824; {player.stack}
      </Typography>

      {/* Cards */}
      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mb: 0.5 }}>
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card, i) => (
            <DealtCard
              key={i}
              small
              rank={showFaceUp ? card.value : undefined}
              suit={showFaceUp ? card.suit : undefined}
              flipped={showFaceUp}
              dealIndex={playerIndex * 2 + i}
            />
          ))
        ) : (
          <>
            <PlayingCard small />
            <PlayingCard small />
          </>
        )}
      </Stack>

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

      {/* Action badge */}
      {player.currentAction && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5 }}>
          <Chip
            label={actionLabel(player.currentAction)}
            color={actionColor(player.currentAction)}
            size="small"
            sx={{ fontSize: "0.65rem", height: 18 }}
          />
        </Box>
      )}

      {/* All-in badge */}
      {player.isAllIn && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5 }}>
          <Chip
            label="ALL-IN"
            color="warning"
            size="small"
            sx={{ fontSize: "0.65rem", height: 18, fontWeight: "bold" }}
          />
        </Box>
      )}

      {/* Current bet indicator */}
      {player.currentBet > 0 && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            color: "gold.main",
            fontSize: "0.65rem",
            mt: 0.25,
          }}
        >
          Bet: {player.currentBet}
        </Typography>
      )}
    </Box>
  );
}
