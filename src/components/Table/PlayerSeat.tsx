/**
 * One seat at the poker table — renders name/stack header, hole cards, and
 * the action chip / hand rank status bar.
 * Calls useGame() directly; each seat independently subscribes to state.
 */
import { Box, SxProps, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { keyframes } from "@emotion/react";
import { useGame } from "../../store/useGame";
import type { GamePlayer } from "../../store/storeTypes";
import type { StandardCard } from "../../types/types";
import { PlayerCards } from "./PlayerCards";
import { PlayerStatusBar } from "./PlayerStatusBar";

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.7); opacity: 0.3; }
`;

interface PlayerSeatProps {
  player: GamePlayer;
  playerIndex: number;
  isHero?: boolean;
  isActive?: boolean;
  /** When set, hero cards are clickable for selection (Priestess / Chariot). */
  onCardClick?: (card: StandardCard) => void;
  /** The currently selected card during an inline card-pick interaction. */
  selectedCard?: StandardCard | null;
  sx?: SxProps;
}

export function PlayerSeat({
  player,
  playerIndex,
  isHero = false,
  isActive = false,
  onCardClick,
  selectedCard,
  sx,
}: PlayerSeatProps) {
  const { state } = useGame();

  const isShowdown = state.stage === "showdown";
  const priestessCard = state.priestessRevealedCards?.[player.id] ?? null;

  const showHandResult = isShowdown && !player.folded;
  const handResult = state.handResults.find((r) => r.playerId === player.id);
  const isWinner = state.winnerIds.includes(player.id);

  const isJusticeRevealed = state.justiceRevealedPlayerId === player.id;

  // Hero is always face-up. Non-folded players at a real showdown (with a
  // hand result) are face-up. Bluff-wins (no handResult) stay hidden.
  // Justice: the chosen player's cards are revealed for all to see.
  const showFaceUp =
    isHero ||
    (isShowdown && !player.folded && !!handResult) ||
    isJusticeRevealed;

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        p: 1.5,
        //minWidth: { xs: 140, sm: 160 },
        opacity: player.folded ? 0.55 : 1,
        transition: "opacity 0.3s",
        ...sx,
      }}
    >
      {isActive && !player.folded && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "gold.main",
            opacity: 0.85,
            animation: `${pulse} 1.4s ease-in-out infinite`,
          }}
        />
      )}
      <PlayerStatusBar
        currentAction={player.currentAction ?? null}
        handResult={handResult}
        isWinner={isWinner}
        showHandResult={showHandResult}
      />
      {isJusticeRevealed && (
        <Box
          sx={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 4,
            width: "1.5em",
            height: "1.5em",
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <VisibilityIcon
            sx={{
              fontSize: "0.75rem",
              color: "secondary.dark",
            }}
          />
        </Box>
      )}
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
        redrawSeed={state.holeCardChangeSeeds?.[player.id] ?? 0}
        playerId={player.id}
      />
      {/* Player name and stack */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: "0.35em",
          position: "relative",
          zIndex: 2,
          width: "fit-content",
          mx: "auto",
          "& > *": { lineHeight: 0.9, my: "0.12em" },
        }}
      >
        <Typography
          variant="caption"
          fontWeight="bold"
          fontSize="0.65em"
          fontFamily="Young Serif"
          color="gold.main"
        >
          {player.name}
        </Typography>
        <Typography variant="caption" fontWeight={800} fontSize="0.75em">
          {player.stack}
          {player.currentBet > 0 ? (
            <Typography
              variant="inherit"
              component="span"
              color="secondary.main"
              sx={{ ml: 0.5 }}
            >
              {player.currentBet > 0 ? `(${player.currentBet})` : "\u00A0"}
            </Typography>
          ) : null}
        </Typography>
      </Box>
    </Box>
  );
}
