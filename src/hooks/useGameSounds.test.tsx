import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AudioPreferencesProvider, useAudioPreferences } from "../store/AudioPreferencesContext";
import { useGameSounds } from "./useGameSounds";
import type { StoreGameState } from "../store/storeTypes";
import type { GameContextValue } from "../store/context";

// Stub HTMLMediaElement and use fake timers (staggered deal sounds use setTimeout)
beforeEach(() => {
  vi.useFakeTimers();
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined) as unknown as () => Promise<void>;
  window.HTMLMediaElement.prototype.pause = vi.fn() as unknown as () => void;
});

afterEach(() => {
  vi.useRealTimers();
});

// Minimal game state factory
function makeState(overrides: Partial<StoreGameState>): StoreGameState {
  return {
    stage: "pre-game",
    communityCards: [],
    players: [],
    deck: [],
    bigBlind: 20,
    smallBlind: 10,
    potSize: 0,
    currentBet: 0,
    totalContributions: {},
    pots: [],
    dealerIndex: 0,
    activePlayerIndex: 0,
    roundActors: [],
    arcanaDeck: [],
    activeArcana: null,
    arcanaTriggeredThisGame: false,
    handNumber: 1,
    isFinalHand: false,
    pendingInteraction: null,
    empress6thCardDealt: false,
    temperanceCandidates: null,
    temperanceChoices: {},
    priestessRevealedCards: {},
    foolCardIndex: null,
    moonHiddenCommunityIndex: null,
    moonAffectedIndex: null,
    justiceRevealedPlayerId: null,
    ruinsPot: 0,
    ruinsPotReady: false,
    judgementCommittedIds: [],
    winnerIds: [],
    handResults: [],
    wheelRound: 0,
    holeCardChangeSeeds: {},
    communityChangeKey: 0,
    potWon: 0,
    ...overrides,
  } as StoreGameState;
}

// Mock useGame to return controlled state
const mockState = { current: makeState({}) };
vi.mock("../store/useGame", () => ({
  useGame: (): GameContextValue => ({
    state: mockState.current,
    dispatch: vi.fn(),
    startGame: vi.fn(),
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioPreferencesProvider>{children}</AudioPreferencesProvider>
);

describe("useGameSounds", () => {
  it("plays card-deal sound per player when stage changes to 'pre-flop'", () => {
    mockState.current = makeState({ stage: "pre-game", players: [{} as any, {} as any] });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    mockState.current = makeState({ stage: "pre-flop", players: [{} as any, {} as any] });
    rerender();
    vi.runAllTimers();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2); // one per player
  });

  it("plays one card-deal sound per community card added", () => {
    mockState.current = makeState({ stage: "flop", communityCards: [] });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    // Flop: 3 cards added at once → 3 staggered sounds
    mockState.current = makeState({ stage: "flop", communityCards: [{} as any, {} as any, {} as any] });
    rerender();
    vi.runAllTimers();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(3);
  });

  it("does not play when there is no state change", () => {
    mockState.current = makeState({ stage: "pre-game" });
    renderHook(() => useGameSounds(), { wrapper });
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("does not play when sfxEnabled is false", () => {
    mockState.current = makeState({ stage: "pre-game" });

    // Render both hooks together so they share the same context instance
    const { rerender, result } = renderHook(
      () => {
        useGameSounds();
        return useAudioPreferences();
      },
      { wrapper }
    );

    // Transition to pre-flop with 1 player — should fire once
    mockState.current = makeState({ stage: "pre-flop", players: [{} as any] });
    rerender();
    vi.runAllTimers();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    // Disable SFX
    act(() => {
      result.current.toggleSfx();
    });

    // Transition with community cards — should NOT fire
    mockState.current = makeState({
      stage: "flop",
      communityCards: [{} as any, {} as any, {} as any],
    });
    rerender();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1); // still 1
  });
});
