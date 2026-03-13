import { GameProvider } from "./store/GameContext";
import { PokerTable } from "./components/Table/PokerTable";

export default function App() {
  return (
    <GameProvider>
      <PokerTable />
    </GameProvider>
  );
}
