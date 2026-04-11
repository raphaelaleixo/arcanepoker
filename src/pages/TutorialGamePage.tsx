// src/pages/TutorialGamePage.tsx
import { GameProvider } from "../store/GameContext";
import { TutorialProvider } from "../tutorial/TutorialContext";
import { PokerTable } from "../components/Table/PokerTable";

export function TutorialGamePage() {
  return (
    <GameProvider isTutorial>
      <TutorialProvider>
        <PokerTable />
      </TutorialProvider>
    </GameProvider>
  );
}
