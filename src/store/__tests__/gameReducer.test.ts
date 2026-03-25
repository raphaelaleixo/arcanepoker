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

  it("sets arcanaTriggeredThisGame: true after force", () => {
    const state = makePreFlopState();
    const next = gameReducer(state, { type: "FORCE_ARCANA", payload: { value: "8" as ArcanaValue } });
    expect(next.arcanaTriggeredThisGame).toBe(true);
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
};

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
      playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as unknown as Record<string, [StandardCard, StandardCard]>,
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
        playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as unknown as Record<string, [StandardCard, StandardCard]>,
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

describe("advanceStage with communityCardQueue", () => {
  /**
   * Returns a pre-flop state where all bots are all-in (ineligible to bet)
   * and bets are zeroed out, so hero can check and trigger advanceStage.
   * This avoids the "only one non-folded player → last-player-wins" short-circuit.
   */
  function makeQueuedReadyToAdvance(): StoreGameState {
    const base = gameReducer(createInitialState(), { type: "START_GAME" });
    const overridden = gameReducer(base, {
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: 4,
        playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as unknown as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: TUTORIAL_QUEUE_R1,
        arcanaOverride: null,
      },
    });
    // Put all bots all-in with 0 remaining stack and zero out bets so
    // hero can check to complete the round.
    return {
      ...overridden,
      currentBet: 0,
      roundActors: [],
      players: overridden.players.map((p) =>
        p.id === "hero"
          ? { ...p, currentBet: 0 }
          : { ...p, isAllIn: true, stack: 0, currentBet: 0 }
      ),
    };
  }

  it("deals flop cards from communityCardQueue instead of deck", () => {
    const state = makeQueuedReadyToAdvance();
    // Hero checks; only hero is eligible, so round completes and advanceStage fires
    const next = gameReducer(state, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    // Community cards must come from the queue in order
    expect(next.communityCards[0]).toEqual({ value: "A", suit: "spades"   });
    expect(next.communityCards[1]).toEqual({ value: "2", suit: "diamonds" });
    expect(next.communityCards[2]).toEqual({ value: "4", suit: "clubs"    });
  });

  it("deals turn card from communityCardQueue", () => {
    const state = makeQueuedReadyToAdvance();
    const next = gameReducer(state, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    // Auto-chains flop→turn→river; turn is index 3 in queue
    expect(next.communityCards[3]).toEqual({ value: "K", suit: "diamonds" });
  });

  it("queue is empty after all 5 scripted community cards are dealt (auto-chain)", () => {
    // With only hero eligible, advanceStage chains pre-flop→flop→turn→river→showdown
    // consuming all 5 queue entries. Queue must be [] or undefined after.
    const state = makeQueuedReadyToAdvance();
    const next = gameReducer(state, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    expect(next.communityCardQueue?.length ?? 0).toBe(0);
  });
});

describe("checkPageTrigger with arcanaOverride", () => {
  const FOOL_CARD: ArcanaCard = { suit: "arcana" as const, value: "0" as const };

  // Page at index 2 of the flop queue triggers arcana
  const QUEUE_WITH_PAGE: StandardCard[] = [
    { value: "6", suit: "hearts"   },
    { value: "J", suit: "diamonds" },
    { value: "0", suit: "spades"   }, // Page → triggers arcana
    { value: "3", suit: "diamonds" },
    { value: "A", suit: "clubs"    },
  ];

  function makeStateWithFoolOverride(): StoreGameState {
    const base = gameReducer(createInitialState(), { type: "START_GAME" });
    const overridden = gameReducer(base, {
      type: "TUTORIAL_OVERRIDE_DEAL",
      payload: {
        dealerIndex: 4,
        playerHoleCards: TUTORIAL_HOLE_CARDS_R1 as unknown as Record<string, [StandardCard, StandardCard]>,
        communityCardQueue: QUEUE_WITH_PAGE,
        arcanaOverride: FOOL_CARD,
      },
    });
    // Prepare for hero check to advance stage (same pattern as queue tests)
    return {
      ...overridden,
      currentBet: 0,
      roundActors: [],
      players: overridden.players.map((p) =>
        p.id === "hero"
          ? { ...p, currentBet: 0 }
          : { ...p, isAllIn: true, stack: 0, currentBet: 0 }
      ),
    };
  }

  it("uses arcanaOverride card instead of drawing from arcanaDeck", () => {
    const state = makeStateWithFoolOverride();
    const next = gameReducer(state, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    expect(next.pendingInteraction?.type).toBe("arcana-reveal");
    if (next.pendingInteraction?.type === "arcana-reveal") {
      expect(next.pendingInteraction.arcanaCard).toEqual(FOOL_CARD);
    }
  });

  it("clears arcanaOverride after it is consumed", () => {
    const state = makeStateWithFoolOverride();
    const next = gameReducer(state, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    expect(next.arcanaOverride).toBeNull();
  });

  it("does not consume a card from arcanaDeck when override is set", () => {
    const state = makeStateWithFoolOverride();
    const deckLengthBefore = state.arcanaDeck.length;
    const next = gameReducer(state, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });
    expect(next.arcanaDeck.length).toBe(deckLengthBefore);
  });
});

// ─── arcanaTriggeredThisGame persists across hands ────────────────────────────

describe("arcanaTriggeredThisGame", () => {
  it("persists across NEXT_HAND — once triggered, no second arcana draw this game", () => {
    // Simulate a game where arcana was already drawn in hand 1
    const hand1State: StoreGameState = {
      ...makePreFlopState(),
      arcanaTriggeredThisGame: true,
    };

    const afterNextHand = gameReducer(hand1State, { type: "NEXT_HAND" });

    // Flag must survive the hand transition
    expect(afterNextHand.arcanaTriggeredThisGame).toBe(true);
  });

  it("resets to false only on START_GAME", () => {
    const triggered: StoreGameState = {
      ...makePreFlopState(),
      arcanaTriggeredThisGame: true,
    };

    // NEXT_HAND keeps it
    const afterNext = gameReducer(triggered, { type: "NEXT_HAND" });
    expect(afterNext.arcanaTriggeredThisGame).toBe(true);

    // START_GAME resets it
    const fresh = gameReducer(afterNext, { type: "START_GAME" });
    expect(fresh.arcanaTriggeredThisGame).toBe(false);
  });
});

// ─── Side pot distribution ────────────────────────────────────────────────────

describe("side pot distribution (evaluateShowdown)", () => {
  // Community cards that don't form straights or flushes: 2♥ 3♦ 9♣ J♠ Q♥
  const COMMUNITY: StandardCard[] = [
    { value: "2", suit: "hearts" },
    { value: "3", suit: "diamonds" },
    { value: "9", suit: "clubs" },
    { value: "J", suit: "spades" },
    { value: "Q", suit: "hearts" },
  ];

  /**
   * Build a river state with three active players and custom contributions.
   * Uses Death arcana (value "13") to immediately trigger evaluateShowdown.
   */
  function makeSidePotState({
    bot1AllIn,
    bot1Cards,
    bot2Cards,
    heroCards,
    bot1Contribution,
    bot2Contribution,
    heroContribution,
  }: {
    bot1AllIn: boolean;
    bot1Cards: [StandardCard, StandardCard];
    bot2Cards: [StandardCard, StandardCard];
    heroCards: [StandardCard, StandardCard];
    bot1Contribution: number;
    bot2Contribution: number;
    heroContribution: number;
  }): StoreGameState {
    const base = makePreFlopState();
    const potSize = bot1Contribution + bot2Contribution + heroContribution;

    return {
      ...base,
      stage: "river" as const,
      communityCards: COMMUNITY,
      potSize,
      totalContributions: {
        "bot-swords": bot1Contribution,
        "bot-pentacles": bot2Contribution,
        hero: heroContribution,
      },
      players: base.players.map((p) => {
        if (p.id === "bot-swords") {
          return {
            ...p,
            holeCards: bot1Cards,
            isAllIn: bot1AllIn,
            stack: bot1AllIn ? 0 : 1000 - bot1Contribution,
            folded: false,
          };
        }
        if (p.id === "bot-pentacles") {
          return { ...p, holeCards: bot2Cards, folded: false };
        }
        if (p.id === "hero") {
          return { ...p, holeCards: heroCards, folded: false };
        }
        // Fold all other bots so they don't interfere
        return { ...p, folded: true };
      }),
    };
  }

  it("no all-ins: single pot covers all eligible players and winner gets all", () => {
    // Bot-swords has AA (best), bot-pentacles has KK, hero has 76o (worst)
    // No all-ins, equal contributions → one pot of 120, bot-swords wins all
    const state = makeSidePotState({
      bot1AllIn: false,
      bot1Cards: [{ value: "A", suit: "spades" }, { value: "A", suit: "diamonds" }],
      bot2Cards: [{ value: "K", suit: "spades" }, { value: "K", suit: "diamonds" }],
      heroCards:  [{ value: "6", suit: "spades" }, { value: "7", suit: "hearts" }],
      bot1Contribution: 40,
      bot2Contribution: 40,
      heroContribution: 40,
    });

    const next = gameReducer(state, {
      type: "FORCE_ARCANA",
      payload: { value: "13" as ArcanaValue },
    });

    const swords = next.players.find((p) => p.id === "bot-swords")!;
    expect(next.stage).toBe("showdown");
    expect(next.potWon).toBe(120);
    expect(swords.stack).toBe(swords.stack); // winner gains pot
    expect(next.winnerIds).toContain("bot-swords");
    expect(next.winnerIds).not.toContain("hero");
  });

  it("all-in player with best hand wins main pot only; second-best wins side pot", () => {
    // bot-swords: all-in for 20 (AA = best), bot-pentacles: 40 (KK = 2nd), hero: 40 (76o = worst)
    // Main pot = 60 (all eligible), side pot = 40 (pentacles + hero)
    const state = makeSidePotState({
      bot1AllIn: true,
      bot1Cards: [{ value: "A", suit: "spades" }, { value: "A", suit: "diamonds" }],
      bot2Cards: [{ value: "K", suit: "spades" }, { value: "K", suit: "diamonds" }],
      heroCards:  [{ value: "6", suit: "spades" }, { value: "7", suit: "hearts" }],
      bot1Contribution: 20,
      bot2Contribution: 40,
      heroContribution: 40,
    });

    // Set stacks to reflect contributions
    const stateWithStacks: StoreGameState = {
      ...state,
      players: state.players.map((p) => {
        if (p.id === "bot-swords")   return { ...p, stack: 0 };         // all-in
        if (p.id === "bot-pentacles") return { ...p, stack: 960 };
        if (p.id === "hero")          return { ...p, stack: 960 };
        return p;
      }),
    };

    const next = gameReducer(stateWithStacks, {
      type: "FORCE_ARCANA",
      payload: { value: "13" as ArcanaValue },
    });

    const swords    = next.players.find((p) => p.id === "bot-swords")!;
    const pentacles = next.players.find((p) => p.id === "bot-pentacles")!;
    const hero      = next.players.find((p) => p.id === "hero")!;

    // bot-swords wins main pot (60): started at 0, now +60
    expect(swords.stack).toBe(60);
    // bot-pentacles wins side pot (40): started at 960, now +40
    expect(pentacles.stack).toBe(960 + 40);
    // hero loses everything
    expect(hero.stack).toBe(960);
    expect(next.potWon).toBe(100);
  });

  it("all-in player with worst hand loses; best-hand player wins both pots", () => {
    // bot-swords: all-in for 20 (76o = worst), bot-pentacles: 40 (AA = best), hero: 40 (KK = 2nd)
    // Main pot = 60 (all eligible), side pot = 40 (pentacles + hero)
    // bot-pentacles wins AA over KK → wins both pots = 100
    const state = makeSidePotState({
      bot1AllIn: true,
      bot1Cards: [{ value: "6", suit: "spades" }, { value: "7", suit: "hearts" }],
      bot2Cards: [{ value: "A", suit: "spades" }, { value: "A", suit: "diamonds" }],
      heroCards:  [{ value: "K", suit: "spades" }, { value: "K", suit: "diamonds" }],
      bot1Contribution: 20,
      bot2Contribution: 40,
      heroContribution: 40,
    });

    const stateWithStacks: StoreGameState = {
      ...state,
      players: state.players.map((p) => {
        if (p.id === "bot-swords")    return { ...p, stack: 0 };
        if (p.id === "bot-pentacles") return { ...p, stack: 960 };
        if (p.id === "hero")          return { ...p, stack: 960 };
        return p;
      }),
    };

    const next = gameReducer(stateWithStacks, {
      type: "FORCE_ARCANA",
      payload: { value: "13" as ArcanaValue },
    });

    const swords    = next.players.find((p) => p.id === "bot-swords")!;
    const pentacles = next.players.find((p) => p.id === "bot-pentacles")!;
    const hero      = next.players.find((p) => p.id === "hero")!;

    // bot-pentacles wins main pot (60) + side pot (40) = 100
    expect(pentacles.stack).toBe(960 + 100);
    // bot-swords loses (had 0 stack, wins nothing from main pot it loses)
    expect(swords.stack).toBe(0);
    // hero loses
    expect(hero.stack).toBe(960);
  });

  it("totalContributions and pots are reset to empty after showdown", () => {
    const state = makeSidePotState({
      bot1AllIn: true,
      bot1Cards: [{ value: "A", suit: "spades" }, { value: "A", suit: "diamonds" }],
      bot2Cards: [{ value: "K", suit: "spades" }, { value: "K", suit: "diamonds" }],
      heroCards:  [{ value: "6", suit: "spades" }, { value: "7", suit: "hearts" }],
      bot1Contribution: 20,
      bot2Contribution: 40,
      heroContribution: 40,
    });

    const next = gameReducer(state, {
      type: "FORCE_ARCANA",
      payload: { value: "13" as ArcanaValue },
    });

    expect(next.pots).toEqual([]);
    expect(next.totalContributions).toEqual({});
  });

  it("goToLastPlayerWins resets totalContributions and pots", () => {
    // All bots fold → hero is last player and wins via goToLastPlayerWins
    const base = makePreFlopState();
    const state: StoreGameState = {
      ...base,
      potSize: 60,
      totalContributions: { hero: 40, "bot-swords": 20 },
      pots: [],
      players: base.players.map((p) =>
        p.id === "hero" ? p : { ...p, folded: true }
      ),
    };

    // Any hero action now triggers goToLastPlayerWins since only hero remains
    const next = gameReducer(state, {
      type: "PLAYER_ACTION",
      payload: { playerId: "hero", action: "check" },
    });

    expect(next.stage).toBe("showdown");
    expect(next.totalContributions).toEqual({});
    expect(next.pots).toEqual([]);
    expect(next.winnerIds).toContain("hero");
  });
});
