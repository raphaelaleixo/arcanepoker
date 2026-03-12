import {
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { gameReducer } from "./gameReducer";
import { createInitialState } from "./initialState";
import { makeAIDecision } from "../engine/ai";
import { buildEvalOptions } from "./gameReducer";
import type { GameBot } from "./storeTypes";
import { GameContext } from "./context";

// ─── Constants ────────────────────────────────────────────────────────────────

const BETTING_STAGES = new Set(["pre-flop", "flop", "turn", "river"]);
const BOT_THINK_MS = 700;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());

  const startGame = useCallback(() => dispatch({ type: "START_GAME" }), []);

  // Auto-run bot turns
  useEffect(() => {
    const activePlayer = state.players[state.activePlayerIndex];

    if (
      !activePlayer ||
      activePlayer.type !== "ai" ||
      !BETTING_STAGES.has(state.stage) ||
      state.pendingInteraction !== null
    ) {
      return;
    }

    const bot = activePlayer as GameBot;
    const opts = buildEvalOptions(state);
    const snapshot = state; // captured for the async closure

    const timer = setTimeout(() => {
      const decision = makeAIDecision({
        holeCards: bot.holeCards,
        communityCards: snapshot.communityCards,
        toCall: snapshot.currentBet - bot.currentBet,
        potSize: snapshot.potSize,
        playerStack: bot.stack,
        bigBlind: snapshot.bigBlind,
        personality: bot.personality,
        evalOptions: opts,
        activeArcanaEffect: snapshot.activeArcana?.effectKey ?? null,
      });

      dispatch({
        type: "PLAYER_ACTION",
        payload: {
          playerId: bot.id,
          action: decision.action,
          amount: "amount" in decision ? decision.amount : undefined,
        },
      });
    }, BOT_THINK_MS);

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch, startGame }}>
      {children}
    </GameContext.Provider>
  );
}
