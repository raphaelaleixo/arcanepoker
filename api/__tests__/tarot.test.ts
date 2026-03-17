import { describe, it, expect } from "vitest";
import { buildPrompt } from "../tarot";
import type { TarotReadingRequest } from "../../src/types/game";

// Full 7-card request: 2 hole cards + 5 community
function makeRequest(overrides: Partial<TarotReadingRequest> = {}): TarotReadingRequest {
  return {
    heroHoleCards: [
      { value: "K", suit: "spades" },
      { value: "7", suit: "hearts" },
    ],
    communityCards: [
      { value: "A", suit: "diamonds" },
      { value: "10", suit: "clubs" },
      { value: "3", suit: "hearts" },
      { value: "5", suit: "spades" },
      { value: "9", suit: "diamonds" },
    ],
    handRank: "two-pair",
    activeArcanaName: null,
    ...overrides,
  } as TarotReadingRequest;
}

describe("buildPrompt", () => {
  it("includes the hand rank", () => {
    const prompt = buildPrompt(makeRequest({ handRank: "full-house" }));
    expect(prompt).toContain("full-house");
  });

  it("includes Horseshoe position labels", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Past");
    expect(prompt).toContain("Present");
    expect(prompt).toContain("Hidden");
    expect(prompt).toContain("Obstacle");
    expect(prompt).toContain("External");
    expect(prompt).toContain("Advice");
    expect(prompt).toContain("Outcome");
  });

  it("places hole cards in positions 1 and 2", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Card 1 (Past): King of Swords");
    expect(prompt).toContain("Card 2 (Present): Seven of Cups");
  });

  it("places community cards in positions 3–7", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Card 3 (Hidden): Ace of Pentacles");
    expect(prompt).toContain("Card 4 (Obstacle): Ten of Wands");
  });

  it("truncates to 7 cards when more are supplied", () => {
    const prompt = buildPrompt(makeRequest({
      communityCards: [
        { value: "A", suit: "diamonds" },
        { value: "10", suit: "clubs" },
        { value: "3", suit: "hearts" },
        { value: "5", suit: "spades" },
        { value: "9", suit: "diamonds" },
        { value: "Q", suit: "hearts" }, // 8th card — should be ignored
      ],
    }));
    expect(prompt).not.toContain("Card 8");
    expect(prompt).not.toContain("Queen of Cups");
  });

  it("renders null activeArcanaName as 'None'", () => {
    const prompt = buildPrompt(makeRequest({ activeArcanaName: null }));
    expect(prompt).toContain("Active Major Arcana: None");
    expect(prompt).not.toContain("null");
  });

  it("renders a named arcana correctly", () => {
    const prompt = buildPrompt(makeRequest({ activeArcanaName: "The Tower" }));
    expect(prompt).toContain("Active Major Arcana: The Tower");
  });

  it("substitutes a Page card in community cards with the active Arcana when one is set", () => {
    const prompt = buildPrompt(makeRequest({
      communityCards: [
        { value: "0", suit: "cups" },
        { value: "10", suit: "clubs" },
        { value: "3", suit: "hearts" },
        { value: "5", suit: "spades" },
        { value: "9", suit: "diamonds" },
      ],
      activeArcanaName: "The Tower",
    }));
    expect(prompt).toContain("The Tower");
    expect(prompt).toContain("disruption, revelation, sudden change");
    expect(prompt).not.toContain("Page of Cups");
  });

  it("does not substitute a Page when no active Arcana is set", () => {
    const prompt = buildPrompt(makeRequest({
      heroHoleCards: [
        { value: "0", suit: "hearts" },
        { value: "7", suit: "hearts" },
      ],
      activeArcanaName: null,
    }));
    expect(prompt).toContain("Page of Cups");
  });
});
