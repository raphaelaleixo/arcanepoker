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
}

export type GamePlayer = GameBot | HumanPlayer;

// ─── Per-hand result entry ────────────────────────────────────────────────────

export interface HandResultEntry {
  playerId: string;
  rankName: HandRankName;
  rankValue: number;
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
  arcanaTriggeredThisRound: boolean;
  /** Hierophant active: next arcana drawn is cancelled. */
  hierophantShield: boolean;

  // ── Session ──────────────────────────────────────────────────────────────────
  handNumber: number;
  isFinalHand: boolean;
  pendingInteraction: PendingInteraction | null;

  // ── Arcana-specific state ────────────────────────────────────────────────────
  empress6thCardDealt: boolean;
  moonExtraCards: Record<string, StandardCard>;
  temperanceCandidates: [StandardCard, StandardCard, StandardCard] | null;
  /** Each active player's chosen river card when Temperance is active. */
  temperanceChoices: Record<string, StandardCard>;
  /** Cards each player has chosen to reveal face-up (Priestess effect). */
  priestessRevealedCards: Record<string, StandardCard>;

  // ── Results ──────────────────────────────────────────────────────────────────
  winnerIds: string[];
  handResults: HandResultEntry[];
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
  | { type: "RESOLVE_STAR"; payload: { discard: boolean } }
  | { type: "RESOLVE_MOON"; payload: { swap: boolean } }
  | { type: "RESOLVE_MAGICIAN"; payload: { suit: string } }
  | { type: "RESOLVE_JUDGEMENT"; payload: { rejoin: boolean } }
  | { type: "REVEAL_ARCANA" }
  | { type: "RESOLVE_PAGE_CHALLENGE" }
  | { type: "NEXT_HAND" }
  | { type: "FORCE_ARCANA"; payload: { value: ArcanaValue } }
  | { type: "RESOLVE_PRIESTESS"; payload: { card: StandardCard } };

// ─── Arcana value → effect key mapping ───────────────────────────────────────

export const ARCANA_EFFECT_KEYS: ArcanaEffectKey[] = [
  "fool-wildcard",          // 0
  "magician-extra-card",    // 1
  "priestess-reveal",       // 2
  "empress-sixth-card",     // 3
  "emperor-kickers",        // 4
  "hierophant-persist",     // 5
  "lovers-split-pot",       // 6
  "chariot-pass-left",      // 7
  "strength-invert",        // 8
  "hermit-hole-only",       // 9
  "wheel-redeal",           // 10
  "justice-partial-bet",    // 11
  "hanged-man-extra-allin", // 12
  "death-end-now",          // 13
  "temperance-three-river", // 14
  "devil-double-raise",     // 15
  "tower-destroy-pot",      // 16
  "star-discard-draw",      // 17
  "moon-third-card",        // 18
  "sun-split-all",          // 19
  "judgement-rejoin",       // 20
  "world-final-hand",       // 21
];
