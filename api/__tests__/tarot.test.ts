import { describe, it, expect } from "vitest";
import { buildPrompt } from "../tarot";
import type { TarotReadingRequest } from "../../src/types/game";

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

  it("includes hole cards as tarot names with keywords", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("King of Swords");
    expect(prompt).toContain("Seven of Cups");
  });

  it("includes community cards as tarot names with keywords", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("Ace of Pentacles");
    expect(prompt).toContain("Ten of Wands");
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
});
