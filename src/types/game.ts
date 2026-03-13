// Arcane Poker — extended game types
// Imports primitives from types.ts; adds engine, AI, and Arcana-specific types.

import type { ArcanaCard, StandardCard } from "./types";

// ─── Suits as bot archetypes ────────────────────────────────────────────────

export type BotArchetype = "swords" | "cups" | "pentacles" | "wands";

/**
 * Personality matrix per archetype.
 * All values are 0–1 probabilities used by the AI decision function.
 *
 * Swords   – Tight-Aggressive
 * Cups     – Loose-Aggressive
 * Pentacles – Tight-Passive
 * Wands    – Loose-Passive
 */
export interface BotPersonality {
  archetype: BotArchetype;
  /** Probability of bluffing when hand is weak */
  bluffChance: number;
  /** Minimum hand rank (0–9) required to stay in without bluffing */
  tightnessThreshold: number;
  /** Multiplier on raise amounts (1 = standard pot-sized) */
  aggressionMultiplier: number;
  /** Probability of folding when facing a large raise */
  foldUnderPressure: number;
}

export const BOT_PERSONALITIES: Record<BotArchetype, BotPersonality> = {
  swords: {
    archetype: "swords",
    bluffChance: 0.25,
    tightnessThreshold: 3, // needs at least a pair
    aggressionMultiplier: 1.5,
    foldUnderPressure: 0.15,
  },
  cups: {
    archetype: "cups",
    bluffChance: 0.45,
    tightnessThreshold: 1, // plays almost any two cards
    aggressionMultiplier: 1.8,
    foldUnderPressure: 0.1,
  },
  pentacles: {
    archetype: "pentacles",
    bluffChance: 0.05,
    tightnessThreshold: 4, // needs at least two-pair
    aggressionMultiplier: 0.6,
    foldUnderPressure: 0.5,
  },
  wands: {
    archetype: "wands",
    bluffChance: 0.2,
    tightnessThreshold: 1,
    aggressionMultiplier: 0.7,
    foldUnderPressure: 0.35,
  },
};

// ─── Hand evaluation ─────────────────────────────────────────────────────────

export type HandRankName =
  | "high-card"
  | "pair"
  | "two-pair"
  | "three-of-a-kind"
  | "straight"
  | "flush"
  | "full-house"
  | "four-of-a-kind"
  | "straight-flush"
  | "royal-flush";

/** 0 = high-card … 9 = royal-flush (or inverted when Strength is active) */
export interface EvaluatedHand {
  rankName: HandRankName;
  /** 0–9 numeric rank, used for comparisons */
  rankValue: number;
  /**
   * Tiebreaker values, high-to-low.
   * Numeric card values after mapping: Page=0, 2-10 face value, J=11, Q=12, K=13, A=14
   * (or inverted when Strength is active: 2=14, A=1, Page stays 0)
   */
  kickers: number[];
  /** The 5 cards that form this hand */
  bestFive: StandardCard[];
}

// ─── Major Arcana state ───────────────────────────────────────────────────────

export type ArcanaEffectKey =
  | "fool-wildcard"         // 0  – The Fool acts as absolute wildcard
  | "magician-extra-card"   // 1  – players guess suit → draw extra hole card
  | "priestess-reveal"      // 2  – each player reveals one hole card
  | "empress-sixth-card"    // 3  – extra community card after river
  | "emperor-kickers"       // 4  – only J, Q, K, Page serve as tiebreaker kickers
  | "hierophant-persist"    // 5  – effect carries to next hand; cancels next arcana
  | "lovers-split-pot"      // 6  – pot split between two best hands
  | "chariot-pass-left"     // 7  – each active player passes one hole card left
  | "strength-invert"       // 8  – card values inverted (2 high, A low)
  | "hermit-hole-only"      // 9  – hands formed from hole cards only
  | "wheel-redeal"          // 10 – complete redeal
  | "justice-partial-bet"   // 11 – players can bet less than call amount
  | "hanged-man-extra-allin"// 12 – all-in player gets 3rd hole card
  | "death-end-now"         // 13 – round ends immediately
  | "temperance-three-river"// 14 – river reveals 3 cards; hero picks 1
  | "devil-double-raise"    // 15 – raises must be at least double current bet
  | "tower-destroy-pot"     // 16 – half the pot (rounded up) is removed
  | "star-discard-draw"     // 17 – each player may discard 1 hole card for a new one
  | "moon-third-card"       // 18 – players receive 3rd hole card; may swap at showdown
  | "sun-split-all"         // 19 – round ends; pot split equally among actives
  | "judgement-rejoin"      // 20 – folded players may pay 1 BB to rejoin
  | "world-final-hand";     // 21 – game's final hand announced

export interface ActiveArcana {
  card: ArcanaCard;
  effectKey: ArcanaEffectKey;
}

// ─── Arcana-related pending interactions ─────────────────────────────────────

/** Which user interaction the game is waiting for before it can proceed */
export type PendingInteraction =
  | { type: "arcana-reveal"; arcanaCard: ArcanaCard } // hero must click to reveal & apply arcana
  | { type: "page-challenge" }                        // winner(s) with a Page collect big blind from all others
  | { type: "chariot-pass"; playerId: string }        // hero picks a card to pass
  | { type: "temperance-pick"; playerId: string }     // hero picks 1 of 3 river cards (candidates in state)
  | { type: "star-discard"; playerId: string }         // hero decides whether to swap
  | { type: "moon-swap"; playerId: string }            // hero decides whether to swap 3rd card
  | { type: "magician-guess"; playerId: string }       // hero guesses a suit
  | { type: "judgement-return"; playerId: string }    // hero decides whether to rejoin
  | { type: "tarot-reading" };                         // first-win tarot modal

// ─── Extended game state ──────────────────────────────────────────────────────

export type BettingRound = "pre-flop" | "flop" | "turn" | "river";

export interface ArcaneGameState {
  // ── Arcana ────────────────────────────────────────────────────────────────
  /** The currently active Major Arcana card for this round (null if none) */
  activeArcana: ActiveArcana | null;
  /** Has an arcana already been triggered this round? (one per round limit) */
  arcanaTriggeredThisRound: boolean;
  /** Hierophant active: next drawn arcana is cancelled */
  hierophantShield: boolean;
  /** Full major arcana draw pile for this game session */
  arcanaDeck: ArcanaCard[];

  // ── Game session ──────────────────────────────────────────────────────────
  handNumber: number;
  bigBlind: number;
  smallBlind: number;
  /** Set true once the hero wins their first hand — triggers Tarot Reading modal */
  hasWonFirstHand: boolean;
  /** World card (21) was reached — this is the final hand */
  isFinalHand: boolean;

  // ── Pending UI interaction ────────────────────────────────────────────────
  pendingInteraction: PendingInteraction | null;

  // ── Empress: track if a 6th community card should be dealt ───────────────
  empress6thCardDealt: boolean;

  // ── Moon: track each player's optional 3rd hole card ────────────────────
  moonExtraCards: Record<string, StandardCard>;

  // ── Temperance: the three candidate river cards ──────────────────────────
  temperanceCandidates: [StandardCard, StandardCard, StandardCard] | null;
}

// ─── Tarot reading (LLM integration) ─────────────────────────────────────────

export interface TarotReadingRequest {
  heroHoleCards: StandardCard[];
  communityCards: StandardCard[];
  handRank: HandRankName;
  activeArcanaName: string | null;
}

export interface TarotReadingResponse {
  prophecy: string;
}

// ─── AI decision result ───────────────────────────────────────────────────────

export type AIDecision =
  | { action: "fold" }
  | { action: "check" }
  | { action: "call"; amount: number }
  | { action: "raise"; amount: number }
  | { action: "all-in"; amount: number };

// ─── Numeric card value mapping ───────────────────────────────────────────────
// Used by the hand evaluator; exported so tests can import it directly.

/** Normal order: Page=0, 2–10 face value, J=11, Q=12, K=13, A=14 */
export const CARD_NUMERIC_VALUES: Record<string, number> = {
  "0": 0,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

/** Strength (Arcana 8) inversion: 2=14, 3=13 … A=1, Page stays 0 */
export const CARD_NUMERIC_VALUES_INVERTED: Record<string, number> = {
  "0": 0,
  "2": 14,
  "3": 13,
  "4": 12,
  "5": 11,
  "6": 10,
  "7": 9,
  "8": 8,
  "9": 7,
  "10": 6,
  J: 5,
  Q: 4,
  K: 3,
  A: 1,
};

// ─── Arc‑effect helper: cards that are valid Emperor kickers ─────────────────
export const EMPEROR_KICKER_VALUES = new Set(["J", "Q", "K", "0"]);
