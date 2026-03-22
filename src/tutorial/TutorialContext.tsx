// src/tutorial/TutorialContext.tsx
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useGame } from "../store/useGame";
import { TUTORIAL_ROUNDS, type TutorialNarration, type CardHighlight } from "./tutorialScript";
import type { StandardCard, ActionType } from "../types/types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface TutorialContextValue {
  isTutorial: true;
  currentRound: 1 | 2;
  narration: { title: string; body: string } | null;
  /** The one action the hero may take right now; null when it is not hero's turn. */
  tutorialAllowedAction: string | null;
  isComplete: boolean;
  dismissNarration: () => void;
  highlightCards: CardHighlight[] | null;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider");
  return ctx;
}

/** Safe version — returns null when rendered outside a TutorialProvider. */
export function useTutorialOptional(): TutorialContextValue | null {
  return useContext(TutorialContext);
}

// ─── Internal state ───────────────────────────────────────────────────────────

interface TutorialState {
  currentRound: 1 | 2;
  narration: { title: string; body: string } | null;
  pendingDispatchOnDismiss: (() => void) | null;
}

type TutorialAction =
  | { type: "SHOW_NARRATION"; narration: TutorialNarration; onDismiss?: () => void }
  | { type: "DISMISS_NARRATION" }
  | { type: "ADVANCE_ROUND" };

function tutorialReducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case "SHOW_NARRATION":
      return {
        ...state,
        narration: { title: action.narration.title, body: action.narration.body },
        pendingDispatchOnDismiss: action.onDismiss ?? null,
      };
    case "DISMISS_NARRATION":
      return { ...state, narration: null, pendingDispatchOnDismiss: null };
    case "ADVANCE_ROUND":
      return { ...state, currentRound: 2, narration: null, pendingDispatchOnDismiss: null };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const BOT_THINK_MS = 700;
const HERO_ID = "hero";

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { state: gameState, dispatch: gameDispatch } = useGame();

  const [tutState, tutDispatch] = useReducer(tutorialReducer, {
    currentRound: 1,
    narration: null,
    pendingDispatchOnDismiss: null,
  });
  const [isComplete, setIsComplete] = useState(false);

  // Refs for latest values without stale closures
  const tutStateRef = useRef(tutState);
  tutStateRef.current = tutState;
  const isCompleteRef = useRef(isComplete);
  isCompleteRef.current = isComplete;

  // Track whether the current hand has been overridden with tutorial data
  const handInitializedRef = useRef(false);
  const startGameFiredRef = useRef(false);
  // Prevents the intro narration from firing more than once
  const introShownRef = useRef(false);
  // Pointer into the current round's botActions array
  const botQueuePointerRef = useRef(0);
  // Previous game state for transition detection
  const prevGameStateRef = useRef(gameState);

  // ── Derive current script ─────────────────────────────────────────────────
  // Read from a ref so effects always get the latest value at fire time
  const currentRoundRef = useRef<1 | 2>(1);
  currentRoundRef.current = tutState.currentRound;

  function getCurrentScript() {
    return TUTORIAL_ROUNDS[currentRoundRef.current - 1];
  }

  // ── Hand initialization ───────────────────────────────────────────────────
  // Fires when stage becomes "pre-flop" and hand hasn't been overridden yet.
  // This covers both the initial START_GAME (dispatched by TutorialProvider on
  // mount) and the NEXT_HAND transition at the start of Round 2.

  useEffect(() => {
    if (gameState.stage !== "pre-flop" || handInitializedRef.current) return;
    handInitializedRef.current = true;
    botQueuePointerRef.current = 0;
    const script = getCurrentScript();
    gameDispatch({
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: script.dealerIndex,
        playerHoleCards: script.playerHoleCards as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: script.communityCardQueue,
        arcanaOverride: script.arcanaOverride,
      },
    });
  }, [gameState.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger the initial START_GAME (GameProvider has isTutorial=true so it won't auto-start)
  useEffect(() => {
    if (startGameFiredRef.current) return;
    startGameFiredRef.current = true;
    handInitializedRef.current = false; // ensure override runs after this START_GAME
    gameDispatch({ type: "START_GAME" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bot action queue ──────────────────────────────────────────────────────

  useEffect(() => {
    if (tutStateRef.current.narration !== null) return;
    if (!handInitializedRef.current) return;

    const script = getCurrentScript();
    const queue = script.botActions;
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
      if (tutStateRef.current.narration !== null) return;
      botQueuePointerRef.current += 1;
      gameDispatch({
        type: "PLAYER_ACTION",
        payload: {
          playerId: nextAction.playerId,
          action: nextAction.action as ActionType,
          amount: nextAction.amount,
        },
      });
    }, BOT_THINK_MS);

    return () => clearTimeout(timer);
  }, [gameState.activePlayerIndex, gameState.stage, tutState.narration]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Narration triggers ────────────────────────────────────────────────────

  useEffect(() => {
    const prev = prevGameStateRef.current;
    // Update prev AFTER capturing it for comparison
    prevGameStateRef.current = gameState;

    if (!handInitializedRef.current) return;
    if (tutStateRef.current.narration !== null) return;

    const script = getCurrentScript();
    const narrations = script.narrations;

    // intro + hole-cards-page: fires once at the start of Round 1
    if (currentRoundRef.current === 1 && !introShownRef.current && gameState.stage === "pre-flop") {
      const intro = narrations.find((n) => n.trigger === "intro");
      if (intro) {
        introShownRef.current = true;
        const holeCardsPage = narrations.find((n) => n.trigger === "hole-cards-page");
        tutDispatch({
          type: "SHOW_NARRATION",
          narration: intro,
          onDismiss: holeCardsPage
            ? () => tutDispatch({ type: "SHOW_NARRATION", narration: holeCardsPage })
            : undefined,
        });
        return;
      }
    }

    // arcana-pending: pendingInteraction just became arcana-reveal
    if (
      gameState.pendingInteraction?.type === "arcana-reveal" &&
      prev.pendingInteraction?.type !== "arcana-reveal"
    ) {
      const n = narrations.find((n) => n.trigger === "arcana-pending");
      if (n) {
        tutDispatch({
          type: "SHOW_NARRATION",
          narration: n,
          onDismiss: () => gameDispatch({ type: "REVEAL_ARCANA" }),
        });
        return;
      }
    }

    // arcana-revealed: activeArcana just became non-null (effect applied)
    if (gameState.activeArcana !== null && prev.activeArcana === null) {
      const n = narrations.find((n) => n.trigger === "arcana-revealed");
      if (n) {
        tutDispatch({ type: "SHOW_NARRATION", narration: n });
        return;
      }
    }

    // showdown: winnerIds just became non-empty
    if (gameState.winnerIds.length > 0 && prev.winnerIds.length === 0) {
      const n = narrations.find((n) => n.trigger === "showdown");
      if (n) {
        tutDispatch({ type: "SHOW_NARRATION", narration: n });
        return;
      }
    }

    // page-bonus: pendingInteraction just became page-challenge
    if (
      gameState.pendingInteraction?.type === "page-challenge" &&
      prev.pendingInteraction?.type !== "page-challenge"
    ) {
      const n = narrations.find((n) => n.trigger === "page-bonus");
      if (n) {
        tutDispatch({
          type: "SHOW_NARRATION",
          narration: n,
          onDismiss: () => gameDispatch({ type: "RESOLVE_PAGE_CHALLENGE" }),
        });
        return;
      }
    }

    // round-end (no page-bonus path): page-challenge just resolved → show round-end
    if (
      prev.pendingInteraction?.type === "page-challenge" &&
      gameState.pendingInteraction === null &&
      gameState.winnerIds.length > 0
    ) {
      const n = narrations.find((n) => n.trigger === "round-end");
      if (n) {
        tutDispatch({ type: "SHOW_NARRATION", narration: n });
        return;
      }
    }
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hero action constraint ────────────────────────────────────────────────

  const hero = gameState.players.find((p) => p.id === HERO_ID);
  const isHeroTurn =
    gameState.players[gameState.activePlayerIndex]?.id === HERO_ID &&
    ["pre-flop", "flop", "turn", "river"].includes(gameState.stage) &&
    gameState.pendingInteraction === null &&
    tutState.narration === null;

  let tutorialAllowedAction: string | null = null;
  if (isHeroTurn && hero) {
    const toCall = gameState.currentBet - hero.currentBet;
    if (toCall === 0) {
      tutorialAllowedAction = "check";
    } else if (toCall >= hero.stack) {
      // Hero can only go all-in — middle button key is "all-in" in this case
      tutorialAllowedAction = "all-in";
    } else {
      const script = getCurrentScript();
      tutorialAllowedAction =
        (script.heroActions[gameState.stage as keyof typeof script.heroActions] as string | undefined)
        ?? "call";
    }
  }

  // ── Highlight cards ───────────────────────────────────────────────────────

  const matchedNarration = tutState.narration
    ? getCurrentScript().narrations.find((n) => n.title === tutState.narration!.title)
    : null;
  const highlightCards: CardHighlight[] | null = matchedNarration?.highlightCards ?? null;

  // ── Round transitions ─────────────────────────────────────────────────────

  const handleRoundEndDismiss = useCallback(() => {
    // Capture currentRound NOW before any async state changes
    const round = currentRoundRef.current;
    tutDispatch({ type: "DISMISS_NARRATION" });
    if (round === 1) {
      // Advance to Round 2
      handInitializedRef.current = false;
      botQueuePointerRef.current = 0;
      tutDispatch({ type: "ADVANCE_ROUND" });
      setTimeout(() => gameDispatch({ type: "NEXT_HAND" }), 100);
    } else {
      // Round 2 complete — tutorial done; navigate home via useEffect
      setIsComplete(true);
    }
  }, [gameDispatch]);

  // ── Dismiss dispatcher ────────────────────────────────────────────────────

  const baseDismiss = useCallback(() => {
    const pending = tutStateRef.current.pendingDispatchOnDismiss;
    tutDispatch({ type: "DISMISS_NARRATION" });
    if (pending) {
      setTimeout(pending, 100);
    }
  }, []);

  const dismissNarration = useCallback(() => {
    const n = tutStateRef.current.narration;
    const script = getCurrentScript();
    const matchingNarration = script.narrations.find((nr) => nr.title === n?.title);
    const trigger = matchingNarration?.trigger;

    if (trigger === "round-end") {
      handleRoundEndDismiss();
      return;
    }

    if (trigger === "showdown") {
      tutDispatch({ type: "DISMISS_NARRATION" });
      const hasPageBonus = script.narrations.some((nr) => nr.trigger === "page-bonus");
      if (hasPageBonus) {
        // Chain to page-bonus; RESOLVE_PAGE_CHALLENGE fires when user dismisses that.
        const pageBonus = script.narrations.find((nr) => nr.trigger === "page-bonus");
        if (pageBonus) {
          setTimeout(() => {
            tutDispatch({
              type: "SHOW_NARRATION",
              narration: pageBonus,
              onDismiss: () => gameDispatch({ type: "RESOLVE_PAGE_CHALLENGE" }),
            });
          }, 100);
        }
      } else {
        // No page-bonus — chain directly to round-end.
        const roundEnd = script.narrations.find((nr) => nr.trigger === "round-end");
        if (roundEnd) {
          tutDispatch({ type: "SHOW_NARRATION", narration: roundEnd });
        }
      }
      return;
    }

    baseDismiss();
  }, [baseDismiss, handleRoundEndDismiss, gameDispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <TutorialContext.Provider
      value={{
        isTutorial: true,
        currentRound: tutState.currentRound,
        narration: tutState.narration,
        tutorialAllowedAction,
        isComplete,
        dismissNarration,
        highlightCards,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
