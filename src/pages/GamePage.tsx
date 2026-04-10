import { GameProvider } from "../store/GameContext";
import { PokerTable } from "../components/Table/PokerTable";
import { useBackgroundMusic } from "../hooks/useBackgroundMusic";
import { useGameSounds } from "../hooks/useGameSounds";

interface GamePageProps {
  isTutorial?: boolean;
}

function AudioEffects() {
  useGameSounds();
  return null;
}

export function GamePage({ isTutorial = false }: GamePageProps) {
  useBackgroundMusic("/audio/game-loop-compressed.mp3");
  return (
    <GameProvider isTutorial={isTutorial}>
      <AudioEffects />
      <PokerTable />
    </GameProvider>
  );
}
