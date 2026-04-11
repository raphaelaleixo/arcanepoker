/**
 * Displays the current pot and bet during active play, and the winner announcement
 * (or split-pot result) at showdown.
 */
import { Stack, Typography } from "@mui/material";
import type { GamePlayer } from "../../store/storeTypes";
import { useAnimatedValue } from "../../hooks/useAnimatedValue";
import { useTranslation } from "../../i18n";

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
  const { t } = useTranslation();
  const animatedPot = useAnimatedValue(potSize, 300);
  const animatedBet = useAnimatedValue(currentBet, 300);

  const ruinsPotEl =
    ruinsPot > 0 ? (
      <Typography
        variant="body2"
        sx={{ color: "secondary.light", fontWeight: "bold" }}
      >
        {t("pot.tower")}: {ruinsPot}
      </Typography>
    ) : null;

  if (stage === "showdown") {
    const perWinner =
      winnerIds.length > 0 ? Math.floor(potWon / winnerIds.length) : 0;
    const heroId = players.find((p) => p.type === "human")?.id;

    if (winnerIds.length > 1) {
      return (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: 24 }}
        >
          <Typography
            variant="body2"
            sx={{ color: "gold.main", fontWeight: "bold" }}
          >
            {t("pot.splitPot", { amount: perWinner })}
          </Typography>
          {ruinsPotEl}
        </Stack>
      );
    }
    if (winnerIds.length === 1) {
      const isHero = winnerIds[0] === heroId;
      const name = players.find((p) => p.id === winnerIds[0])?.name ?? "";
      return (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: 24 }}
        >
          <Typography
            variant="body2"
            sx={{ color: "gold.main", fontWeight: "bold" }}
          >
            {isHero
              ? t("pot.youWin", { amount: perWinner })
              : t("pot.playerWins", { name, amount: perWinner })}
          </Typography>
          {ruinsPotEl}
        </Stack>
      );
    }
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: 24 }}
    >
      <Typography
        variant="body2"
        sx={{ color: "gold.main", fontWeight: "bold" }}
      >
        {t("pot.pot")}: {animatedPot}
      </Typography>
      {currentBet > 0 && (
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          {t("pot.bet")}: {animatedBet}
        </Typography>
      )}
      {ruinsPotEl}
    </Stack>
  );
}
