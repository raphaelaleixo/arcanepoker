import { describe, it, expect } from "vitest";
import { gameReducer } from "../gameReducer";
import { createInitialState } from "../initialState";
import type { StoreGameState } from "../storeTypes";
import type { ArcanaValue, StandardCard, ArcanaCard } from "../../types/types";

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

// ─── Sun (value=19) — split pot ───────────────────────────────────────────────

describe("Sun arcana (FORCE_ARCANA value=19)", () => {
  it("goes to showdown and sets potWon without NaN", () => {
    const state = makePreFlopState();
    expect(state.potSize).toBeGreaterThan(0);
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "19" as ArcanaValue } });
    expect(next.stage).toBe("showdown");
    expect(next.potWon).toBeGreaterThan(0);
    expect(Number.isNaN(next.potWon)).toBe(false);
    expect(next.winnerIds.length).toBeGreaterThan(0);
    const perWinner = Math.floor(next.potWon / next.winnerIds.length);
    expect(Number.isNaN(perWinner)).toBe(false);
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

describe("NEXT_HAND → game-over transitions", () => {
  function makeShowdownState(overrides: Partial<StoreGameState> = {}): StoreGameState {
    // Use START_GAME to get a fully initialised state, then force showdown.
    const base = gameReducer(createInitialState(), { type: "START_GAME" });
    return {
      ...base,
      stage: "showdown",
      winnerIds: [],
      handResults: [],
      potWon: 0,
      ...overrides,
    };
  }

  it("transitions to game-over when hero stack is 0", () => {
    const state = makeShowdownState();
    const players = state.players.map((p) =>
      p.id === "hero" ? { ...p, stack: 0 } : p,
    );
    const next = gameReducer({ ...state, players }, { type: "NEXT_HAND" });
    expect(next.stage).toBe("game-over");
  });

  it("transitions to game-over when isFinalHand is true", () => {
    const state = makeShowdownState({ isFinalHand: true });
    const next = gameReducer(state, { type: "NEXT_HAND" });
    expect(next.stage).toBe("game-over");
  });

  it("preserves all players in state on game-over so standings are available", () => {
    const state = makeShowdownState({ isFinalHand: true });
    const next = gameReducer(state, { type: "NEXT_HAND" });
    expect(next.players.length).toBe(state.players.length);
  });

  it("continues normally when hero is alive and isFinalHand is false", () => {
    const state = makeShowdownState();
    const next = gameReducer(state, { type: "NEXT_HAND" });
    expect(next.stage).not.toBe("game-over");
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

// ─── Helpers for tutorial tests ───────────────────────────────────────────────

const TUTORIAL_HOLE_CARDS_R1 = {
  hero:           [{ value: "0" as const, suit: "hearts"   as const }, { value: "3" as const,  suit: "clubs"    as const }],
  "bot-swords":   [{ value: "K" as const, suit: "spades"   as const }, { value: "K" as const,  suit: "clubs"    as const }],
  "bot-cups":     [{ value: "7" as const, suit: "diamonds" as const }, { value: "9" as const,  suit: "clubs"    as const }],
  "bot-wands":    [{ value: "8" as const, suit: "clubs"    as const }, { value: "J" as const,  suit: "spades"   as const }],
  "bot-pentacles":[{ value: "2" as const, suit: "spades"   as const }, { value: "5" as const,  suit: "diamonds" as const }],
} as const;

const TUTORIAL_QUEUE_R1: StandardCard[] = [
  { value: "A", suit: "spades"   },
  { value: "2", suit: "diamonds" },
  { value: "4", suit: "clubs"    },
  { value: "K", suit: "diamonds" },
  { value: "9", suit: "spades"   },
];

function dispatchOverride(state: StoreGameState) {
  return gameReducer(state, {
    type: "TUTORIAL_OVERRIDE_DEAL",
    payload: {
      dealerIndex: 4,
      playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as Record<string, [StandardCard, StandardCard]>,
      communityCardQueue: TUTORIAL_QUEUE_R1,
      arcanaOverride: null,
    },
  });
}

describe("TUTORIAL_OVERRIDE_DEAL", () => {
  it("sets stage to pre-flop", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    expect(next.stage).toBe("pre-flop");
  });

  it("replaces hero hole cards with scripted ones", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    const hero = next.players.find(p => p.id === "hero")!;
    expect(hero.holeCards).toEqual([
      { value: "0", suit: "hearts" },
      { value: "3", suit: "clubs" },
    ]);
  });

  it("sets communityCardQueue on state", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    expect(next.communityCardQueue).toEqual(TUTORIAL_QUEUE_R1);
  });

  it("sets arcanaOverride on state", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const foolCard: ArcanaCard = { suit: "arcana" as const, value: "0" as const };
    const next = gameReducer(state, {
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: 4,
        playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: [],
        arcanaOverride: foolCard,
      },
    });
    expect(next.arcanaOverride).toEqual(foolCard);
  });

  it("sets dealerIndex from payload and recomputes blind structure", () => {
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    // dealerIndex=4 (Wanderer): SB=(4+1)%5=0=hero, BB=(4+2)%5=1=Merchant, UTG=(4+3)%5=2=Swordsman
    const next = dispatchOverride(state);
    expect(next.dealerIndex).toBe(4);
    const hero = next.players.find(p => p.id === "hero")!;
    expect(hero.currentBet).toBe(10); // small blind
    const merchant = next.players.find(p => p.id === "bot-pentacles")!;
    expect(merchant.currentBet).toBe(20); // big blind
    expect(next.activePlayerIndex).toBe(2); // UTG = Swordsman
  });

  it("does not double-deduct blinds from stacks", () => {
    // START_GAME already posted blinds; TUTORIAL_OVERRIDE_DEAL must undo them
    // before re-posting at the new positions
    const state = gameReducer(createInitialState(), { type: "START_GAME" });
    const next = dispatchOverride(state);
    // All players start at 1000; after override: SB=hero posts 10, BB=Merchant posts 20
    const hero = next.players.find(p => p.id === "hero")!;
    const merchant = next.players.find(p => p.id === "bot-pentacles")!;
    const swords = next.players.find(p => p.id === "bot-swords")!;
    expect(hero.stack).toBe(990);     // 1000 - 10 (SB)
    expect(merchant.stack).toBe(980); // 1000 - 20 (BB)
    expect(swords.stack).toBe(1000);  // no blind
  });
});
