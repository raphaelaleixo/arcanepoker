/**
 * One seat at the poker table — renders name/stack header, hole cards, and
 * the action chip / hand rank status bar.
 * Calls useGame() directly; each seat independently subscribes to state.
 */
import { Box, Typography } from "@mui/material";
import { useGame } from "../../store/useGame";
import type { GamePlayer } from "../../store/storeTypes";
import type { StandardCard } from "../../types/types";
import { PlayerCards } from "./PlayerCards";
import { PlayerStatusBar } from "./PlayerStatusBar";

interface PlayerSeatProps {
  player: GamePlayer;
  playerIndex: number;
  isHero?: boolean;
  /** When set, hero cards are clickable for selection (Priestess / Chariot). */
  onCardClick?: (card: StandardCard) => void;
  /** The currently selected card during an inline card-pick interaction. */
  selectedCard?: StandardCard | null;
}

export function PlayerSeat({
  player,
  playerIndex,
  isHero = false,
  onCardClick,
  selectedCard,
}: PlayerSeatProps) {
  const { state } = useGame();

  const isShowdown = state.stage === "showdown";
  const priestessCard = state.priestessRevealedCards?.[player.id] ?? null;

  const showHandResult = isShowdown && !player.folded;
  const handResult = state.handResults.find((r) => r.playerId === player.id);
  const isWinner = state.winnerIds.includes(player.id);

  // Hero is always face-up. Non-folded players at a real showdown (with a
  // hand result) are face-up. Bluff-wins (no handResult) stay hidden.
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

      <PlayerCards
        holeCards={player.holeCards}
        showFaceUp={showFaceUp}
        priestessCard={priestessCard}
        onCardClick={onCardClick}
        selectedCard={selectedCard}
        playerIndex={playerIndex}
        wheelRound={state.wheelRound}
        dealerAnchorId={player.id}
        isHero={isHero}
      />

      <PlayerStatusBar
        currentAction={player.currentAction ?? null}
        currentBet={player.currentBet}
        isAllIn={player.isAllIn}
        handResult={handResult}
        isWinner={isWinner}
        showHandResult={showHandResult}
      />
    </Box>
  );
}
