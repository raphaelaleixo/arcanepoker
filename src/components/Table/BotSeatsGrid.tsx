/**
 * Renders the four bot PlayerSeat components in the table grid.
 * Replaces the repetitive bot1/bot2/bot3/bot4 blocks in PokerTable.
 */
import type { GamePlayer } from "../../store/storeTypes";
import { PlayerSeat } from "./PlayerSeat";

const BOT_LAYOUT = [
  { position: 1, gridColumn: 1, gridRow: 2 },
  { position: 2, gridColumn: 3, gridRow: 2 },
  { position: 3, gridColumn: 1, gridRow: 3 },
  { position: 4, gridColumn: 3, gridRow: 3 },
] as const;

interface BotSeatsGridProps {
  players: GamePlayer[];
  activePlayerId: string | undefined;
}

export function BotSeatsGrid({ players, activePlayerId }: BotSeatsGridProps) {
  return (
    <>
      {BOT_LAYOUT.map(({ position, gridColumn, gridRow }) => {
        const bot = players.find((p) => p.position === position);
        if (!bot) return null;
        return (
          <PlayerSeat
            key={bot.id}
            player={bot}
            playerIndex={players.indexOf(bot)}
            isActive={activePlayerId === bot.id}
            sx={{ gridColumn, gridRow }}
          />
        );
      })}
    </>
  );
}
