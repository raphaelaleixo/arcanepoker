// src/demo/Demo3Context.tsx
//
// Sets up a scripted hand, fast-forwards to the river where a Page♠ triggers
// an arcana-reveal (The Fool). After a brief float, Fool flips face-up and
// replaces the Page in the community cards. Then all 20 safe Major Arcana
// cycle through (Death and Sun are skipped — both immediately end the hand).
// Between each arcana the old card animates out (arcanaThrowOff) before the
// next one deals in.
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGame } from "../store/useGame";
import type { ArcanaCard, ArcanaValue, StandardCard } from "../types/types";

// ─── Timing constants ────────────────────────────────────────────────────────

const START_DELAY_MS     = 2500; // wait before dispatching START_GAME
const SETUP_ACTION_MS    =   40; // delay between fast-forward player actions
const INTERACTION_ACK_MS =  600; // delay before auto-resolving a pendingInteraction
const ARCANA_REVEAL_MS   = 2500; // facedown float before Fool flips
const ARCANA_DISPLAY_MS  = 3000; // how long each arcana is shown face-up
const DISCARD_ANIM_MS    =  370; // throw-out animation duration
const FACEDOWN_MS        =  800; // facedown float before the new arcana flips

const HERO_ID = "hero";

const CYCLING_ARCANA: ArcanaValue[] = [
  "0","1","2","3","4","5","6","7","8","9","10",
  "11","12","13","14","15","16","17","18","19","20","21",
];

// These arcanas end the hand immediately — show the card visually only,
// skip dispatching FORCE_ARCANA so no game-state side-effects fire.
const DISPLAY_ONLY_ARCANA = new Set<ArcanaValue>(["13", "19"]);

// Page♠ at the river (index 4) — triggers the Fool arcana-reveal naturally.
const COMMUNITY_QUEUE: StandardCard[] = [
  { value: "A", suit: "spades" },
  { value: "K", suit: "hearts" },
  { value: "Q", suit: "diamonds" },
  { value: "J", suit: "clubs" },
  { value: "0", suit: "spades" },  // Page♠ — triggers arcana on the river
];

// Base state to restore before each new arcana. Clears Fool wildcard visual,
// Moon swap, Priestess/Justice reveals, and Chariot/Star/Wheel hole-card swaps.
const BASE_COMMUNITY_CARDS: StandardCard[] = [...COMMUNITY_QUEUE];

const BASE_HOLE_CARDS: Record<string, StandardCard[]> = {
  hero:            [{ value: "10", suit: "clubs" }, { value: "Q", suit: "clubs" }],
  "bot-swords":    [{ value: "5",  suit: "spades" }, { value: "7", suit: "clubs" }],
  "bot-cups":      [{ value: "A",  suit: "hearts" }, { value: "A", suit: "diamonds" }],
  "bot-wands":     [{ value: "2",  suit: "clubs" }, { value: "8", suit: "diamonds" }],
  "bot-pentacles": [{ value: "4",  suit: "diamonds" }, { value: "9", suit: "hearts" }],
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface Demo3ContextValue {
  isDemo3: true;
  /** True while the throw-out animation is playing between arcanas. */
  arcanaDiscarding: boolean;
  /**
   * Set during the facedown float phase of each new arcana (after discard,
   * before the flip). PokerTable uses this as pendingArcanaCard so the
   * ArcanaDisplayCard shows the card facedown with the float animation.
   */
  pendingCycleArcana: ArcanaCard | null;
  /**
   * Display-only arcana for cards whose FORCE_ARCANA would cause irreversible
   * side-effects (Death, Sun). Shown face-up without touching game state.
   */
  displayArcana: ArcanaCard | null;
}

const Demo3Context = createContext<Demo3ContextValue | null>(null);

export function useDemo3Optional(): Demo3ContextValue | null {
  return useContext(Demo3Context);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function Demo3Provider({ children }: { children: ReactNode }) {
  const { state: gameState, dispatch: gameDispatch } = useGame();

  const startFiredRef  = useRef(false);
  const handInitRef    = useRef(false);
  const arcanaIndexRef = useRef(1); // start cycling at Magician (index 1 = "1")
  const basePotRef     = useRef<{ potSize: number; ruinsPot: number } | null>(null);

  // true once the river is reached and the Fool facedown deck is visible
  const [setupComplete, setSetupComplete] = useState(false);
  const [arcanaDiscarding, setArcanaDiscarding] = useState(false);
  const [pendingCycleArcana, setPendingCycleArcana] = useState<ArcanaCard | null>(null);
  const [displayArcana, setDisplayArcana] = useState<ArcanaCard | null>(null);

  // ── Start game once ──────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      if (startFiredRef.current) return;
      startFiredRef.current = true;
      gameDispatch({ type: "START_GAME" });
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Override deal when pre-flop begins ───────────────────────────────────

  useEffect(() => {
    if (gameState.stage !== "pre-flop" || handInitRef.current) return;
    handInitRef.current = true;
    gameDispatch({
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: 4,
        playerHoleCards: {
          hero:            [{ value: "10", suit: "clubs" }, { value: "Q", suit: "clubs" }],
          "bot-swords":    [{ value: "5",  suit: "spades" }, { value: "7", suit: "clubs" }],
          "bot-cups":      [{ value: "A",  suit: "hearts" }, { value: "A", suit: "diamonds" }],
          "bot-wands":     [{ value: "2",  suit: "clubs" }, { value: "8", suit: "diamonds" }],
          "bot-pentacles": [{ value: "4",  suit: "diamonds" }, { value: "9", suit: "hearts" }],
        },
        communityCardQueue: COMMUNITY_QUEUE,
        arcanaOverride: { suit: "arcana", value: "0" }, // Fool — revealed on river
      },
    });
    arcanaIndexRef.current = 1; // cycling begins with Magician after Fool is shown
  }, [gameState.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fast-forward to river ────────────────────────────────────────────────

  useEffect(() => {
    if (setupComplete) return;
    if (!handInitRef.current) return;

    // Target state: river reached and Fool is floating facedown
    if (
      gameState.stage === "river" &&
      gameState.pendingInteraction?.type === "arcana-reveal"
    ) {
      setSetupComplete(true);
      return;
    }

    if (gameState.pendingInteraction) return; // wait for auto-resolve

    if (gameState.stage === "river") {
      // Reached river without arcana trigger (shouldn't happen in this demo)
      setSetupComplete(true);
      return;
    }

    const validStages = ["pre-flop", "flop", "turn"];
    if (!validStages.includes(gameState.stage)) return;

    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (
      !activePlayer ||
      activePlayer.folded ||
      activePlayer.isAllIn ||
      activePlayer.isEliminated
    ) return;

    const toCall = gameState.currentBet - activePlayer.currentBet;
    const action = toCall > 0 ? "call" : "check";

    const timer = setTimeout(() => {
      gameDispatch({
        type: "PLAYER_ACTION",
        payload: { playerId: activePlayer.id, action },
      });
    }, SETUP_ACTION_MS);

    return () => clearTimeout(timer);
  }, [
    gameState.activePlayerIndex,
    gameState.stage,
    gameState.pendingInteraction,
    setupComplete,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-reveal Fool after facedown float ────────────────────────────────

  useEffect(() => {
    if (!setupComplete) return;
    if (gameState.pendingInteraction?.type !== "arcana-reveal") return;

    const timer = setTimeout(() => {
      gameDispatch({ type: "REVEAL_ARCANA" });
    }, ARCANA_REVEAL_MS);

    return () => clearTimeout(timer);
  }, [setupComplete, gameState.pendingInteraction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Capture base pot once Fool is revealed ───────────────────────────────

  useEffect(() => {
    if (!setupComplete) return;
    if (gameState.pendingInteraction) return;
    if (basePotRef.current) return; // already captured
    basePotRef.current = { potSize: gameState.potSize, ruinsPot: gameState.ruinsPot };
  }, [setupComplete, gameState.pendingInteraction, gameState.potSize, gameState.ruinsPot]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cycle arcanas once Fool is revealed ──────────────────────────────────

  useEffect(() => {
    if (!setupComplete) return;
    if (gameState.pendingInteraction) return;
    const validStages = ["pre-flop", "flop", "turn", "river", "empress"];
    if (!validStages.includes(gameState.stage)) return;

    const timer = setInterval(() => {
      // 1. Throw-out animation for the current arcana
      setArcanaDiscarding(true);

      setTimeout(() => {
        // 2. Discard done — reset all arcana side-effects, then show next facedown
        setArcanaDiscarding(false);
        setDisplayArcana(null);
        gameDispatch({
          type: "RESET_ARCANA_EFFECTS",
          payload: {
            communityCards: BASE_COMMUNITY_CARDS,
            holeCards: BASE_HOLE_CARDS,
            potSize: basePotRef.current?.potSize,
            ruinsPot: basePotRef.current?.ruinsPot ?? 0,
          },
        });
        const value = CYCLING_ARCANA[arcanaIndexRef.current % CYCLING_ARCANA.length];
        arcanaIndexRef.current += 1;
        const nextCard: ArcanaCard = { suit: "arcana", value };
        setPendingCycleArcana(nextCard);

        // 3. Flip face-up after the facedown float
        setTimeout(() => {
          setPendingCycleArcana(null);
          if (DISPLAY_ONLY_ARCANA.has(value)) {
            // Show the card visually without applying its game effect
            setDisplayArcana({ suit: "arcana", value });
          } else {
            gameDispatch({ type: "FORCE_ARCANA", payload: { value } });
          }
        }, FACEDOWN_MS);
      }, DISCARD_ANIM_MS);
    }, ARCANA_DISPLAY_MS);

    return () => clearInterval(timer);
  }, [setupComplete, gameState.stage, gameState.pendingInteraction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-resolve other pendingInteractions ────────────────────────────────

  useEffect(() => {
    const pi = gameState.pendingInteraction;
    if (!pi) return;
    if (pi.type === "arcana-reveal") return; // handled by the reveal effect above

    const hero  = gameState.players.find((p) => p.id === HERO_ID);
    const card0 = hero?.holeCards[0] ?? null;

    const timer = setTimeout(() => {
      switch (pi.type) {
        case "chariot-pass":
          if (card0) gameDispatch({ type: "RESOLVE_CHARIOT", payload: { card: card0 } });
          break;
        case "priestess-reveal":
          if (card0) gameDispatch({ type: "RESOLVE_PRIESTESS", payload: { card: card0 } });
          break;
        case "star-discard":
          gameDispatch({ type: "RESOLVE_STAR", payload: { card: null } });
          break;
        case "magician-redraw":
          gameDispatch({ type: "RESOLVE_MAGICIAN", payload: { redraw: false } });
          break;
        case "page-challenge":
          gameDispatch({ type: "RESOLVE_PAGE_CHALLENGE" });
          break;
        default:
          break;
      }
    }, INTERACTION_ACK_MS);

    return () => clearTimeout(timer);
  }, [gameState.pendingInteraction]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Demo3Context.Provider value={{ isDemo3: true, arcanaDiscarding, pendingCycleArcana, displayArcana }}>
      {children}
    </Demo3Context.Provider>
  );
}
