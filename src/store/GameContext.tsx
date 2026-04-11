import {
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { gameReducer } from "./gameReducer";
import { createInitialState } from "./initialState";
import { makeAIDecision } from "../engine/ai";
import { buildEvalOptions } from "./gameReducer";
import type { GameBot } from "./storeTypes";
import { GameContext } from "./context";
import { useSettings } from "./SettingsContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const BETTING_STAGES = new Set(["pre-flop", "flop", "turn", "river", "empress"]);
const BOT_THINK_MIN_MS = 500;
const BOT_THINK_MAX_MS = 2000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children, isTutorial = false }: { children: ReactNode; isTutorial?: boolean }) {
  const { language } = useSettings();
  const [state, dispatch] = useReducer(gameReducer, language, createInitialState);

  const startGame = useCallback(() => dispatch({ type: "START_GAME", language }), [language]);

  const isFirstRender = useRef(true);

  // Auto-start on mount (suppressed in tutorial — TutorialContext controls hand start)
  useEffect(() => {
    if (isTutorial) return;
    dispatch({ type: "START_GAME", language });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTutorial]);

  // Update player names when language changes without restarting the game
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch({ type: "UPDATE_PLAYER_NAMES", language });
  }, [language]);

  // Auto-run bot turns (suppressed in tutorial — TutorialContext drives bot actions)
  useEffect(() => {
    if (isTutorial) return;

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

      const devilMustBet =
        snapshot.activeArcana?.effectKey === "devil-double-raise" &&
        snapshot.roundActors.length === 0 &&
        snapshot.currentBet === 0;

      const finalDecision =
        devilMustBet && decision.action === "check"
          ? { action: "raise" as const, amount: snapshot.bigBlind }
          : decision;

      dispatch({
        type: "PLAYER_ACTION",
        payload: {
          playerId: bot.id,
          action: finalDecision.action,
          amount: "amount" in finalDecision ? finalDecision.amount : undefined,
        },
      });
    }, BOT_THINK_MIN_MS + Math.random() * (BOT_THINK_MAX_MS - BOT_THINK_MIN_MS));

    return () => clearTimeout(timer);
  }, [state, isTutorial]);

  return (
    <GameContext.Provider value={{ state, dispatch, startGame }}>
      {children}
    </GameContext.Provider>
  );
}
