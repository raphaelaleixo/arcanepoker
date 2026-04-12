import { GameProvider } from "../store/GameContext";
import { PokerTable } from "../components/Table/PokerTable";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";
import gameLoopUrl from "../assets/audio/game-loop-compressed.mp3";

interface GamePageProps {
  isTutorial?: boolean;
}

export function GamePage({ isTutorial = false }: GamePageProps) {
  useBackgroundMusic(gameLoopUrl);
  return (
    <GameProvider isTutorial={isTutorial}>
      <PokerTable />
    </GameProvider>
  );
}
