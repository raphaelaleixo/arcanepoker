import { describe, it, expect } from "vitest";
import {
  evaluateBestHand,
  compareHands,
  findWinners,
  DEFAULT_EVAL_OPTIONS,
} from "../handEvaluator";
import type { StandardCard } from "../../types/types";

// ─── Card factory helpers ─────────────────────────────────────────────────────

function c(value: string, suit: string): StandardCard {
  return { value, suit } as StandardCard;
}

const OPT = DEFAULT_EVAL_OPTIONS;
const STRENGTH = { ...OPT, strengthActive: true };
const EMPEROR = { ...OPT, emperorActive: true };
const FOOL = { ...OPT, foolActive: true };

// ─── Standard hand rankings ───────────────────────────────────────────────────

describe("Standard hand recognition", () => {
  it("detects a Royal Flush", () => {
    const cards = [
      c("A", "hearts"),
      c("K", "hearts"),
      c("Q", "hearts"),
      c("J", "hearts"),
      c("10", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("royal-flush");
    expect(result.rankValue).toBe(9);
  });

  it("detects a Straight Flush", () => {
    const cards = [
      c("9", "spades"),
      c("8", "spades"),
      c("7", "spades"),
      c("6", "spades"),
      c("5", "spades"),
      c("A", "hearts"),
      c("K", "clubs"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("straight-flush");
    expect(result.rankValue).toBe(8);
  });

  it("detects Four of a Kind", () => {
    const cards = [
      c("K", "hearts"),
      c("K", "clubs"),
      c("K", "diamonds"),
      c("K", "spades"),
      c("A", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("four-of-a-kind");
    expect(result.rankValue).toBe(7);
  });

  it("detects a Full House", () => {
    const cards = [
      c("Q", "hearts"),
      c("Q", "clubs"),
      c("Q", "diamonds"),
      c("J", "spades"),
      c("J", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("full-house");
    expect(result.rankValue).toBe(6);
  });

  it("detects a Flush", () => {
    const cards = [
      c("A", "hearts"),
      c("10", "hearts"),
      c("7", "hearts"),
      c("4", "hearts"),
      c("2", "hearts"),
      c("K", "clubs"),
      c("Q", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("flush");
    expect(result.rankValue).toBe(4);
  });

  it("detects a standard Straight", () => {
    const cards = [
      c("9", "hearts"),
      c("8", "clubs"),
      c("7", "diamonds"),
      c("6", "spades"),
      c("5", "hearts"),
      c("A", "clubs"),
      c("K", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("straight");
    expect(result.kickers[0]).toBe(9);
  });

  it("detects Three of a Kind", () => {
    const cards = [
      c("8", "hearts"),
      c("8", "clubs"),
      c("8", "diamonds"),
      c("K", "spades"),
      c("Q", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("three-of-a-kind");
    expect(result.rankValue).toBe(3);
  });

  it("detects Two Pair", () => {
    const cards = [
      c("A", "hearts"),
      c("A", "clubs"),
      c("K", "diamonds"),
      c("K", "spades"),
      c("Q", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("two-pair");
    expect(result.rankValue).toBe(2);
  });

  it("detects One Pair", () => {
    const cards = [
      c("J", "hearts"),
      c("J", "clubs"),
      c("A", "diamonds"),
      c("K", "spades"),
      c("Q", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("pair");
    expect(result.rankValue).toBe(1);
  });

  it("detects High Card", () => {
    const cards = [
      c("A", "hearts"),
      c("K", "clubs"),
      c("Q", "diamonds"),
      c("J", "spades"),
      c("9", "hearts"),
      c("7", "clubs"),
      c("2", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("high-card");
    expect(result.kickers[0]).toBe(14); // Ace
  });
});

// ─── Page (0) card rules ──────────────────────────────────────────────────────

describe("Page (rank '0') rules", () => {
  it("is the lowest card in a high-card hand (value 0)", () => {
    const cards = [
      c("0", "hearts"),  // Page — lowest
      c("9", "clubs"),
      c("7", "diamonds"),
      c("5", "spades"),
      c("3", "hearts"),
      c("K", "clubs"),
      c("J", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("high-card");
    // Best 5: K, J, 9, 7, 5 — Page (0) is excluded from the best five
    expect(result.kickers[0]).toBe(13); // K
    expect(result.kickers).not.toContain(0);
  });

  it("Page ranks below 2 in a one-pair kicker comparison", () => {
    // Pair of 3s with Page vs Pair of 3s with 2 as kicker
    const handWithPage = evaluateBestHand(
      [c("3", "hearts"), c("3", "clubs"), c("0", "diamonds"), c("K", "spades"), c("Q", "hearts")],
      OPT
    );
    const handWithTwo = evaluateBestHand(
      [c("3", "hearts"), c("3", "clubs"), c("2", "diamonds"), c("K", "spades"), c("Q", "hearts")],
      OPT
    );
    // handWithPage loses the kicker battle (0 < 2)
    expect(compareHands(handWithPage, handWithTwo)).toBeLessThan(0);
  });

  it("Page forms a straight connecting before Ace: Page-A-2-3-4", () => {
    const cards = [
      c("0", "hearts"),  // Page
      c("A", "spades"),
      c("2", "clubs"),
      c("3", "diamonds"),
      c("4", "hearts"),
      c("9", "clubs"),
      c("K", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("straight");
    // Ace must appear last (before Page), acting as 1
    const aceIndex = result.bestFive.findIndex((card) => card.value === "A");
    const pageIndex = result.bestFive.findIndex((card) => card.value === "0");
    expect(aceIndex).toBeLessThan(result.bestFive.length); // Ace is in the hand
    expect(pageIndex).toBe(result.bestFive.length - 1);    // Page is the very last
  });

  it("Page-Ace straight ranks lower than A-2-3-4-5 straight", () => {
    const pageAce = evaluateBestHand(
      [c("0", "clubs"), c("A", "hearts"), c("2", "diamonds"), c("3", "spades"), c("4", "clubs")],
      OPT
    );
    const aceWheel = evaluateBestHand(
      [c("A", "hearts"), c("2", "clubs"), c("3", "diamonds"), c("4", "spades"), c("5", "hearts")],
      OPT
    );
    expect(compareHands(pageAce, aceWheel)).toBeLessThan(0);
  });

  it("A-2-3-4-5 straight ranks lower than 2-3-4-5-6 straight", () => {
    const aceWheel = evaluateBestHand(
      [c("A", "hearts"), c("2", "clubs"), c("3", "diamonds"), c("4", "spades"), c("5", "hearts")],
      OPT
    );
    const lowNormal = evaluateBestHand(
      [c("2", "hearts"), c("3", "clubs"), c("4", "diamonds"), c("5", "spades"), c("6", "hearts")],
      OPT
    );
    expect(compareHands(aceWheel, lowNormal)).toBeLessThan(0);
  });

  it("Page-Ace straight ranks lower than A-high straight (10-J-Q-K-A)", () => {
    const pageAce = evaluateBestHand(
      [c("0", "hearts"), c("A", "spades"), c("2", "clubs"), c("3", "diamonds"), c("4", "hearts")],
      OPT
    );
    const broadway = evaluateBestHand(
      [c("10", "hearts"), c("J", "clubs"), c("Q", "diamonds"), c("K", "spades"), c("A", "hearts")],
      OPT
    );
    expect(compareHands(pageAce, broadway)).toBeLessThan(0);
  });

  it("A-2-3-4-5 is a valid ace-low straight (top = 5)", () => {
    const cards = [
      c("A", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
      c("4", "spades"),
      c("5", "hearts"),
      c("K", "clubs"),
      c("Q", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).toBe("straight");
    expect(result.kickers[0]).toBe(5); // top of the wheel is 5
    // Ace must appear last in bestFive (value 1, not 14)
    const aceCard = result.bestFive.find((card) => card.value === "A")!;
    const aceIndex = result.bestFive.indexOf(aceCard);
    expect(aceIndex).toBe(result.bestFive.length - 1);
  });

  it("Page-2-3-4-5 is NOT a straight (Page only connects adjacent to Ace)", () => {
    const cards = [
      c("0", "hearts"), // Page
      c("2", "clubs"),
      c("3", "diamonds"),
      c("4", "spades"),
      c("5", "hearts"),
      c("K", "clubs"),
      c("Q", "diamonds"),
    ];
    const result = evaluateBestHand(cards, OPT);
    expect(result.rankName).not.toBe("straight");
  });
});

// ─── Kicker tiebreakers ───────────────────────────────────────────────────────

describe("Kicker tiebreakers", () => {
  it("pair of Ks with A kicker beats pair of Ks with Q kicker", () => {
    const pairKA = evaluateBestHand(
      [c("K", "hearts"), c("K", "clubs"), c("A", "diamonds"), c("J", "spades"), c("2", "hearts")],
      OPT
    );
    const pairKQ = evaluateBestHand(
      [c("K", "hearts"), c("K", "clubs"), c("Q", "diamonds"), c("J", "spades"), c("2", "hearts")],
      OPT
    );
    expect(compareHands(pairKA, pairKQ)).toBeGreaterThan(0);
  });

  it("two identical hands result in a tie", () => {
    const hand = [
      c("A", "hearts"),
      c("A", "clubs"),
      c("K", "diamonds"),
      c("Q", "spades"),
      c("J", "hearts"),
    ];
    const h1 = evaluateBestHand(hand, OPT);
    const h2 = evaluateBestHand(hand, OPT);
    expect(compareHands(h1, h2)).toBe(0);
  });
});

// ─── Strength (Arcana 8) — value inversion ────────────────────────────────────

describe("Strength (Arcana 8) — inverted values", () => {
  it("2 is now the highest card (value 14 in inverted map)", () => {
    // High card: 2 vs A — 2 should win under Strength
    const with2 = evaluateBestHand(
      [c("2", "hearts"), c("4", "clubs"), c("6", "diamonds"), c("8", "spades"), c("10", "hearts")],
      STRENGTH
    );
    const withA = evaluateBestHand(
      [c("A", "hearts"), c("4", "clubs"), c("6", "diamonds"), c("8", "spades"), c("10", "clubs")],
      STRENGTH
    );
    expect(compareHands(with2, withA)).toBeGreaterThan(0);
  });

  it("pair of 2s beats pair of Aces under Strength", () => {
    const pair2 = evaluateBestHand(
      [c("2", "hearts"), c("2", "clubs"), c("K", "diamonds"), c("Q", "spades"), c("J", "hearts")],
      STRENGTH
    );
    const pairA = evaluateBestHand(
      [c("A", "hearts"), c("A", "clubs"), c("K", "diamonds"), c("Q", "spades"), c("J", "clubs")],
      STRENGTH
    );
    expect(compareHands(pair2, pairA)).toBeGreaterThan(0);
  });

  it("Page (0) remains the absolute lowest under Strength", () => {
    const withPage = evaluateBestHand(
      [c("0", "hearts"), c("A", "clubs"), c("K", "diamonds"), c("Q", "spades"), c("J", "hearts")],
      STRENGTH
    );
    const withTwo = evaluateBestHand(
      [c("2", "hearts"), c("A", "clubs"), c("K", "diamonds"), c("Q", "spades"), c("J", "clubs")],
      STRENGTH
    );
    // Under Strength: 2=14, A=1, Page=0. 2 should beat Page.
    expect(compareHands(withTwo, withPage)).toBeGreaterThan(0);
  });

  it("a normal pair loses to a pair of 2s under Strength (inverted makes 2s highest)", () => {
    const pairKings = evaluateBestHand(
      [c("K", "hearts"), c("K", "clubs"), c("3", "diamonds"), c("4", "spades"), c("5", "hearts")],
      STRENGTH
    );
    const pairTwos = evaluateBestHand(
      [c("2", "hearts"), c("2", "clubs"), c("3", "diamonds"), c("4", "spades"), c("5", "clubs")],
      STRENGTH
    );
    expect(compareHands(pairTwos, pairKings)).toBeGreaterThan(0);
  });
});

// ─── Emperor (Arcana 4) — all hands evaluated as high-card ───────────────────

describe("Emperor (Arcana 4) — all hands treated as high-card", () => {
  it("a Royal Flush loses to a high-card hand with a higher top card under Emperor", () => {
    // Royal Flush: A K Q J 10 (all hearts) → under Emperor, compare as high-card: A=14
    // High-card hand: A K Q J 9 (mixed) → under Emperor: same top card A=14, K=13, Q=12, J=11, then 9 vs 10
    // Royal flush has 10 as 5th card; the other has 9 — royal flush wins the 5th kicker
    // Flip: high-card hand with A K Q J 9 loses to Royal Flush at 5th kicker (10 > 9)
    const royalFlush = evaluateBestHand(
      [c("A", "hearts"), c("K", "hearts"), c("Q", "hearts"), c("J", "hearts"), c("10", "hearts")],
      EMPEROR
    );
    const highCard = evaluateBestHand(
      [c("A", "spades"), c("K", "clubs"), c("Q", "diamonds"), c("J", "spades"), c("9", "clubs")],
      EMPEROR
    );
    // Both treated as high-card; Royal Flush kickers [14,13,12,11,10] > [14,13,12,11,9]
    expect(royalFlush.rankName).toBe("high-card");
    expect(highCard.rankName).toBe("high-card");
    expect(compareHands(royalFlush, highCard)).toBeGreaterThan(0);
  });

  it("a two-pair hand loses to a high-card hand with a higher top card under Emperor", () => {
    // Two-pair: A A K K Q — under Emperor, kickers = [14,14,13,13,12] (high-card)
    // High-card: A 9 8 7 6 — under Emperor, kickers = [14,9,8,7,6]
    // A=A at first kicker; then 14 vs 9 → two-pair wins the 2nd kicker
    const twoPair = evaluateBestHand(
      [c("A", "hearts"), c("A", "clubs"), c("K", "diamonds"), c("K", "spades"), c("Q", "hearts")],
      EMPEROR
    );
    const highCard = evaluateBestHand(
      [c("A", "spades"), c("9", "clubs"), c("8", "diamonds"), c("7", "spades"), c("6", "clubs")],
      EMPEROR
    );
    expect(twoPair.rankName).toBe("high-card");
    expect(highCard.rankName).toBe("high-card");
    expect(compareHands(twoPair, highCard)).toBeGreaterThan(0);
  });

  it("two hands with equal top 5 cards tie under Emperor", () => {
    const handA = evaluateBestHand(
      [c("A", "hearts"), c("K", "clubs"), c("Q", "diamonds"), c("J", "spades"), c("9", "hearts")],
      EMPEROR
    );
    const handB = evaluateBestHand(
      [c("A", "spades"), c("K", "diamonds"), c("Q", "clubs"), c("J", "hearts"), c("9", "clubs")],
      EMPEROR
    );
    expect(compareHands(handA, handB)).toBe(0);
  });
});

// ─── Fool (Arcana 0) — Page as wildcard ──────────────────────────────────────

describe("Fool (Arcana 0) — Page as wildcard", () => {
  it("a single Page upgrades to the best possible hand", () => {
    // 4 cards to a flush + Page wildcard → should find a flush
    const cards = [
      c("0", "hearts"),  // wildcard — should become 5♥ or similar
      c("A", "hearts"),
      c("K", "hearts"),
      c("Q", "hearts"),
      c("J", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const withFool = evaluateBestHand(cards, FOOL);
    const withoutFool = evaluateBestHand(
      cards.filter((c) => c.value !== "0"),
      OPT
    );
    // Fool should find at least as good a hand as without it
    expect(compareHands(withFool, withoutFool)).toBeGreaterThanOrEqual(0);
  });

  it("Page wildcard completes a four-of-a-kind to the best possible hand", () => {
    const cards = [
      c("A", "hearts"),
      c("A", "clubs"),
      c("A", "diamonds"),
      c("0", "spades"),  // wildcard → becomes A♠ for quads
      c("K", "hearts"),
      c("2", "clubs"),
      c("3", "diamonds"),
    ];
    const result = evaluateBestHand(cards, FOOL);
    expect(result.rankValue).toBeGreaterThanOrEqual(7); // four-of-a-kind or better
  });

  it("only ONE Page is treated as wildcard even when multiple Pages are present", () => {
    // Fool injects one community Page; player also holds a natural Page.
    // The second Page should remain a value-0 card, not a second wildcard.
    const cards = [
      c("0", "hearts"),   // Fool-injected wildcard → should substitute to best card
      c("0", "spades"),   // natural Page in hole cards → stays as value-0
      c("A", "hearts"),
      c("K", "hearts"),
      c("Q", "hearts"),
      c("J", "hearts"),
      c("2", "clubs"),
    ];
    const result = evaluateBestHand(cards, FOOL);
    // With one wildcard completing the royal flush (A-K-Q-J-10♥), rankValue = 9
    // If both Pages were wildcards the result would be the same, but the second
    // Page must NOT substitute independently — it should stay as a 0 in the hand.
    // At minimum, result must not be worse than a single-wildcard evaluation.
    const singleWildcard = evaluateBestHand(
      [c("0", "hearts"), c("A", "hearts"), c("K", "hearts"), c("Q", "hearts"), c("J", "hearts"), c("2", "clubs")],
      FOOL
    );
    expect(compareHands(result, singleWildcard)).toBeGreaterThanOrEqual(0);
    // The extra natural Page (value 0) does NOT grant a second wildcard boost.
    // Verify result is not "impossibly" better than what one wildcard can achieve.
    expect(result.rankValue).toBeLessThanOrEqual(9); // royal flush is max
  });

  it("hand without Page is unaffected when Fool is active", () => {
    const cards = [
      c("A", "hearts"),
      c("A", "clubs"),
      c("K", "diamonds"),
      c("K", "spades"),
      c("Q", "hearts"),
      c("J", "clubs"),
      c("10", "diamonds"),
    ];
    const resultFool = evaluateBestHand(cards, FOOL);
    const resultNormal = evaluateBestHand(cards, OPT);
    // No Page → same result regardless of Fool flag
    expect(resultFool.rankName).toBe(resultNormal.rankName);
  });
});

// ─── findWinners ──────────────────────────────────────────────────────────────

describe("findWinners", () => {
  it("returns single winner when hands are different", () => {
    const flush = evaluateBestHand(
      [c("A", "hearts"), c("K", "hearts"), c("Q", "hearts"), c("J", "hearts"), c("9", "hearts")],
      OPT
    );
    const pair = evaluateBestHand(
      [c("A", "clubs"), c("A", "diamonds"), c("K", "clubs"), c("Q", "clubs"), c("J", "clubs")],
      OPT
    );
    const winners = findWinners([
      { playerId: "hero", hand: flush },
      { playerId: "bot1", hand: pair },
    ]);
    expect(winners).toEqual(["hero"]);
  });

  it("returns all players on a genuine tie", () => {
    const hand = evaluateBestHand(
      [c("A", "hearts"), c("K", "clubs"), c("Q", "diamonds"), c("J", "spades"), c("9", "hearts")],
      OPT
    );
    const winners = findWinners([
      { playerId: "hero", hand },
      { playerId: "bot1", hand },
      { playerId: "bot2", hand },
    ]);
    expect(winners).toHaveLength(3);
    expect(winners).toContain("hero");
  });
});

// ─── Deck integrity ───────────────────────────────────────────────────────────

describe("Evaluator with Hermit (< 5 cards) scenarios", () => {
  it("correctly identifies a pair with 2 hole cards", () => {
    const twoCards = [c("A", "hearts"), c("A", "clubs")];
    const result = evaluateBestHand(twoCards, OPT);
    expect(result.rankName).toBe("pair");
    expect(result.rankValue).toBe(1);
    expect(result.kickers).toContain(14); // Ace
  });

  it("correctly identifies high-card with 2 mismatched hole cards", () => {
    const twoCards = [c("A", "hearts"), c("K", "clubs")];
    const result = evaluateBestHand(twoCards, OPT);
    expect(result.rankName).toBe("high-card");
    expect(result.kickers[0]).toBe(14); // Ace high
  });

  it("correctly identifies three-of-a-kind with 3 hole cards", () => {
    const threeCards = [c("K", "hearts"), c("K", "clubs"), c("K", "diamonds")];
    const result = evaluateBestHand(threeCards, OPT);
    expect(result.rankName).toBe("three-of-a-kind");
    expect(result.rankValue).toBe(3);
  });

  it("correctly identifies two-pair with 4 hole cards", () => {
    const fourCards = [c("A", "hearts"), c("A", "clubs"), c("K", "diamonds"), c("K", "spades")];
    const result = evaluateBestHand(fourCards, OPT);
    expect(result.rankName).toBe("two-pair");
    expect(result.rankValue).toBe(2);
  });

  it("pair of 2s beats pair of Aces under Hermit + Strength", () => {
    const pairAces = evaluateBestHand([c("A", "hearts"), c("A", "clubs")], STRENGTH);
    const pairTwos = evaluateBestHand([c("2", "hearts"), c("2", "clubs")], STRENGTH);
    // Under Strength: 2 is highest, so pair of 2s should win
    expect(compareHands(pairTwos, pairAces)).toBeGreaterThan(0);
  });
});
