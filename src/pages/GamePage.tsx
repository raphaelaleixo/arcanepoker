import { GameProvider } from "../store/GameContext";
import { PokerTable } from "../components/Table/PokerTable";

interface GamePageProps {
  isTutorial?: boolean;
}

export function GamePage({ isTutorial = false }: GamePageProps) {
  return (
    <GameProvider isTutorial={isTutorial}>
      <PokerTable />
    </GameProvider>
  );
}
