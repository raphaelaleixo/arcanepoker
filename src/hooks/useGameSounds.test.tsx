import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { SettingsProvider, useSettings } from "../store/SettingsContext";
import { useGameSounds } from "./useGameSounds";
import type { StoreGameState } from "../store/storeTypes";
import type { GameContextValue } from "../store/context";

vi.mock("../utils/audioPool", () => ({
  playPooled: vi.fn(),
  preloadSounds: vi.fn(),
}));

import { playPooled } from "../utils/audioPool";

import cardDealUrl from "../assets/audio/card-deal.mp3";
import arcanaUrl from "../assets/audio/arcana.mp3";
import betUrl from "../assets/audio/bet.mp3";
import roundEndUrl from "../assets/audio/round-end.mp3";
import pageUrl from "../assets/audio/page.mp3";

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(playPooled).mockClear();
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
    lastRaiseSize: 20,
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
    checkCount: 0,
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
  <SettingsProvider>{children}</SettingsProvider>
);

describe("useGameSounds", () => {
  it("plays card-deal sound per player when stage changes to 'pre-flop'", () => {
    mockState.current = makeState({ stage: "pre-game", players: [{} as any, {} as any] });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });
    expect(playPooled).not.toHaveBeenCalled();

    mockState.current = makeState({ stage: "pre-flop", players: [{} as any, {} as any] });
    rerender();
    vi.runAllTimers();
    expect(playPooled).toHaveBeenCalledTimes(2); // one per player
    expect(playPooled).toHaveBeenCalledWith(cardDealUrl, 0.1, 1.5);
  });

  it("plays one card-deal sound per community card added", () => {
    mockState.current = makeState({ stage: "flop", communityCards: [] });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    // Flop: 3 cards added at once → 3 staggered sounds
    mockState.current = makeState({ stage: "flop", communityCards: [{} as any, {} as any, {} as any] });
    rerender();
    vi.runAllTimers();
    expect(playPooled).toHaveBeenCalledTimes(3);
  });

  it("plays arcana sound when arcana starts glowing (pendingInteraction arcana-reveal)", () => {
    mockState.current = makeState({ pendingInteraction: null });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });
    expect(playPooled).not.toHaveBeenCalled();

    mockState.current = makeState({ pendingInteraction: { type: "arcana-reveal", arcanaCard: {} as any } });
    rerender();
    expect(playPooled).toHaveBeenCalledTimes(1);
    expect(playPooled).toHaveBeenCalledWith(arcanaUrl, 0.5);
  });

  it("plays card-deal sound when arcana becomes active", () => {
    mockState.current = makeState({ activeArcana: null });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });
    expect(playPooled).not.toHaveBeenCalled();

    mockState.current = makeState({ activeArcana: { card: {} as any, effectKey: "fool-wildcard" } });
    rerender();
    expect(playPooled).toHaveBeenCalledTimes(1);
  });

  it("plays one sound per player on Wheel of Fortune redeal", () => {
    mockState.current = makeState({ wheelRound: 0, players: [{} as any, {} as any, {} as any] });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    mockState.current = makeState({ wheelRound: 1, players: [{} as any, {} as any, {} as any] });
    rerender();
    vi.runAllTimers();
    expect(playPooled).toHaveBeenCalledTimes(3);
  });

  it("plays one sound per changed player on hole card replacement (Magician/Star/etc)", () => {
    mockState.current = makeState({ holeCardChangeSeeds: { p1: 0, p2: 0 } });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    mockState.current = makeState({ holeCardChangeSeeds: { p1: 1, p2: 0 } });
    rerender();
    vi.runAllTimers();
    expect(playPooled).toHaveBeenCalledTimes(1);
  });

  it("plays bet sound when potSize increases", () => {
    mockState.current = makeState({ potSize: 0 });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    mockState.current = makeState({ potSize: 20 });
    rerender();
    expect(playPooled).toHaveBeenCalledTimes(1);
    expect(playPooled).toHaveBeenCalledWith(betUrl, 0.1);
  });

  it("does not play bet sound when potSize decreases (showdown payout)", () => {
    mockState.current = makeState({ potSize: 100 });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    mockState.current = makeState({ potSize: 0 });
    rerender();
    expect(playPooled).not.toHaveBeenCalled();
  });

  it("plays round-end sound when potWon goes from 0 to >0", () => {
    mockState.current = makeState({ potWon: 0 });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    mockState.current = makeState({ potWon: 200 });
    rerender();
    expect(playPooled).toHaveBeenCalledTimes(1);
    expect(playPooled).toHaveBeenCalledWith(roundEndUrl, 0.5);
  });

  it("plays round-end sound on page challenge", () => {
    mockState.current = makeState({ pendingInteraction: null });
    const { rerender } = renderHook(() => useGameSounds(), { wrapper });

    mockState.current = makeState({ pendingInteraction: { type: "page-challenge" } });
    rerender();
    expect(playPooled).toHaveBeenCalledTimes(1);
    expect(playPooled).toHaveBeenCalledWith(pageUrl, 0.3);
  });

  it("does not play when there is no state change", () => {
    mockState.current = makeState({ stage: "pre-game" });
    renderHook(() => useGameSounds(), { wrapper });
    expect(playPooled).not.toHaveBeenCalled();
  });

  it("does not play when sfxEnabled is false", () => {
    mockState.current = makeState({ stage: "pre-game" });

    // Render both hooks together so they share the same context instance
    const { rerender, result } = renderHook(
      () => {
        useGameSounds();
        return useSettings();
      },
      { wrapper }
    );

    // Transition to pre-flop with 1 player — should fire once
    mockState.current = makeState({ stage: "pre-flop", players: [{} as any] });
    rerender();
    vi.runAllTimers();
    expect(playPooled).toHaveBeenCalledTimes(1);

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
    expect(playPooled).toHaveBeenCalledTimes(1); // still 1
  });
});
