import { GameProvider } from "../store/GameContext";
import { PokerTable } from "../components/Table/PokerTable";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";

interface GamePageProps {
  isTutorial?: boolean;
}

export function GamePage({ isTutorial = false }: GamePageProps) {
  useBackgroundMusic("/audio/game-loop-compressed.mp3");
  return (
    <GameProvider isTutorial={isTutorial}>
      <PokerTable />
    </GameProvider>
  );
}
