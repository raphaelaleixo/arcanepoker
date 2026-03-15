import { Box, Chip, Stack, Typography } from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import { DealtCard } from "../Card/DealtCard";
import { useGame } from "../../store/useGame";
import type { GamePlayer } from "../../store/storeTypes";
import type { StandardCard } from "../../types/types";

interface PlayerSeatProps {
  player: GamePlayer;
  playerIndex: number;
  isHero?: boolean;
  /** When set, hero cards are clickable for selection (Priestess / Chariot). */
  onCardClick?: (card: StandardCard) => void;
  /** The currently selected card during an inline card-pick interaction. */
  selectedCard?: StandardCard | null;
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

export function PlayerSeat({ player, playerIndex, isHero = false, onCardClick, selectedCard }: PlayerSeatProps) {
  const { state } = useGame();

  const isDealer = playerIndex === state.dealerIndex;
  const isActive =
    state.players[state.activePlayerIndex]?.id === player.id &&
    ["pre-flop", "flop", "turn", "river", "empress"].includes(state.stage);
  const isShowdown = state.stage === "showdown";
  const priestessCard = state.priestessRevealedCards?.[player.id] ?? null;

  const showHandResult = isShowdown && !player.folded;
  const handResult = state.handResults.find((r) => r.playerId === player.id);
  const isWinner = state.winnerIds.includes(player.id);

  // Show cards face up: hero always, non-folded players at a real showdown.
  // If a player won because everyone else folded (handResult absent), keep cards hidden — it may be a bluff.
  const showFaceUp = isHero || (isShowdown && !player.folded && !!handResult);

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
            player.holeCards.map((card, i) => {
              const isPriestessRevealed =
                !showFaceUp &&
                priestessCard != null &&
                card.value === priestessCard.value &&
                card.suit === priestessCard.suit;
              const faceUp = showFaceUp || isPriestessRevealed;
              const isSelected =
                selectedCard != null &&
                card.value === selectedCard.value &&
                card.suit === selectedCard.suit;
              return (
                <Box
                  key={`${state.wheelRound}-${i}`}
                  onClick={onCardClick ? () => onCardClick(card) : undefined}
                  sx={{
                    transform: isSelected
                      ? (i === 0 ? "rotate(-6deg) translateY(-10px)" : "rotate(6deg) translateY(-10px)")
                      : (i === 0 ? "rotate(-6deg)" : "rotate(6deg)"),
                    transformOrigin: "bottom center",
                    ml: i === 0 ? 0 : -1.5,
                    cursor: onCardClick ? "pointer" : "default",
                    transition: "transform 0.15s ease",
                    outline: isSelected ? "2px solid gold" : "none",
                    borderRadius: 1,
                  }}
                >
                  <DealtCard
                    small
                    rank={faceUp ? card.value : undefined}
                    suit={faceUp ? card.suit : undefined}
                    flipped={faceUp}
                    dealIndex={playerIndex * 2 + i}
                    revealDelay={!isHero ? 200 + playerIndex * 300 + i * 100 : undefined}
                  />
                </Box>
              );
            })
          ) : (
            <>
              <Box sx={{ transform: "rotate(-6deg)", transformOrigin: "bottom center" }}><PlayingCard small /></Box>
              <Box sx={{ transform: "rotate(6deg)", transformOrigin: "bottom center", ml: -1.5 }}><PlayingCard small /></Box>
            </>
          )}
        </Stack>
      </Box>

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
