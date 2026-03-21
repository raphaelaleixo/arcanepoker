// src/tutorial/tutorialScript.ts
import type { StandardCard, ArcanaCard, GameStage } from "../types/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TutorialBotAction {
  playerId: string;
  stage: GameStage;
  action: "fold" | "check" | "call" | "bet" | "raise" | "all-in";
  amount?: number;
}

export interface TutorialNarration {
  trigger: TutorialTrigger;
  title: string;
  body: string;
}

/**
 * arcana-pending  — fires when pendingInteraction.type === "arcana-reveal" appears
 * arcana-revealed — fires when activeArcana transitions from null to non-null
 * showdown        — fires when winnerIds becomes non-empty
 * page-bonus      — fires when pendingInteraction.type === "page-challenge" appears
 * round-end       — fires after page-bonus (or directly after showdown in no-page-bonus rounds)
 */
export type TutorialTrigger =
  | "arcana-pending"
  | "arcana-revealed"
  | "showdown"
  | "page-bonus"
  | "round-end";

export interface TutorialRound {
  dealerIndex: number;
  playerHoleCards: Record<string, [StandardCard, StandardCard]>;
  communityCardQueue: StandardCard[];
  arcanaOverride: ArcanaCard | null;
  /**
   * Per-stage override for the hero's scripted action when currentBet > 0.
   * Stages absent from this map default to "call".
   * When currentBet === 0 on hero's turn, hero always checks regardless of this map.
   * Note: hero's scripted action must never be "all-in" (see ActionButtons constraint).
   */
  heroActions: Partial<Record<GameStage, "call" | "raise">>;
  /** Ordered queue of bot actions consumed in sequence as bots become active. */
  botActions: TutorialBotAction[];
  narrations: TutorialNarration[];
}

// ─── Round 1 ──────────────────────────────────────────────────────────────────
//
// dealerIndex=4 (Wanderer BTN): SB=Hero(0), BB=Merchant(1), UTG=Swordsman(2)
//
// Pre-flop action order: Swordsman(UTG) → Mystic → Wanderer → Hero(SB) → Merchant(BB)
// Post-flop order (Merchant folded pre-flop, Hero acts LAST as BTN caller):
//   firstActiveAfter(4) with Merchant folded = Swordsman(2)
//   Order: Swordsman → Mystic → Wanderer → Hero
//
// Hero post-flop: checks when no bet is present, calls after a bot bets.
// Teaching moment: Page→A→2→3→4 straight beats pair of Kings; Page winner bonus fires.

const ROUND_1: TutorialRound = {
  dealerIndex: 4,
  playerHoleCards: {
    hero:           [{ value: "0", suit: "hearts"   }, { value: "3",  suit: "clubs"    }],
    "bot-swords":   [{ value: "K", suit: "spades"   }, { value: "K",  suit: "clubs"    }], // pair of kings → showdown
    "bot-cups":     [{ value: "7", suit: "diamonds" }, { value: "9",  suit: "clubs"    }], // folds on flop
    "bot-wands":    [{ value: "8", suit: "clubs"    }, { value: "J",  suit: "spades"   }], // folds on turn
    "bot-pentacles":[{ value: "2", suit: "spades"   }, { value: "5",  suit: "diamonds" }], // folds pre-flop
  },
  communityCardQueue: [
    { value: "A", suit: "spades"   }, // flop 1
    { value: "2", suit: "diamonds" }, // flop 2
    { value: "4", suit: "clubs"    }, // flop 3
    { value: "K", suit: "diamonds" }, // turn
    { value: "9", suit: "spades"   }, // river
  ],
  arcanaOverride: null,
  heroActions: {}, // all streets default to "call" (or "check" when currentBet=0)
  botActions: [
    // Pre-flop: Swordsman UTG raises; others react in rotation
    { playerId: "bot-swords",    stage: "pre-flop", action: "raise",  amount: 40 },
    { playerId: "bot-cups",      stage: "pre-flop", action: "call" },
    { playerId: "bot-wands",     stage: "pre-flop", action: "call" },
    { playerId: "bot-pentacles", stage: "pre-flop", action: "fold" },
    // Flop: Hero checks first (currentBet=0); then Swordsman bets; hero re-acts (call)
    { playerId: "bot-swords",    stage: "flop",     action: "bet",    amount: 40 },
    { playerId: "bot-cups",      stage: "flop",     action: "fold" },
    { playerId: "bot-wands",     stage: "flop",     action: "call" },
    // Turn: Hero checks first; Swordsman bets; Wanderer folds; hero re-acts (call)
    { playerId: "bot-swords",    stage: "turn",     action: "bet",    amount: 60 },
    { playerId: "bot-wands",     stage: "turn",     action: "fold" },
    // River: Hero checks first; Swordsman all-in; hero re-acts (call)
    { playerId: "bot-swords",    stage: "river",    action: "all-in" },
  ],
  narrations: [
    {
      trigger: "showdown",
      title: "The Page in a Straight",
      body: "Your Page of Hearts connects before the Ace: Page → A → 2 → 3 → 4. This is a valid straight — and it beats Swordsman's pair of Kings.",
    },
    {
      trigger: "page-bonus",
      title: "Page Winner Bonus",
      body: "Because you won with a Page in your hand, every other player pays you one big blind. This is the Page bonus.",
    },
    {
      trigger: "round-end",
      title: "Round 1 Complete",
      body: "You've seen how the Page fits into a straight and how a normal round without Arcana works. Round 2 will show what happens when a Page appears on the board.",
    },
  ],
};

// ─── Round 2 ──────────────────────────────────────────────────────────────────
//
// dealerIndex=4 (Wanderer BTN): SB=Hero(0), BB=Merchant(1), UTG=Swordsman(2)
//
// Pre-flop: Swordsman(UTG) folds immediately; Mystic raises; Wanderer, Hero, Merchant call.
// Post-flop (Swordsman folded): firstActiveAfter(4) = Merchant(1)
//   Order: Merchant → Mystic → Wanderer → Hero (last)
//
// Flop: Page♠ is the LAST flop card (index 2). The engine's fool-wildcard
//   replaces the last community card on trigger, so foolCardIndex=2 is correct.
// River: Hero checks first; Mystic bets; Merchant folds; hero raises (heroActions.river="raise");
//   Mystic re-calls after hero's raise.
// Teaching moment: Fool wildcard = King → 10→J→Q→K→A royal flush beats pair of Aces.

const ROUND_2: TutorialRound = {
  dealerIndex: 4,
  playerHoleCards: {
    hero:           [{ value: "10", suit: "clubs"    }, { value: "Q",  suit: "spades"   }],
    "bot-swords":   [{ value: "5",  suit: "spades"   }, { value: "7",  suit: "clubs"    }], // folds pre-flop
    "bot-cups":     [{ value: "A",  suit: "hearts"   }, { value: "A",  suit: "diamonds" }], // pair of aces → showdown
    "bot-wands":    [{ value: "2",  suit: "clubs"    }, { value: "8",  suit: "diamonds" }], // folds on turn
    "bot-pentacles":[{ value: "4",  suit: "diamonds" }, { value: "9",  suit: "hearts"   }], // folds on river
  },
  communityCardQueue: [
    { value: "6", suit: "hearts"   }, // flop 1
    { value: "J", suit: "diamonds" }, // flop 2
    { value: "0", suit: "spades"   }, // flop 3 — Page triggers arcana; Fool replaces index 2
    { value: "3", suit: "diamonds" }, // turn
    { value: "A", suit: "clubs"    }, // river
  ],
  arcanaOverride: { suit: "arcana", value: "0" }, // The Fool
  heroActions: {
    river: "raise", // Hero raises on the river only; all other streets default to "call"
  },
  botActions: [
    // Pre-flop
    { playerId: "bot-swords",    stage: "pre-flop", action: "fold" },
    { playerId: "bot-cups",      stage: "pre-flop", action: "raise",  amount: 40 },
    { playerId: "bot-wands",     stage: "pre-flop", action: "call" },
    { playerId: "bot-pentacles", stage: "pre-flop", action: "call" },
    // Flop (Merchant first, Hero last)
    { playerId: "bot-pentacles", stage: "flop",     action: "bet",    amount: 20 },
    { playerId: "bot-cups",      stage: "flop",     action: "call" },
    { playerId: "bot-wands",     stage: "flop",     action: "call" },
    // Turn
    { playerId: "bot-pentacles", stage: "turn",     action: "bet",    amount: 40 },
    { playerId: "bot-wands",     stage: "turn",     action: "fold" },
    { playerId: "bot-cups",      stage: "turn",     action: "call" },
    // River: Hero checks first; Mystic bets; Merchant folds; hero raises; Mystic re-calls
    { playerId: "bot-cups",      stage: "river",    action: "bet",    amount: 40 },
    { playerId: "bot-pentacles", stage: "river",    action: "fold" },
    { playerId: "bot-cups",      stage: "river",    action: "call" }, // after hero raises
  ],
  narrations: [
    {
      trigger: "arcana-pending",
      title: "A Page Appears",
      body: "The Page of Spades has appeared on the board. This triggers the Arcana deck — the dealer draws a card.",
    },
    {
      trigger: "arcana-revealed",
      title: "The Fool",
      body: "The Fool replaces the Page in the flop. It acts as a wildcard — it becomes whatever card value completes the best possible hand.",
    },
    {
      trigger: "showdown",
      title: "The Fool as a King",
      body: "The Fool becomes a King, giving you 10 → J → Q → K → A — a royal flush. This beats Mystic's pair of Aces.",
    },
    {
      trigger: "round-end",
      title: "Tutorial Complete",
      body: "You've now seen both core mechanics: the Page card's power in straights, and how the Arcana deck changes the game. You're ready to play.",
    },
  ],
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const TUTORIAL_ROUNDS: TutorialRound[] = [ROUND_1, ROUND_2];
