// src/pages/TutorialGamePage.tsx
import { GameProvider } from "../store/GameContext";
import { TutorialProvider } from "../tutorial/TutorialContext";
import { PokerTable } from "../components/Table/PokerTable";
import { useGameSounds } from "../hooks/useGameSounds";

function TutorialGameContent() {
  useGameSounds();
  return (
    <TutorialProvider>
      <PokerTable />
    </TutorialProvider>
  );
}

export function TutorialGamePage() {
  return (
    <GameProvider isTutorial>
      <TutorialGameContent />
    </GameProvider>
  );
}
