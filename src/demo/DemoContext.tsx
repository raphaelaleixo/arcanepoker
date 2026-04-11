// src/demo/DemoContext.tsx
//
// Auto-play engine for the /demo route. Mirrors TutorialContext but:
//  - No narration/overlay — game plays without pausing
//  - Hero actions fire automatically with a button-highlight animation
//  - Loops indefinitely (NEXT_HAND after showdown + delay)
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGame } from "../store/useGame";
import { DEMO_SCRIPT } from "./demoScript";
import type { StandardCard, ActionType } from "../types/types";

// ─── Context shape ─────────────────────────────────────────────────────────

interface DemoContextValue {
  isDemo: true;
  /** The button key currently being "pressed" — passed to ActionButtons for the pulse animation. */
  pendingButtonHighlight: string | null;
}

const DemoContext = createContext<DemoContextValue | null>(null);

/** Returns null when rendered outside DemoProvider. */
export function useDemoOptional(): DemoContextValue | null {
  return useContext(DemoContext);
}

// ─── Timing constants ──────────────────────────────────────────────────────

const START_DELAY_MS     = 3000; // cooldown before any action fires after the demo loads
const BOT_THINK_MIN_MS   =  500; // min delay before a bot acts
const BOT_THINK_MAX_MS   = 2000; // max delay before a bot acts
const HERO_PRETHINK_MS   = 1500; // delay before the button highlight appears
const PULSE_MS           =  500; // how long the button stays "pressed" before dispatch
const ARCANA_REVEAL_MS   = 2000; // delay between arcana-pending and REVEAL_ARCANA
const LOOP_DELAY_MS      = 10000; // delay at results before restarting

const HERO_ID = "hero";

// ─── Provider ──────────────────────────────────────────────────────────────

export function DemoProvider({ children }: { children: ReactNode }) {
  const { state: gameState, dispatch: gameDispatch } = useGame();

  const [pendingButtonHighlight, setPendingButtonHighlight] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Refs to avoid stale closures
  const startGameFiredRef    = useRef(false);
  const handInitializedRef   = useRef(false);
  const botQueuePointerRef   = useRef(0);
  const prevPendingRef       = useRef(gameState.pendingInteraction);
  const prevWinnersRef       = useRef(gameState.winnerIds);

  // ── Cooldown before demo begins ──────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start game on mount ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isReady) return;
    if (startGameFiredRef.current) return;
    startGameFiredRef.current = true;
    handInitializedRef.current = false;
    gameDispatch({ type: "START_GAME" });
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Override deal when pre-flop begins ──────────────────────────────────

  useEffect(() => {
    if (gameState.stage !== "pre-flop" || handInitializedRef.current) return;
    handInitializedRef.current = true;
    botQueuePointerRef.current = 0;
    gameDispatch({
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: DEMO_SCRIPT.dealerIndex,
        playerHoleCards: DEMO_SCRIPT.playerHoleCards as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: DEMO_SCRIPT.communityCardQueue,
        arcanaOverride: DEMO_SCRIPT.arcanaOverride,
      },
    });
  }, [gameState.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bot action queue ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!handInitializedRef.current) return;

    const queue = DEMO_SCRIPT.botActions;
    const pointer = botQueuePointerRef.current;
    if (pointer >= queue.length) return;

    const nextAction = queue[pointer];
    const activePlayer = gameState.players[gameState.activePlayerIndex];

    if (
      !activePlayer ||
      activePlayer.id !== nextAction.playerId ||
      gameState.stage !== nextAction.stage ||
      activePlayer.type !== "ai"
    ) {
      return;
    }

    const timer = setTimeout(() => {
      botQueuePointerRef.current += 1;
      gameDispatch({
        type: "PLAYER_ACTION",
        payload: {
          playerId: nextAction.playerId,
          action: nextAction.action as ActionType,
          amount: nextAction.amount,
        },
      });
    }, BOT_THINK_MIN_MS + Math.random() * (BOT_THINK_MAX_MS - BOT_THINK_MIN_MS));

    return () => clearTimeout(timer);
  }, [gameState.activePlayerIndex, gameState.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hero auto-action ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!handInitializedRef.current) return;
    if (gameState.pendingInteraction !== null) return;

    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== HERO_ID) return;
    if (!["pre-flop", "flop", "turn", "river"].includes(gameState.stage)) return;

    const hero = gameState.players.find((p) => p.id === HERO_ID);
    if (!hero) return;

    const toCall = gameState.currentBet - hero.currentBet;
    const canCheck = toCall === 0;

    let action: ActionType;
    let buttonKey: string;

    // If an opponent is already all-in, hero must call — not raise.
    // Raising above an all-in creates a side pot the opponent auto-wins,
    // which incorrectly shows them as a co-winner at showdown.
    const opponentAllIn = gameState.players.some(
      (p) => p.id !== HERO_ID && p.isAllIn && !p.folded,
    );

    if (canCheck) {
      action = "check";
      buttonKey = "check";
    } else if (toCall >= hero.stack) {
      action = "all-in";
      buttonKey = "all-in";
    } else {
      const scriptedAction =
        DEMO_SCRIPT.heroActions[gameState.stage as keyof typeof DEMO_SCRIPT.heroActions];
      const resolved = (scriptedAction ?? "call") as ActionType;
      action = opponentAllIn && resolved === "raise" ? "call" : resolved;
      buttonKey = action;
    }

    // Phase 1: think delay, then show button highlight
    const prethinkTimer = setTimeout(() => {
      setPendingButtonHighlight(buttonKey);

      // Phase 2: pulse animation plays, then dispatch + clear highlight
      const pulseTimer = setTimeout(() => {
        setPendingButtonHighlight(null);

        if (action === "raise") {
          // Use the clamped raise amount: min raise = currentBet + lastRaiseSize (or bigBlind floor)
          const minRaise = Math.max(
            gameState.currentBet + gameState.lastRaiseSize,
            hero.currentBet + gameState.bigBlind,
            gameState.bigBlind,
          );
          gameDispatch({
            type: "PLAYER_ACTION",
            payload: { playerId: HERO_ID, action: "raise", amount: minRaise },
          });
        } else {
          gameDispatch({
            type: "PLAYER_ACTION",
            payload: { playerId: HERO_ID, action },
          });
        }
      }, PULSE_MS);

      return () => clearTimeout(pulseTimer);
    }, HERO_PRETHINK_MS);

    return () => clearTimeout(prethinkTimer);
  }, [gameState.activePlayerIndex, gameState.stage, gameState.pendingInteraction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Arcana reveal ────────────────────────────────────────────────────────

  useEffect(() => {
    const prev = prevPendingRef.current;
    prevPendingRef.current = gameState.pendingInteraction;

    if (
      gameState.pendingInteraction?.type === "arcana-reveal" &&
      prev?.type !== "arcana-reveal"
    ) {
      const timer = setTimeout(() => {
        gameDispatch({ type: "REVEAL_ARCANA" });
      }, ARCANA_REVEAL_MS);
      return () => clearTimeout(timer);
    }

    // Safety: auto-resolve page-challenge if it ever fires (hero has no Page card,
    // so this shouldn't happen in the demo, but guard against it anyway)
    if (
      gameState.pendingInteraction?.type === "page-challenge" &&
      prev?.type !== "page-challenge"
    ) {
      const timer = setTimeout(() => {
        gameDispatch({ type: "RESOLVE_PAGE_CHALLENGE" });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.pendingInteraction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loop: restart after showdown ─────────────────────────────────────────

  useEffect(() => {
    const prevWinners = prevWinnersRef.current;
    prevWinnersRef.current = gameState.winnerIds;

    const justSettled =
      gameState.winnerIds.length > 0 &&
      prevWinners.length === 0 &&
      gameState.pendingInteraction === null;

    if (!justSettled) return;

    const timer = setTimeout(() => {
      handInitializedRef.current = false;
      botQueuePointerRef.current = 0;
      startGameFiredRef.current = false;
      gameDispatch({ type: "START_GAME" });
    }, LOOP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [gameState.winnerIds, gameState.pendingInteraction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DemoContext.Provider value={{ isDemo: true, pendingButtonHighlight }}>
      {children}
    </DemoContext.Provider>
  );
}
