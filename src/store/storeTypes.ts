import type {
  StandardCard,
  ArcanaCard,
  GameStage,
  ActionType,
  HumanPlayer,
  ArcanaValue,
} from "../types/types";
import type {
  ActiveArcana,
  ArcanaEffectKey,
  BotPersonality,
  PendingInteraction,
  HandRankName,
} from "../types/game";

// ─── Extended AI player (full personality instead of the minimal one in types.ts) ─

export interface GameBot {
  id: string;
  name: string;
  stack: number;
  /** Amount the player has put in during the CURRENT betting round (reset each street). */
  currentBet: number;
  folded: boolean;
  isAllIn: boolean;
  holeCards: StandardCard[];
  position: number;
  currentAction?: ActionType;
  type: "ai";
  personality: BotPersonality;
  isEliminated?: boolean;
}

export type GamePlayer = GameBot | HumanPlayer;

// ─── Per-hand result entry ────────────────────────────────────────────────────

export interface HandResultEntry {
  playerId: string;
  rankName: HandRankName;
  rankValue: number;
}

// ─── Side pot ─────────────────────────────────────────────────────────────────

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

// ─── Full store state ─────────────────────────────────────────────────────────

export interface StoreGameState {
  // ── Core ────────────────────────────────────────────────────────────────────
  stage: GameStage;
  players: GamePlayer[];
  deck: StandardCard[];
  communityCards: StandardCard[];

  // ── Blinds / pot ────────────────────────────────────────────────────────────
  bigBlind: number;
  smallBlind: number;
  potSize: number;
  /** Highest bet placed by any player this betting round. */
  currentBet: number;
  /** Cumulative chips each player has wagered this hand (across all streets). */
  totalContributions: Record<string, number>;
  /** Computed at showdown only. Empty during active play. */
  pots: Pot[];
  dealerIndex: number;
  /** Index of the player whose turn it currently is. */
  activePlayerIndex: number;

  // ── Betting round tracking ───────────────────────────────────────────────────
  /**
   * IDs of players who have voluntarily acted this round.
   * Blind postings do NOT count. On a raise, this is reset to [raiserId].
   * Round ends when every eligible player (not folded, not all-in) is in this
   * list AND has currentBet === state.currentBet.
   */
  roundActors: string[];

  // ── Arcana ───────────────────────────────────────────────────────────────────
  arcanaDeck: ArcanaCard[];
  activeArcana: ActiveArcana | null;
  arcanaTriggeredThisGame: boolean;

  // ── Session ──────────────────────────────────────────────────────────────────
  handNumber: number;
  isFinalHand: boolean;
  pendingInteraction: PendingInteraction | null;

  // ── Arcana-specific state ────────────────────────────────────────────────────
  empress6thCardDealt: boolean;
  temperanceCandidates: [StandardCard, StandardCard, StandardCard] | null;
  /** Each active player's chosen river card when Temperance is active. */
  temperanceChoices: Record<string, StandardCard>;
  /** Cards each player has chosen to reveal face-up (Priestess effect). */
  priestessRevealedCards: Record<string, StandardCard>;
  /** Index of the community card replaced by the Fool (rendered as Fool arcana card). */
  foolCardIndex: number | null;
  /** Moon: index of the community card hidden face-down until showdown. */
  moonHiddenCommunityIndex: number | null;
  /** Moon: same index as moonHiddenCommunityIndex but persists through showdown so the React key stays stable and doesn't trigger a second animation on reveal. */
  moonAffectedIndex: number | null;
  /** Justice: playerId whose entire hand is revealed face-up this round. */
  justiceRevealedPlayerId: string | null;
  /** Tower: chips set aside to be awarded to the winner of the next round. */
  ruinsPot: number;
  /** Tower: true once the next hand starts — ruins pot is ready to be awarded at showdown. */
  ruinsPotReady: boolean;
  /** IDs of players who have bet/raised while Judgement is active; they may not fold. */
  judgementCommittedIds: string[];

  // ── Results ──────────────────────────────────────────────────────────────────
  winnerIds: string[];
  handResults: HandResultEntry[];
  /** Incremented on every Wheel-of-Fortune redeal; used as a React key seed to replay deal animations. */
  wheelRound: number;
  /** Per-player counter incremented when any arcana replaces hole cards (Magician, Star, Chariot, Hanged Man); used to trigger deal animations. */
  holeCardChangeSeeds: Record<string, number>;
  /** Incremented when any community card changes mid-hand (Fool, Moon); forces DealtCard remount → dealIn animation. */
  communityChangeKey: number;
  /** Total pot distributed at the last showdown (0 during play). Used for "wins XXX" display. */
  potWon: number;

  // ── Tutorial ─────────────────────────────────────────────────────────────────
  /** Pre-seeded community cards consumed by advanceStage instead of drawing from deck. */
  communityCardQueue?: StandardCard[];
  /** Force a specific arcana card when a Page triggers the arcana deck. Cleared after use. */
  arcanaOverride?: ArcanaCard | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: "START_GAME" }
  | {
      type: "PLAYER_ACTION";
      payload: { playerId: string; action: ActionType; amount?: number };
    }
  | { type: "RESOLVE_CHARIOT"; payload: { card: StandardCard } }
  | { type: "RESOLVE_TEMPERANCE"; payload: { card: StandardCard } }
  | { type: "RESOLVE_STAR"; payload: { card: StandardCard | null } }
  | { type: "RESOLVE_MOON"; payload: { swap: boolean } }
  | { type: "RESOLVE_MAGICIAN"; payload: { redraw: boolean } }
  | { type: "REVEAL_ARCANA" }
  | { type: "RESOLVE_PAGE_CHALLENGE" }
  | { type: "NEXT_HAND" }
  | { type: "FORCE_ARCANA"; payload: { value: ArcanaValue } }
  | { type: "RESOLVE_PRIESTESS"; payload: { card: StandardCard } }
  | { type: "DEV_FORCE_GAME_OVER" }
  | { type: "SET_PLAYER_STACK"; payload: { playerId: string; stack: number } }
  | {
      type: "TUTORIAL_OVERRIDE_DEAL";
      payload: {
        dealerIndex: number;
        playerHoleCards: Record<string, [StandardCard, StandardCard]>;
        communityCardQueue: StandardCard[];
        arcanaOverride: ArcanaCard | null;
      };
    }
  | {
      /** Demo3 only: wipe all arcana visual side-effects before cycling to next. */
      type: "RESET_ARCANA_EFFECTS";
      payload: {
        communityCards: StandardCard[];
        holeCards: Record<string, StandardCard[]>;
        /** Override stage — used to recover from arcanas that jump to showdown. */
        stage?: GameStage;
        /** Restore pot to pre-arcana value (Tower splits the pot). */
        potSize?: number;
        ruinsPot?: number;
      };
    };

// ─── Arcana value → effect key mapping ───────────────────────────────────────

export const ARCANA_EFFECT_KEYS: ArcanaEffectKey[] = [
  "fool-wildcard",          // 0
  "magician-redraw",        // 1
  "priestess-reveal",       // 2
  "empress-sixth-card",     // 3
  "emperor-highcard",       // 4
  "hierophant-no-pages",    // 5
  "lovers-split-pot",       // 6
  "chariot-pass-left",      // 7
  "strength-invert",        // 8
  "hermit-hole-only",       // 9
  "wheel-redeal",           // 10
  "justice-reveal",         // 11
  "hanged-man-extra-allin", // 12
  "death-end-now",          // 13
  "temperance-three-river", // 14
  "devil-double-raise",     // 15
  "tower-destroy-pot",      // 16
  "star-discard-draw",      // 17
  "moon-hide-community",    // 18
  "sun-split-all",          // 19
  "judgement-no-fold",      // 20
  "world-final-hand",       // 21
];
