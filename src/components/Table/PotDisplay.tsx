/**
 * Displays the current pot and bet during active play, and the winner announcement
 * (or split-pot result) at showdown.
 */
import { Stack, Typography } from "@mui/material";
import type { GamePlayer } from "../../store/storeTypes";

interface PotDisplayProps {
  stage: string;
  potSize: number;
  currentBet: number;
  /** Total chips distributed at the last showdown. Used for winner display. */
  potWon: number;
  winnerIds: string[];
  players: GamePlayer[];
  /** Tower ruins pot — awarded to the winner of the next round. */
  ruinsPot: number;
}

export function PotDisplay({
  stage,
  potSize,
  currentBet,
  potWon,
  winnerIds,
  players,
  ruinsPot,
}: PotDisplayProps) {
  const ruinsPotEl = ruinsPot > 0 ? (
    <Typography variant="body2" sx={{ color: "error.light", fontWeight: "bold" }}>
      &#x1F3F0; {ruinsPot}
    </Typography>
  ) : null;

  if (stage === "showdown") {
    const perWinner = winnerIds.length > 0 ? Math.floor(potWon / winnerIds.length) : 0;
    const heroId = players.find((p) => p.type === "human")?.id;

    if (winnerIds.length > 1) {
      return (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 24 }}>
          <Typography variant="body2" sx={{ color: "gold.main", fontWeight: "bold" }}>
            Split Pot — {perWinner} each
          </Typography>
          {ruinsPotEl}
        </Stack>
      );
    }
    if (winnerIds.length === 1) {
      const isHero = winnerIds[0] === heroId;
      const name = isHero ? "You" : players.find((p) => p.id === winnerIds[0])?.name;
      const verb = isHero ? "win" : "wins";
      return (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 24 }}>
          <Typography variant="body2" sx={{ color: "gold.main", fontWeight: "bold" }}>
            {name} {verb} {perWinner}!
          </Typography>
          {ruinsPotEl}
        </Stack>
      );
    }
    return null;
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 24 }}>
      <Typography variant="body2" sx={{ color: "gold.main", fontWeight: "bold" }}>
        Pot: {potSize}
      </Typography>
      {currentBet > 0 && (
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Bet: {currentBet}
        </Typography>
      )}
      {ruinsPotEl}
    </Stack>
  );
}
