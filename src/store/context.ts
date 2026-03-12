import { createContext } from "react";
import type { StoreGameState, GameAction } from "./storeTypes";

export interface GameContextValue {
  state: StoreGameState;
  dispatch: React.Dispatch<GameAction>;
  startGame: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);
