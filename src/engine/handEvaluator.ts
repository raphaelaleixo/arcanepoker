/**
 * Hand Evaluator — pure functions, no side effects.
 *
 * Special rules handled here:
 *  - Page (value "0") is the lowest card in isolation (numeric value 0).
 *  - In straights, Page connects BEFORE the Ace: Page-A-2-3-4 is valid.
 *  - Strength (Arcana 8): all card values are inverted (2 highest, A lowest, Page stays 0).
 *  - Emperor (Arcana 4): only J, Q, K, Page count as tiebreaker kickers.
 *  - Fool (Arcana 0): Page cards in the available set act as wildcards.
 */

import type { StandardCard } from "../types/types";
import type { EvaluatedHand, HandRankName } from "../types/game";
import {
  CARD_NUMERIC_VALUES,
  CARD_NUMERIC_VALUES_INVERTED,
  EMPEROR_KICKER_VALUES,
} from "../types/game";

// ─── Public options ───────────────────────────────────────────────────────────

export interface EvalOptions {
  /** Strength (Arcana 8): card values inverted */
  strengthActive: boolean;
  /** Emperor (Arcana 4): only face cards count as kickers */
  emperorActive: boolean;
  /** Fool (Arcana 0): Page cards are wildcards */
  foolActive: boolean;
}

export const DEFAULT_EVAL_OPTIONS: EvalOptions = {
  strengthActive: false,
  emperorActive: false,
  foolActive: false,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

const SUITS = ["hearts", "clubs", "diamonds", "spades"] as const;
const ALL_VALUES = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
] as const; // excludes Page ("0") — wildcards can become any of these

function numVal(card: StandardCard, inverted: boolean): number {
  return inverted
    ? CARD_NUMERIC_VALUES_INVERTED[card.value]
    : CARD_NUMERIC_VALUES[card.value];
}

/** All C(n, k) combinations of arr */
export function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map((c) => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function isFlush(cards: StandardCard[]): boolean {
  return cards.every((c) => c.suit === cards[0].suit);
}

/**
 * Detects a straight from a descending-sorted list of 5 numeric values.
 *
 * Special cases (both require the Ace, value 14, to act as a low card):
 *  - A-2-3-4-5  → sorted [14, 5, 4, 3, 2]  — standard ace-low wheel
 *  - Page-A-2-3-4 → sorted [14, 4, 3, 2, 0] — new lowest straight; Page sits below Ace
 *
 * Page-2-3-4-5 is NOT valid because Page only connects adjacent to the Ace.
 */
function isStraight(desc: number[]): boolean {
  // Standard consecutive (covers 2-3-4-5-6 through 10-J-Q-K-A)
  if (desc.every((v, i) => i === 0 || desc[i - 1] - v === 1)) return true;
  // Ace-low wheel: [14, 5, 4, 3, 2]
  if (desc[0] === 14 && desc[1] === 5 && desc[2] === 4 && desc[3] === 3 && desc[4] === 2)
    return true;
  // Page-Ace straight: [14, 4, 3, 2, 0]
  if (desc[0] === 14 && desc[1] === 4 && desc[2] === 3 && desc[3] === 2 && desc[4] === 0)
    return true;
  return false;
}

/**
 * "Top" value of a straight used for comparison between straights.
 *  - Page-A-2-3-4 → top 4 (lowest possible straight)
 *  - A-2-3-4-5    → top 5 (second-lowest; Ace acts as 1)
 *  - Everything else → the actual highest card
 */
function straightTop(desc: number[]): number {
  if (desc[0] === 14 && desc[4] === 0) return 4; // Page-Ace
  if (desc[0] === 14 && desc[1] === 5) return 5;  // Ace-low wheel
  return desc[0];
}

function isRoyalFlush(desc: number[]): boolean {
  return (
    desc[0] === 14 &&
    desc[1] === 13 &&
    desc[2] === 12 &&
    desc[3] === 11 &&
    desc[4] === 10
  );
}

// ─── Kicker builders ──────────────────────────────────────────────────────────

/** Ordered kickers from grouped cards (e.g. pair, trips, quads). */
function groupKickers(
  groups: StandardCard[][],
  inverted: boolean,
  emperorActive: boolean
): number[] {
  const kickers: number[] = [];
  for (const group of groups) {
    for (const card of group) {
      if (!emperorActive || EMPEROR_KICKER_VALUES.has(card.value)) {
        kickers.push(numVal(card, inverted));
      }
    }
  }
  return kickers;
}

/** Ordered kickers from a flat sorted card list (high card, flush). */
function cardKickers(
  sorted: StandardCard[],
  inverted: boolean,
  emperorActive: boolean
): number[] {
  const cards = emperorActive
    ? sorted.filter((c) => EMPEROR_KICKER_VALUES.has(c.value))
    : sorted;
  return cards.map((c) => numVal(c, inverted));
}

/**
 * When Ace is used as the low card in a straight (A-2-3-4-5 or Page-A-2-3-4),
 * return the effective numeric value to use for display/sorting purposes.
 * In all other contexts, Ace keeps its normal value (14 or inverted 1).
 */
function aceLowVal(card: StandardCard, desc: number[]): number {
  if (card.value !== "A") return -1; // sentinel: not an ace
  const isAceLowWheel = desc[0] === 14 && desc[1] === 5; // A-2-3-4-5
  const isPageAce     = desc[0] === 14 && desc[4] === 0; // Page-A-2-3-4
  return isAceLowWheel || isPageAce ? 1 : -1;
}

// ─── Evaluate exactly 5 cards ─────────────────────────────────────────────────

function evaluateFive(
  five: StandardCard[],
  inverted: boolean,
  emperorActive: boolean
): EvaluatedHand {
  const sorted = [...five].sort(
    (a, b) => numVal(b, inverted) - numVal(a, inverted)
  );
  const desc = sorted.map((c) => numVal(c, inverted));

  const flush = isFlush(five);
  const straight = isStraight(desc);

  // Group by numeric value, sorted by count desc then value desc
  const groupMap = new Map<number, StandardCard[]>();
  for (const card of sorted) {
    const v = numVal(card, inverted);
    const g = groupMap.get(v) ?? [];
    g.push(card);
    groupMap.set(v, g);
  }
  const groups = [...groupMap.values()].sort(
    (a, b) =>
      b.length - a.length || numVal(b[0], inverted) - numVal(a[0], inverted)
  );
  const counts = groups.map((g) => g.length);

  let rankName: HandRankName;
  let rankValue: number;
  let kickers: number[];

  if (flush && straight) {
    rankName = isRoyalFlush(desc) ? "royal-flush" : "straight-flush";
    rankValue = rankName === "royal-flush" ? 9 : 8;
    kickers = [straightTop(desc)];
  } else if (counts[0] === 4) {
    rankName = "four-of-a-kind";
    rankValue = 7;
    kickers = groupKickers(groups, inverted, emperorActive);
  } else if (counts[0] === 3 && counts[1] === 2) {
    rankName = "full-house";
    rankValue = 6;
    kickers = groupKickers(groups, inverted, emperorActive);
  } else if (flush) {
    rankName = "flush";
    rankValue = 5;
    kickers = cardKickers(sorted, inverted, emperorActive);
  } else if (straight) {
    rankName = "straight";
    rankValue = 4;
    kickers = [straightTop(desc)];
  } else if (counts[0] === 3) {
    rankName = "three-of-a-kind";
    rankValue = 3;
    kickers = groupKickers(groups, inverted, emperorActive);
  } else if (counts[0] === 2 && counts[1] === 2) {
    rankName = "two-pair";
    rankValue = 2;
    kickers = groupKickers(groups, inverted, emperorActive);
  } else if (counts[0] === 2) {
    rankName = "pair";
    rankValue = 1;
    kickers = groupKickers(groups, inverted, emperorActive);
  } else {
    rankName = "high-card";
    rankValue = 0;
    kickers = cardKickers(sorted, inverted, emperorActive);
  }

  // For ace-low straights, re-sort bestFive treating Ace as 1 so it appears last.
  let bestFive = sorted;
  if (
    (rankName === "straight" || rankName === "straight-flush") &&
    desc[0] === 14 &&
    (desc[4] === 0 || desc[1] === 5)
  ) {
    bestFive = [...sorted].sort((a, b) => {
      const av = aceLowVal(a, desc) !== -1 ? aceLowVal(a, desc) : numVal(a, inverted);
      const bv = aceLowVal(b, desc) !== -1 ? aceLowVal(b, desc) : numVal(b, inverted);
      return bv - av;
    });
  }

  return { rankName, rankValue, kickers, bestFive };
}

// ─── Best 5 from n cards ──────────────────────────────────────────────────────

function bestFromCombos(
  cards: StandardCard[],
  inverted: boolean,
  emperorActive: boolean
): EvaluatedHand {
  if (cards.length < 5) {
    // Fewer than 5 cards (e.g. Hermit with 2 hole cards): detect groups
    const sorted = [...cards].sort(
      (a, b) => numVal(b, inverted) - numVal(a, inverted)
    );
    const groupMap = new Map<number, StandardCard[]>();
    for (const card of sorted) {
      const v = numVal(card, inverted);
      const g = groupMap.get(v) ?? [];
      g.push(card);
      groupMap.set(v, g);
    }
    const groups = [...groupMap.values()].sort(
      (a, b) =>
        b.length - a.length || numVal(b[0], inverted) - numVal(a[0], inverted)
    );
    const counts = groups.map((g) => g.length);

    let rankName: HandRankName;
    let rankValue: number;
    let kickers: number[];

    if (counts[0] === 4) {
      rankName = "four-of-a-kind"; rankValue = 7;
      kickers = groupKickers(groups, inverted, emperorActive);
    } else if (counts[0] === 3 && counts[1] === 2) {
      rankName = "full-house"; rankValue = 6;
      kickers = groupKickers(groups, inverted, emperorActive);
    } else if (counts[0] === 3) {
      rankName = "three-of-a-kind"; rankValue = 3;
      kickers = groupKickers(groups, inverted, emperorActive);
    } else if (counts[0] === 2 && counts[1] === 2) {
      rankName = "two-pair"; rankValue = 2;
      kickers = groupKickers(groups, inverted, emperorActive);
    } else if (counts[0] === 2) {
      rankName = "pair"; rankValue = 1;
      kickers = groupKickers(groups, inverted, emperorActive);
    } else {
      rankName = "high-card"; rankValue = 0;
      kickers = cardKickers(sorted, inverted, emperorActive);
    }
    return { rankName, rankValue, kickers, bestFive: sorted };
  }

  let best: EvaluatedHand | null = null;
  for (const combo of combinations(cards, 5)) {
    const result = evaluateFive(combo, inverted, emperorActive);
    if (!best || compareHands(result, best) > 0) best = result;
  }
  return best!;
}

// ─── Fool wildcard evaluation ─────────────────────────────────────────────────

function evaluateWithFool(
  available: StandardCard[],
  inverted: boolean,
  emperorActive: boolean
): EvaluatedHand {
  const pages = available.filter((c) => c.value === "0");
  const nonPages = available.filter((c) => c.value !== "0");

  if (pages.length === 0) {
    return bestFromCombos(available, inverted, emperorActive);
  }

  // Build candidate substitution cards: all standard non-Page cards not already in play
  const inPlay = new Set(nonPages.map((c) => `${c.suit}-${c.value}`));
  const candidates: StandardCard[] = [];
  for (const suit of SUITS) {
    for (const value of ALL_VALUES) {
      if (!inPlay.has(`${suit}-${value}`)) {
        candidates.push({ suit, value });
      }
    }
  }

  let best: EvaluatedHand | null = null;

  function tryBest(substituted: StandardCard[]): void {
    const hand = [...nonPages, ...substituted];
    const result = bestFromCombos(hand, inverted, emperorActive);
    if (!best || compareHands(result, best) > 0) best = result;
  }

  if (pages.length === 1) {
    for (const c of candidates) tryBest([c]);
  } else {
    // 2+ wildcards: try all pairs from candidates (O ≈ 48² / 2 ≈ 1128)
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        tryBest([candidates[i], candidates[j]]);
      }
    }
  }

  return best!;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluates the best 5-card poker hand from the available cards,
 * respecting any active Major Arcana modifiers.
 *
 * @param available - Hole cards + community cards (or just hole cards for Hermit)
 * @param options   - Active arcana flags
 */
export function evaluateBestHand(
  available: StandardCard[],
  options: EvalOptions = DEFAULT_EVAL_OPTIONS
): EvaluatedHand {
  const { strengthActive, emperorActive, foolActive } = options;

  if (foolActive) {
    return evaluateWithFool(available, strengthActive, emperorActive);
  }

  return bestFromCombos(available, strengthActive, emperorActive);
}

/**
 * Compares two evaluated hands.
 * Returns: positive if a wins, negative if b wins, 0 if tie.
 */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const ak = a.kickers[i] ?? -1;
    const bk = b.kickers[i] ?? -1;
    if (ak !== bk) return ak - bk;
  }
  return 0;
}

/**
 * From a list of { playerId, hand } entries, returns the IDs of all winners
 * (there can be multiple in case of a true tie).
 */
export function findWinners(
  entries: { playerId: string; hand: EvaluatedHand }[]
): string[] {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => compareHands(b.hand, a.hand));
  const best = sorted[0].hand;
  return sorted
    .filter((e) => compareHands(e.hand, best) === 0)
    .map((e) => e.playerId);
}
