import { GameProvider } from "../store/GameContext";
import { PokerTable } from "../components/Table/PokerTable";

export function GamePage() {
  return (
    <GameProvider>
      <PokerTable />
    </GameProvider>
  );
}
