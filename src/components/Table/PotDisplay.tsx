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
}

export function PotDisplay({
  stage,
  potSize,
  currentBet,
  potWon,
  winnerIds,
  players,
}: PotDisplayProps) {
  if (stage === "showdown") {
    const perWinner = winnerIds.length > 0 ? Math.floor(potWon / winnerIds.length) : 0;
    // Hero is identified by type "human" — same convention as the rest of the store.
    const heroId = players.find((p) => p.type === "human")?.id;

    if (winnerIds.length > 1) {
      return (
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 24 }}>
          <Typography variant="body2" sx={{ color: "gold.main", fontWeight: "bold" }}>
            Split Pot — {perWinner} each
          </Typography>
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
    </Stack>
  );
}
