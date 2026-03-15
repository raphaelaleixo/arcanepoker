import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestTarotReading } from "../tarot";
import type { TarotReadingRequest } from "../../types/game";

// 7 total cards (2 hole + 5 community) — passes the pre-validation gate
const MOCK_REQUEST: TarotReadingRequest = {
  heroHoleCards: [{ value: "A", suit: "spades" }, { value: "K", suit: "spades" }],
  communityCards: [
    { value: "Q", suit: "spades" },
    { value: "J", suit: "spades" },
    { value: "10", suit: "spades" },
    { value: "9", suit: "hearts" },
    { value: "8", suit: "diamonds" },
  ],
  handRank: "royal-flush",
  activeArcanaName: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("requestTarotReading", () => {
  it("returns the 'more cards' message without calling fetch when total cards < 7", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const result = await requestTarotReading({
      ...MOCK_REQUEST,
      communityCards: [{ value: "Q", suit: "spades" }, { value: "J", suit: "spades" }], // 2+2 = 4 < 7
    });

    expect(result.prophecy).toBe("We need more revealed cards to make the reading.");
    expect(mockFetch).not.toHaveBeenCalled();
  });


  it("returns the prophecy from the API on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ prophecy: "The stars aligned." }),
      })
    );

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toBe("The stars aligned.");
  });

  it("POSTs to /api/tarot with the request body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ prophecy: "test" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await requestTarotReading(MOCK_REQUEST);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tarot",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MOCK_REQUEST),
      })
    );
  });

  it("falls back to a mock prophecy prefixed with an error note when the API returns non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toMatch(/^\[The spirits faltered in their message\.\]/);
  });

  it("falls back to a mock prophecy prefixed with an error note when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toMatch(/^\[The spirits faltered in their message\.\]/);
  });

  it("falls back to a mock prophecy prefixed with an error note when res.json() throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error("Invalid JSON"); },
      })
    );

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toMatch(/^\[The spirits faltered in their message\.\]/);
  });
});
