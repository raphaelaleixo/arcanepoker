// src/tutorial/tutorialScript.ts
import type { StandardCard, ArcanaCard, GameStage } from "../types/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TutorialBotAction {
  playerId: string;
  stage: GameStage;
  action: "fold" | "check" | "call" | "bet" | "raise" | "all-in";
  amount?: number;
}

export type CardHighlight =
  | { type: "hole"; playerId: string; cardIndex: 0 | 1 }
  | { type: "community"; communityIndex: number };

export interface TutorialNarration {
  trigger: TutorialTrigger;
  title: string;
  body: string;
  highlightCards?: CardHighlight[];
}

/**
 * intro           — fires once at the start of Round 1 before any actions
 * hole-cards-page — fires after intro, once hero's scripted hole cards are set (contains Page)
 * arcana-pending  — fires when pendingInteraction.type === "arcana-reveal" appears
 * arcana-revealed — fires when activeArcana transitions from null to non-null
 * showdown        — fires when winnerIds becomes non-empty
 * page-bonus      — fires when pendingInteraction.type === "page-challenge" appears
 * round-end       — fires after page-bonus (or directly after showdown in no-page-bonus rounds)
 */
export type TutorialTrigger =
  | "intro"
  | "hole-cards-page"
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
// Teaching moment: Page→A→2→3→4 straight beats Swordsman's flush; Page winner bonus fires.

const ROUND_1: TutorialRound = {
  dealerIndex: 4,
  playerHoleCards: {
    hero: [
      { value: "0", suit: "hearts" },
      { value: "3", suit: "clubs" },
    ],
    "bot-swords": [
      { value: "K", suit: "spades" },
      { value: "7", suit: "spades" },
    ], // flush in spades → showdown
    "bot-cups": [
      { value: "7", suit: "diamonds" },
      { value: "9", suit: "clubs" },
    ], // folds on flop
    "bot-wands": [
      { value: "8", suit: "clubs" },
      { value: "J", suit: "spades" },
    ], // folds on turn
    "bot-pentacles": [
      { value: "6", suit: "diamonds" },
      { value: "5", suit: "diamonds" },
    ], // folds pre-flop
  },
  communityCardQueue: [
    { value: "A", suit: "spades" }, // flop 1
    { value: "2", suit: "spades" }, // flop 2
    { value: "4", suit: "spades" }, // flop 3 (A♠ K♠ 7♠ 4♠ 2♠ → flush for swords by the flop)
    { value: "8", suit: "hearts" }, // turn
    { value: "9", suit: "clubs" },  // river
  ],
  arcanaOverride: null,
  heroActions: {}, // all streets default to "call" (or "check" when currentBet=0)
  botActions: [
    // Pre-flop: Swordsman UTG raises; others react in rotation
    { playerId: "bot-swords", stage: "pre-flop", action: "raise", amount: 40 },
    { playerId: "bot-cups", stage: "pre-flop", action: "call" },
    { playerId: "bot-wands", stage: "pre-flop", action: "call" },
    { playerId: "bot-pentacles", stage: "pre-flop", action: "fold" },
    // Flop: Hero checks first (currentBet=0); then Swordsman bets; hero re-acts (call)
    { playerId: "bot-swords", stage: "flop", action: "bet", amount: 40 },
    { playerId: "bot-cups", stage: "flop", action: "fold" },
    { playerId: "bot-wands", stage: "flop", action: "call" },
    // Turn: Hero checks first; Swordsman bets; Wanderer folds; hero re-acts (call)
    { playerId: "bot-swords", stage: "turn", action: "bet", amount: 60 },
    { playerId: "bot-wands", stage: "turn", action: "fold" },
    // River: Hero checks first; Swordsman bets; hero re-acts (call)
    { playerId: "bot-swords", stage: "river", action: "bet", amount: 60 },
  ],
  narrations: [
    {
      trigger: "intro",
      title: "Welcome to Arcane Poker",
      body: "This is a guided tutorial. You'll play two scripted hands to learn the core mechanics: how the Page card works in straights, and how Arcana cards can flip the rules mid-game. Bots won't act until you dismiss each panel.",
    },
    {
      trigger: "hole-cards-page",
      title: "The Page Card (0)",
      body: "You've been dealt the Page of Hearts — value 0. Arcane Poker adds a Page to each suit, making 56 cards in total. Because there are now 14 cards per suit instead of 13, straights are harder to hit — so in this game, a straight beats a flush.",
      highlightCards: [{ type: "hole", playerId: "hero", cardIndex: 0 }],
    },
    {
      trigger: "showdown",
      title: "The Page in a Straight",
      body: "Your Page of Hearts connects before the Ace: Page → A → 2 → 3 → 4. That's a straight — and because straights beat flushes in Arcane Poker, it beats Swordsman's flush in spades.",
      highlightCards: [
        { type: "hole", playerId: "hero", cardIndex: 0 },
        { type: "hole", playerId: "hero", cardIndex: 1 },
        { type: "community", communityIndex: 0 },
        { type: "community", communityIndex: 1 },
        { type: "community", communityIndex: 2 },
      ],
    },
    {
      trigger: "page-bonus",
      title: "Page Winner Bonus",
      body: "Because you won with a Page in your hand, every other player pays you one big blind. This is the `Challenge of the Page.",
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
// Flop: Page♣ is the LAST flop card (index 2). The engine's fool-wildcard
//   replaces the last community card on trigger, so foolCardIndex=2 is correct.
// River: Hero checks first; Mystic bets; Merchant folds; hero raises (heroActions.river="raise");
//   Mystic re-calls after hero's raise.
// Teaching moment: Fool wildcard = K♣ → 10♣→J♣→Q♣→K♣→A♣ royal flush beats pair of Aces.

const ROUND_2: TutorialRound = {
  dealerIndex: 4,
  playerHoleCards: {
    hero: [
      { value: "10", suit: "clubs" },
      { value: "Q", suit: "clubs" },
    ],
    "bot-swords": [
      { value: "5", suit: "spades" },
      { value: "7", suit: "clubs" },
    ], // folds pre-flop
    "bot-cups": [
      { value: "A", suit: "hearts" },
      { value: "A", suit: "diamonds" },
    ], // pair of aces → showdown
    "bot-wands": [
      { value: "2", suit: "clubs" },
      { value: "8", suit: "diamonds" },
    ], // folds on turn
    "bot-pentacles": [
      { value: "4", suit: "diamonds" },
      { value: "9", suit: "hearts" },
    ], // folds on river
  },
  communityCardQueue: [
    { value: "6", suit: "hearts" }, // flop 1
    { value: "J", suit: "clubs" }, // flop 2
    { value: "0", suit: "clubs" }, // flop 3 — Page triggers arcana; Fool replaces index 2
    { value: "3", suit: "diamonds" }, // turn
    { value: "A", suit: "clubs" }, // river
  ],
  arcanaOverride: { suit: "arcana", value: "0" }, // The Fool
  heroActions: {
    river: "raise", // Hero raises on the river only; all other streets default to "call"
  },
  botActions: [
    // Pre-flop
    { playerId: "bot-swords", stage: "pre-flop", action: "fold" },
    { playerId: "bot-cups", stage: "pre-flop", action: "raise", amount: 40 },
    { playerId: "bot-wands", stage: "pre-flop", action: "call" },
    { playerId: "bot-pentacles", stage: "pre-flop", action: "call" },
    // Flop (Merchant first, Hero last)
    { playerId: "bot-pentacles", stage: "flop", action: "bet", amount: 20 },
    { playerId: "bot-cups", stage: "flop", action: "call" },
    { playerId: "bot-wands", stage: "flop", action: "call" },
    // Turn: post-flop order is hero(0)→pentacles(1)→cups(3)→wands(4)
    // Hero checks first; Pentacles bets; Cups calls; Wands folds; Hero re-acts (call)
    { playerId: "bot-pentacles", stage: "turn", action: "bet", amount: 40 },
    { playerId: "bot-cups", stage: "turn", action: "call" },
    { playerId: "bot-wands", stage: "turn", action: "fold" },
    // River: hero(0)→pentacles(1)→cups(3); Hero checks; Pentacles checks; Mystic bets;
    // Hero raises (heroActions.river="raise"); Pentacles folds; Mystic calls
    { playerId: "bot-pentacles", stage: "river", action: "check" },
    { playerId: "bot-cups", stage: "river", action: "bet", amount: 40 },
    { playerId: "bot-pentacles", stage: "river", action: "fold" },
    { playerId: "bot-cups", stage: "river", action: "call" }, // after hero raises
  ],
  narrations: [
    {
      trigger: "arcana-pending",
      title: "A Page Appears",
      body: "The Page of Clubs has appeared on the board. Whenever a Page lands on the community, the dealer draws a card from the Arcana deck — a separate 22-card deck of Major Arcana that can reshape the rules of the game.",
      highlightCards: [{ type: "community", communityIndex: 2 }],
    },
    {
      trigger: "arcana-revealed",
      title: "The Fool",
      body: "Each Arcana card carries a different effect — some change hand rankings, some flip the rules entirely. This time, The Fool has landed: it replaces the Page and acts as a wildcard, becoming whatever card value best completes each player's hand.",
      highlightCards: [{ type: "community", communityIndex: 2 }],
    },
    {
      trigger: "showdown",
      title: "The Fool as a King",
      body: "The Fool is a wildcard — it becomes whatever card best completes each player's hand. For you, it becomes a King, giving you 10 → J → Q → K → A — a royal flush. For Mystic, it becomes an Ace, completing four of a kind. A royal flush beats four of a kind.",
      highlightCards: [
        { type: "hole", playerId: "hero", cardIndex: 0 },
        { type: "hole", playerId: "hero", cardIndex: 1 },
        { type: "community", communityIndex: 1 },
        { type: "community", communityIndex: 2 },
        { type: "community", communityIndex: 4 },
      ],
    },
    {
      trigger: "round-end",
      title: "Tutorial Complete",
      body: "Those are the two mechanics that make Arcane Poker different: the Page card, which expands the deck and shifts hand rankings, and the Arcana deck, which can rewrite the rules mid-game.",
    },
  ],
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const TUTORIAL_ROUNDS: TutorialRound[] = [ROUND_1, ROUND_2];
