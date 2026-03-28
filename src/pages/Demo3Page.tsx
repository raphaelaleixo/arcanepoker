// src/pages/Demo3Page.tsx
// Hidden route (/demo3) — cycles through all 22 Major Arcana cards on the
// table, showing each one as the active arcana for ~5 s.
import { GameProvider } from "../store/GameContext";
import { Demo3Provider } from "../demo/Demo3Context";
import { PokerTable } from "../components/Table/PokerTable";

export function Demo3Page() {
  return (
    <GameProvider isTutorial>
      <Demo3Provider>
        <PokerTable />
      </Demo3Provider>
    </GameProvider>
  );
}
