import { describe, it, expect } from "vitest";
import { gameReducer } from "../gameReducer";
import { createInitialState } from "../initialState";
import type { StoreGameState } from "../storeTypes";
import type { ArcanaValue, StandardCard } from "../../types/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePreFlopState(): StoreGameState {
  // START_GAME produces a pre-flop state
  return gameReducer(createInitialState(), { type: "START_GAME" });
}

// ─── FORCE_ARCANA ─────────────────────────────────────────────────────────────

describe("FORCE_ARCANA", () => {
  it("returns state unchanged when stage is pre-game", () => {
    const state = createInitialState(); // stage === "pre-game"
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("returns state unchanged when stage is showdown", () => {
    const state = { ...makePreFlopState(), stage: "showdown" as const };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("returns state unchanged when stage is deal", () => {
    const state = { ...makePreFlopState(), stage: "deal" as const };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("returns state unchanged when stage is results", () => {
    const state = { ...makePreFlopState(), stage: "results" as const };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" } });
    expect(next).toBe(state);
  });

  it("sets activeArcana when forced in pre-flop (Strength=8)", () => {
    const state = makePreFlopState();
    expect(state.stage).toBe("pre-flop");
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(next.activeArcana?.card.value).toBe("8");
    expect(next.activeArcana?.effectKey).toBe("strength-invert");
  });

  it("sets arcanaTriggeredThisRound: true after force", () => {
    const state = makePreFlopState();
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(next.arcanaTriggeredThisRound).toBe(true);
  });

  it("bypasses hierophantShield when forcing", () => {
    const state = { ...makePreFlopState(), hierophantShield: true };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(next.activeArcana?.card.value).toBe("8");
  });

  it("replaces an existing active arcana", () => {
    const state = makePreFlopState();
    const withA = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "4" as ArcanaValue } });
    expect(withA.activeArcana?.card.value).toBe("4");
    const withB = gameReducer(withA, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(withB.activeArcana?.card.value).toBe("8");
  });
});

// ─── Priestess reveal ─────────────────────────────────────────────────────────

describe("Priestess reveal (FORCE_ARCANA value=2)", () => {
  it("bots reveal their lower-value hole card", () => {
    const base = makePreFlopState();
    // Give bot-swords known cards: Ace (high) and 2 (low)
    const botId = "bot-swords";
    const state: StoreGameState = {
      ...base,
      players: base.players.map((p) =>
        p.id === botId
          ? { ...p, holeCards: [{ value: "A", suit: "hearts" }, { value: "2", suit: "clubs" }] }
          : p
      ),
    };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    // Bot should reveal the 2 (lower value), not the Ace
    expect(next.priestessRevealedCards[botId]).toEqual({ value: "2", suit: "clubs" });
  });

  it("sets pendingInteraction for hero when hero is not folded", () => {
    const state = makePreFlopState();
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    expect(next.pendingInteraction?.type).toBe("priestess-reveal");
  });

  it("does not set pendingInteraction for hero when hero is folded", () => {
    const base = makePreFlopState();
    const hero = base.players.find((p) => p.type === "human")!;
    const state = {
      ...base,
      players: base.players.map((p) =>
        p.id === hero.id ? { ...p, folded: true } : p
      ),
    };
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    expect(next.pendingInteraction).toBeNull();
  });
});

describe("RESOLVE_PRIESTESS", () => {
  it("stores hero's chosen card in priestessRevealedCards and clears pendingInteraction", () => {
    const base = makePreFlopState();
    const withPriestess = gameReducer(base, { type: "FORCE_ARCANA", payload: { value: "2" as ArcanaValue } });
    expect(withPriestess.pendingInteraction?.type).toBe("priestess-reveal");

    const hero = withPriestess.players.find((p) => p.type === "human")!;
    const chosenCard = hero.holeCards[0];

    const next = gameReducer(withPriestess, { type: "RESOLVE_PRIESTESS", payload: { card: chosenCard } });
    expect(next.priestessRevealedCards[hero.id]).toEqual(chosenCard);
    expect(next.pendingInteraction).toBeNull();
  });
});

describe("startHand resets priestessRevealedCards", () => {
  it("clears priestessRevealedCards on NEXT_HAND", () => {
    const base = makePreFlopState();
    // Manually inject some priestess data
    const state = { ...base, priestessRevealedCards: { "hero": { value: "A", suit: "hearts" } as StandardCard } };
    // Advance to showdown to allow NEXT_HAND
    const showdown = { ...state, stage: "showdown" as const, pendingInteraction: null };
    const next = gameReducer(showdown, { type: "NEXT_HAND" });
    expect(next.priestessRevealedCards).toEqual({});
  });
});
