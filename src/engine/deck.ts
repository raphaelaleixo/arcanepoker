import type { StandardCard, ArcanaCard, StandardDeck } from "../types/types";
import type { Suit, StandardCardValue, ArcanaValue } from "../types/types";

const SUITS: Suit[] = ["hearts", "clubs", "diamonds", "spades"];

const STANDARD_VALUES: StandardCardValue[] = [
  "0", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
];

// ─── Standard 56-card deck ────────────────────────────────────────────────────

export function createStandardDeck(): StandardDeck {
  const deck: StandardCard[] = [];
  for (const suit of SUITS) {
    for (const value of STANDARD_VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

// ─── Major Arcana deck (22 cards, 0–21) ───────────────────────────────────────

export function createArcanaDeck(): ArcanaCard[] {
  return Array.from({ length: 22 }, (_, i) => ({
    suit: "arcana" as const,
    value: String(i) as ArcanaValue,
  }));
}

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds the Major Arcana draw pile per spec:
 *  1. The World (21) is removed and set aside.
 *  2. The remaining 21 cards are shuffled and split in half.
 *  3. The World is shuffled into the BOTTOM half.
 *  4. Top half (guaranteed no World) is placed on top.
 *
 * This ensures The World cannot appear until at least the second half of draws.
 */
export function setupArcanaDeck(): ArcanaCard[] {
  const all = createArcanaDeck();
  const world = all.find((c) => c.value === "21")!;
  const rest = shuffle(all.filter((c) => c.value !== "21")); // 21 cards

  const mid = Math.floor(rest.length / 2); // 10
  const topHalf = rest.slice(0, mid);       // first 10 — no World
  const bottomHalf = rest.slice(mid);       // last 11

  return [...topHalf, ...shuffle([...bottomHalf, world])];
}

/**
 * Deals `count` cards off the top of the deck.
 * Returns the dealt cards and the remaining deck.
 */
export function dealCards(
  deck: StandardDeck,
  count: number
): { dealt: StandardCard[]; remaining: StandardDeck } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}
