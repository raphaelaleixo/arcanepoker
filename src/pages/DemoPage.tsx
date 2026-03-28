// src/pages/DemoPage.tsx
// Hidden route (/demo) — auto-plays a scripted hand for recording purposes.
import { GameProvider } from "../store/GameContext";
import { DemoProvider } from "../demo/DemoContext";
import { PokerTable } from "../components/Table/PokerTable";

export function DemoPage() {
  return (
    <GameProvider isTutorial>
      <DemoProvider>
        <PokerTable />
      </DemoProvider>
    </GameProvider>
  );
}
