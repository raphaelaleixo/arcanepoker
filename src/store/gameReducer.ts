import { shuffle, createStandardDeck, dealCards } from "../engine/deck";
import {
  evaluateBestHand,
  compareHands,
  findWinners,
  combinations,
} from "../engine/handEvaluator";
import {
  chariotCardToPass,
  starShouldDiscard,
  magicianShouldRedraw,
} from "../engine/ai";
import type { EvalOptions } from "../engine/handEvaluator";
import type { StandardCard, ArcanaCard, ActionType, GameStage } from "../types/types";
import type { ActiveArcana, ArcanaEffectKey } from "../types/game";
import { CARD_NUMERIC_VALUES } from "../types/game";
import type {
  StoreGameState,
  GameAction,
  GamePlayer,
  HandResultEntry,
} from "./storeTypes";
import { ARCANA_EFFECT_KEYS } from "./storeTypes";
import { createInitialState, HERO_ID_CONST } from "./initialState";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HERO_ID = HERO_ID_CONST;

/** Build EvalOptions from the current active arcana. Exported for GameContext. */
export function buildEvalOptions(state: StoreGameState): EvalOptions {
  const key = state.activeArcana?.effectKey ?? null;
  return {
    strengthActive: key === "strength-invert",
    emperorActive: key === "emperor-highcard",
    foolActive: key === "fool-wildcard",
    hierophantActive: key === "hierophant-no-pages",
  };
}

/** Players that are still eligible to bet (not folded, not all-in). */
function eligiblePlayers(players: GamePlayer[]): GamePlayer[] {
  return players.filter((p) => !p.folded && !p.isAllIn);
}

/** True when the current betting round is finished. */
function isBettingRoundComplete(state: StoreGameState): boolean {
  const eligible = eligiblePlayers(state.players);
  if (eligible.length === 0) return true;
  return eligible.every(
    (p) =>
      state.roundActors.includes(p.id) && p.currentBet === state.currentBet
  );
}

/**
 * Find the index of the next player who still needs to act.
 * Returns null when the round is over.
 */
function findNextActor(state: StoreGameState): number | null {
  const { players, activePlayerIndex, roundActors, currentBet } = state;
  const n = players.length;
  for (let i = 1; i < n; i++) {
    const idx = (activePlayerIndex + i) % n;
    const p = players[idx];
    if (!p.folded && !p.isAllIn) {
      if (!roundActors.includes(p.id) || p.currentBet < currentBet) {
        return idx;
      }
    }
  }
  return null;
}

/**
 * First active (non-folded, non-all-in) player index starting clockwise from
 * `fromIndex` (exclusive).
 */
function firstActiveAfter(players: GamePlayer[], fromIndex: number): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n;
    if (!players[idx].folded && !players[idx].isAllIn) return idx;
  }
  return fromIndex; // fallback (shouldn't happen)
}

// ─── Magician pre-showdown intercept ─────────────────────────────────────────

function applyMagicianRedraw(state: StoreGameState): StoreGameState {
  if (state.activeArcana?.effectKey !== "magician-redraw") {
    return evaluateShowdown(state);
  }

  const evalOpts = buildEvalOptions(state);
  let deck = state.deck;
  const players = [...state.players] as GamePlayer[];

  // Bots decide and redraw immediately
  let holeCardChangeSeeds = { ...state.holeCardChangeSeeds };
  for (const p of players.filter((pl) => pl.type === "ai" && !pl.folded)) {
    if (magicianShouldRedraw(p.holeCards, state.communityCards, evalOpts)) {
      const { dealt, remaining } = dealCards(deck, 2);
      deck = remaining;
      const idx = players.findIndex((pl) => pl.id === p.id);
      players[idx] = { ...players[idx], holeCards: dealt };
      holeCardChangeSeeds[p.id] = (holeCardChangeSeeds[p.id] ?? 0) + 1;
    }
  }

  // Hero gets an interactive choice (unless already folded)
  const hero = players.find((p) => p.id === HERO_ID);
  if (!hero || hero.folded) {
    return evaluateShowdown({ ...state, players, deck, holeCardChangeSeeds });
  }

  return {
    ...state,
    players,
    deck,
    holeCardChangeSeeds,
    pendingInteraction: { type: "magician-redraw", playerId: HERO_ID },
  };
}

// ─── Stage transition ─────────────────────────────────────────────────────────

function resetBettingRound(
  state: StoreGameState,
  startIndex: number
): StoreGameState {
  return {
    ...state,
    currentBet: 0,
    roundActors: [],
    activePlayerIndex: startIndex,
    players: state.players.map((p) => ({ ...p, currentBet: 0 })),
  };
}

/**
 * Check newly-dealt community cards for a Page.
 * If found (and limit not reached), draw the top Arcana card and apply it.
 */
function checkPageTrigger(
  state: StoreGameState,
  newCards: StandardCard[]
): StoreGameState {
  if (state.arcanaTriggeredThisRound) return state;
  if (!newCards.some((c) => c.value === "0")) return state;

  let arcanaCard: ArcanaCard;
  let remainingArcanaDeck = state.arcanaDeck;

  if (state.arcanaOverride) {
    // Tutorial mode: use the forced card, do NOT consume from arcanaDeck
    arcanaCard = state.arcanaOverride;
  } else {
    const [drawn, ...rest] = state.arcanaDeck;
    if (!drawn) return state;
    arcanaCard = drawn;
    remainingArcanaDeck = rest;
  }

  // Pause for the hero to reveal the arcana before applying its effect
  return {
    ...state,
    arcanaDeck: remainingArcanaDeck,
    arcanaOverride: null, // Consumed — clear so it cannot fire again
    arcanaTriggeredThisRound: true,
    pendingInteraction: { type: "arcana-reveal", arcanaCard },
  };
}

/**
 * Draw `count` cards for community dealing.
 * Prefers communityCardQueue when available, falls back to the shuffled deck.
 */
function drawCommunityCards(
  state: StoreGameState,
  count: number
): { dealt: StandardCard[]; nextState: StoreGameState } {
  const queue = state.communityCardQueue;
  if (queue && queue.length >= count) {
    return {
      dealt: queue.slice(0, count),
      nextState: { ...state, communityCardQueue: queue.slice(count) },
    };
  }
  const { dealt, remaining } = dealCards(state.deck, count);
  return { dealt, nextState: { ...state, deck: remaining } };
}

/**
 * Advance from the current stage to the next one.
 * Deals community cards, resets betting, checks for Page triggers.
 */
function advanceStage(state: StoreGameState): StoreGameState {
  // Post-flop starting seat: first active player left of dealer
  const postFlopStart = firstActiveAfter(state.players, state.dealerIndex);

  switch (state.stage) {
    case "pre-flop": {
      const { dealt, nextState } = drawCommunityCards(state, 3);
      let next = resetBettingRound(
        { ...nextState, stage: "flop", communityCards: dealt },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      // If an arcana was triggered, stop so the interaction can be shown first
      if (next.pendingInteraction) return next;
      // If all eligible players can't act (everyone all-in/folded), run the board
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }

    case "flop": {
      const { dealt, nextState } = drawCommunityCards(state, 1);
      let next = resetBettingRound(
        {
          ...nextState,
          stage: "turn",
          communityCards: [...state.communityCards, dealt[0]],
        },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      if (next.pendingInteraction) return next;
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }

    case "turn": {
      const { dealt, nextState } = drawCommunityCards(state, 1);
      let next = resetBettingRound(
        {
          ...nextState,
          stage: "river",
          communityCards: [...state.communityCards, dealt[0]],
        },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      if (next.pendingInteraction) return next;
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }

    case "river": {
      // Empress: deal 6th community card then open a dedicated betting round
      if (
        state.activeArcana?.effectKey === "empress-sixth-card" &&
        !state.empress6thCardDealt
      ) {
        const { dealt, remaining } = dealCards(state.deck, 1);
        const withSixth = {
          ...state,
          communityCards: [...state.communityCards, dealt[0]],
          deck: remaining,
          empress6thCardDealt: true,
        };
        const withPageCheck = checkPageTrigger(withSixth, dealt);
        let next = resetBettingRound(
          { ...withPageCheck, stage: "empress" },
          postFlopStart
        );
        if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
        return next;
      }
      return applyMagicianRedraw(state);
    }

    case "empress":
      return applyMagicianRedraw(state);

    default:
      return state;
  }
}

// ─── Showdown ─────────────────────────────────────────────────────────────────

function evaluateShowdown(state: StoreGameState): StoreGameState {
  const opts = buildEvalOptions(state);
  const isHermit = state.activeArcana?.effectKey === "hermit-hole-only";

  const isTemperance = state.activeArcana?.effectKey === "temperance-three-river";

  const handEntries = state.players
    .filter((p) => !p.folded)
    .map((p) => {
      let hand;
      if (isHermit) {
        hand = evaluateBestHand(p.holeCards, opts);
      } else if (isTemperance && state.communityCards.length >= 3) {
        // Must use both hole cards + exactly 3 of the community cards (Omaha-style)
        const commCombos = combinations(state.communityCards, 3);
        hand = commCombos
          .map((comm) => evaluateBestHand([...p.holeCards, ...comm], opts))
          .reduce((best, h) => (compareHands(h, best) > 0 ? h : best));
      } else {
        hand = evaluateBestHand([...p.holeCards, ...state.communityCards], opts);
      }
      return { playerId: p.id, hand };
    });

  let winnerIds = findWinners(handEntries);

  // Lovers: split between the two best hands
  if (state.activeArcana?.effectKey === "lovers-split-pot") {
    const sorted = [...handEntries].sort((a, b) =>
      compareHands(b.hand, a.hand)
    );
    winnerIds =
      sorted.length >= 2
        ? [sorted[0].playerId, sorted[1].playerId]
        : winnerIds;
  }

  const totalPot = state.potSize + (state.ruinsPotReady ? state.ruinsPot : 0);
  const perWinner = Math.floor(totalPot / winnerIds.length);
  const newPlayers = state.players.map((p) =>
    winnerIds.includes(p.id) ? { ...p, stack: p.stack + perWinner } : p
  );

  const handResults: HandResultEntry[] = handEntries.map((e) => ({
    playerId: e.playerId,
    rankName: e.hand.rankName,
    rankValue: e.hand.rankValue,
  }));

  // Challenge of the Page: any winner with a Page in their hole cards
  const pageChallengePending = winnerIds.some((id) => {
    const p = newPlayers.find((pl) => pl.id === id);
    return p?.holeCards.some((c) => c.value === "0");
  });

  return {
    ...state,
    stage: "showdown",
    players: newPlayers,
    potSize: 0,
    potWon: totalPot,
    ruinsPot: state.ruinsPotReady ? 0 : state.ruinsPot,
    ruinsPotReady: false,
    moonHiddenCommunityIndex: null,
    winnerIds,
    handResults,
    pendingInteraction: pageChallengePending ? { type: "page-challenge" as const } : null,
  };
}

/** Skip to results — called when all but one player folds. */
function goToLastPlayerWins(
  state: StoreGameState,
  newPlayers: GamePlayer[],
  pot: number,
  winnerId: string
): StoreGameState {
  const updated = newPlayers.map((p) =>
    p.id === winnerId ? { ...p, stack: p.stack + pot } : p
  );
  const winnerHasPage = updated
    .find((p) => p.id === winnerId)
    ?.holeCards.some((c) => c.value === "0") ?? false;

  return {
    ...state,
    stage: "showdown",
    players: updated,
    potSize: 0,
    potWon: pot,
    winnerIds: [winnerId],
    handResults: [],
    pendingInteraction: winnerHasPage ? { type: "page-challenge" as const } : null,
  };
}

// ─── Deal / start hand ────────────────────────────────────────────────────────

function startHand(state: StoreGameState): StoreGameState {
  const deck = shuffle(createStandardDeck());
  const n = state.players.length;
  const sbIdx = (state.dealerIndex + 1) % n;
  const bbIdx = (state.dealerIndex + 2) % n;
  const utgIdx = (state.dealerIndex + 3) % n;

  // Reset players
  const players: GamePlayer[] = state.players.map((p) => ({
    ...p,
    holeCards: [],
    currentBet: 0,
    folded: false,
    isAllIn: false,
    currentAction: undefined,
  }));

  // Deal 2 hole cards each (one at a time, starting left of dealer)
  let remaining = deck;
  const dealOrder = Array.from({ length: n }, (_, i) => (sbIdx + i) % n);
  for (let round = 0; round < 2; round++) {
    for (const idx of dealOrder) {
      const { dealt, remaining: rest } = dealCards(remaining, 1);
      players[idx] = {
        ...players[idx],
        holeCards: [...players[idx].holeCards, dealt[0]],
      };
      remaining = rest;
    }
  }

  // Post blinds (don't add to roundActors — blinds aren't voluntary actions)
  const sbPaid = Math.min(state.smallBlind, players[sbIdx].stack);
  const bbPaid = Math.min(state.bigBlind, players[bbIdx].stack);
  players[sbIdx] = {
    ...players[sbIdx],
    currentBet: sbPaid,
    stack: players[sbIdx].stack - sbPaid,
    isAllIn: players[sbIdx].stack <= state.smallBlind,
    currentAction: "smallBlind",
  };
  players[bbIdx] = {
    ...players[bbIdx],
    currentBet: bbPaid,
    stack: players[bbIdx].stack - bbPaid,
    isAllIn: players[bbIdx].stack <= state.bigBlind,
    currentAction: "bigBlind",
  };

  return {
    ...state,
    stage: "pre-flop",
    players,
    deck: remaining,
    communityCards: [],
    potSize: sbPaid + bbPaid,
    currentBet: bbPaid,
    dealerIndex: state.dealerIndex,
    activePlayerIndex: utgIdx,
    roundActors: [],
    arcanaTriggeredThisRound: false,
    activeArcana: null,
    empress6thCardDealt: false,
    temperanceCandidates: null,
    temperanceChoices: {},
    priestessRevealedCards: {},
    foolCardIndex: null,
    moonAffectedIndex: null,
    winnerIds: [],
    handResults: [],
    potWon: 0,
    pendingInteraction: null,
    wheelRound: (state.wheelRound ?? 0) + 1,
    holeCardChangeSeeds: {},
    judgementCommittedIds: [],
  };
}

// ─── Player action processing ─────────────────────────────────────────────────

function processPlayerAction(
  state: StoreGameState,
  payload: { playerId: string; action: ActionType; amount?: number }
): StoreGameState {
  const { playerId, action, amount } = payload;
  const playerIdx = state.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) return state;

  // Judgement: committed players (bet/raised) cannot fold — silently convert to check/call
  if (
    state.activeArcana?.effectKey === "judgement-no-fold" &&
    action === "fold" &&
    state.judgementCommittedIds.includes(playerId)
  ) {
    const player = state.players[playerIdx];
    const toCallAmt = state.currentBet - player.currentBet;
    return processPlayerAction(state, {
      playerId,
      action: toCallAmt === 0 ? "check" : "call",
    });
  }

  // Devil: first actor in the round must open with a bet — checking is forbidden
  if (
    state.activeArcana?.effectKey === "devil-double-raise" &&
    state.roundActors.length === 0 &&
    state.currentBet === 0 &&
    (action === "check" || (action === "call" && state.currentBet - state.players[playerIdx].currentBet === 0))
  ) {
    return processPlayerAction(state, {
      playerId,
      action: "raise",
      amount: state.bigBlind,
    });
  }

  const player = state.players[playerIdx];
  const players = [...state.players] as GamePlayer[];
  let potDelta = 0;
  let newCurrentBet = state.currentBet;
  let newRoundActors = [...state.roundActors, playerId];

  switch (action) {
    case "fold":
      players[playerIdx] = { ...player, folded: true, currentAction: "fold" };
      break;

    case "check":
      players[playerIdx] = { ...player, currentAction: "check" };
      break;

    case "call": {
      const toCall = Math.min(
        state.currentBet - player.currentBet,
        player.stack
      );
      potDelta = toCall;
      const isAllIn = toCall === player.stack;
      players[playerIdx] = {
        ...player,
        currentBet: player.currentBet + toCall,
        stack: player.stack - toCall,
        isAllIn,
        currentAction: isAllIn ? "all-in" : "call",
      };
      break;
    }

    case "bet":
    case "raise": {
      // `amount` is the NEW total bet for this street (not the raise increment)
      const targetBet = amount ?? state.currentBet * 2;
      const toAdd = Math.min(targetBet - player.currentBet, player.stack);
      potDelta = toAdd;
      const newPlayerBet = player.currentBet + toAdd;
      const isAllIn = toAdd === player.stack;
      newCurrentBet = Math.max(newCurrentBet, newPlayerBet);
      players[playerIdx] = {
        ...player,
        currentBet: newPlayerBet,
        stack: player.stack - toAdd,
        isAllIn,
        currentAction: isAllIn ? "all-in" : action,
      };
      // Everyone else must respond to the raise
      newRoundActors = [playerId];
      break;
    }

    case "all-in": {
      const allInAmt = player.stack;
      potDelta = allInAmt;
      const newPlayerBet = player.currentBet + allInAmt;
      const isRaise = newPlayerBet > newCurrentBet;
      if (isRaise) {
        newCurrentBet = newPlayerBet;
        newRoundActors = [playerId];
      }
      players[playerIdx] = {
        ...player,
        currentBet: newPlayerBet,
        stack: 0,
        isAllIn: true,
        currentAction: "all-in",
      };
      break;
    }
  }

  const newPot = state.potSize + potDelta;

  // Hanged Man: if a player just went all-in and the effect is active, deal them an extra hole card
  let hangedManDeck = state.deck;
  const wasAllIn = state.players[playerIdx].isAllIn;
  if (
    state.activeArcana?.effectKey === "hanged-man-extra-allin" &&
    players[playerIdx].isAllIn &&
    !wasAllIn
  ) {
    const { dealt, remaining } = dealCards(hangedManDeck, 1);
    players[playerIdx] = {
      ...players[playerIdx],
      holeCards: [...players[playerIdx].holeCards, dealt[0]],
    };
    hangedManDeck = remaining;
  }

  // Judgement: track players who bet or raised while the effect is active
  let judgementCommittedIds = state.judgementCommittedIds;
  if (state.activeArcana?.effectKey === "judgement-no-fold") {
    const isRaisingAction =
      action === "bet" ||
      action === "raise" ||
      (action === "all-in" && players[playerIdx].currentBet > state.currentBet);
    if (isRaisingAction && !judgementCommittedIds.includes(playerId)) {
      judgementCommittedIds = [...judgementCommittedIds, playerId];
    }
  }

  // Check if only one player remains (everyone else folded)
  const activePlayers = players.filter((p) => !p.folded);
  if (activePlayers.length === 1) {
    return goToLastPlayerWins(state, players, newPot, activePlayers[0].id);
  }

  // If Hanged Man dealt an extra card this action, bump the animation seed for that player
  const hangedManDealt =
    state.activeArcana?.effectKey === "hanged-man-extra-allin" &&
    players[playerIdx].isAllIn &&
    !state.players[playerIdx].isAllIn;

  const next: StoreGameState = {
    ...state,
    players,
    deck: hangedManDeck,
    potSize: newPot,
    currentBet: newCurrentBet,
    roundActors: newRoundActors,
    judgementCommittedIds,
    holeCardChangeSeeds: hangedManDealt
      ? {
          ...state.holeCardChangeSeeds,
          [players[playerIdx].id]: (state.holeCardChangeSeeds[players[playerIdx].id] ?? 0) + 1,
        }
      : state.holeCardChangeSeeds,
  };

  if (isBettingRoundComplete(next)) {
    return advanceStage(next);
  }

  const nextIdx = findNextActor(next);
  return { ...next, activePlayerIndex: nextIdx ?? next.activePlayerIndex };
}

// ─── Arcana application ───────────────────────────────────────────────────────

/** True when the hero has already folded this hand. */
function heroFolded(state: StoreGameState): boolean {
  return state.players.find((p) => p.id === HERO_ID)?.folded ?? true;
}

function applyArcana(
  state: StoreGameState,
  arcanaCard: ArcanaCard
): StoreGameState {
  const effectKey = ARCANA_EFFECT_KEYS[
    parseInt(arcanaCard.value)
  ] as ArcanaEffectKey;

  const activeArcana: ActiveArcana = { card: arcanaCard, effectKey };
  const base: StoreGameState = {
    ...state,
    activeArcana,
    arcanaTriggeredThisRound: true,
    isFinalHand: state.isFinalHand || arcanaCard.value === "21",
  };

  switch (effectKey) {
    // ── Immediate effects ─────────────────────────────────────────────────────

    case "hierophant-no-pages": {
      // Step 1: strip Pages from remaining deck
      let newDeck = base.deck.filter((c) => c.value !== "0");

      // Step 2: replace Pages in community cards
      const newCommunityCards = base.communityCards.map((c) => {
        if (c.value !== "0") return c;
        const [repl, ...rest] = newDeck;
        if (!repl) return c; // deck exhausted — keep page as fallback
        newDeck = rest;
        return repl;
      });

      // Step 3: replace Pages in hole cards; track which players changed
      const holeCardChangeSeeds = { ...base.holeCardChangeSeeds };
      const newPlayers = base.players.map((p) => {
        if (p.folded) return p;
        let changed = false;
        const newHoleCards = p.holeCards.map((c) => {
          if (c.value !== "0") return c;
          const [repl, ...rest] = newDeck;
          if (!repl) return c;
          newDeck = rest;
          changed = true;
          return repl;
        });
        if (changed) holeCardChangeSeeds[p.id] = (holeCardChangeSeeds[p.id] ?? 0) + 1;
        return changed ? { ...p, holeCards: newHoleCards } : p;
      });

      return {
        ...base,
        deck: newDeck,
        communityCards: newCommunityCards,
        players: newPlayers,
        communityChangeKey: base.communityChangeKey + 1,
        holeCardChangeSeeds,
      };
    }

    case "wheel-redeal": {
      // Pool only active players' hole cards, shuffle, and redeal the same counts.
      // Community cards and the remaining deck are untouched.
      const activePosns = base.players
        .map((_, i) => i)
        .filter((i) => !base.players[i].folded);

      // Record how many hole cards each active player had
      const holeCounts = activePosns.map((i) => base.players[i].holeCards.length);
      const pooled = shuffle(base.players.filter((p) => !p.folded).flatMap((p) => p.holeCards));

      let poolIdx = 0;
      const wheelPlayers = base.players.map((p) => ({ ...p }));
      for (let i = 0; i < activePosns.length; i++) {
        const count = holeCounts[i];
        wheelPlayers[activePosns[i]] = {
          ...wheelPlayers[activePosns[i]],
          holeCards: pooled.slice(poolIdx, poolIdx + count),
        };
        poolIdx += count;
      }

      return {
        ...base,
        players: wheelPlayers,
        wheelRound: (base.wheelRound ?? 0) + 1,
        // Clear card-specific arcana state that referenced the old cards
        temperanceCandidates: null,
        temperanceChoices: {},
        priestessRevealedCards: {},
        foolCardIndex: null,
        moonHiddenCommunityIndex: null,
        justiceRevealedPlayerId: null,
      };
    }

    case "death-end-now":
      return evaluateShowdown(base);

    case "sun-split-all": {
      // Pot split equally among active players
      const active = base.players.filter((p) => !p.folded);
      const share = Math.floor(base.potSize / active.length);
      const newPlayers = base.players.map((p) =>
        !p.folded ? { ...p, stack: p.stack + share } : p
      );
      return {
        ...base,
        stage: "showdown",
        players: newPlayers,
        potSize: 0,
        potWon: base.potSize,
        winnerIds: active.map((p) => p.id),
        handResults: [],
        pendingInteraction: null,
      };
    }

    case "tower-destroy-pot": {
      const ruins = Math.ceil(base.potSize / 2);
      return { ...base, potSize: base.potSize - ruins, ruinsPot: base.ruinsPot + ruins };
    }

    // ── Evaluation modifiers (tracked via activeArcana, applied at showdown) ──
    case "fool-wildcard": {
      if (base.communityCards.length === 0) return base;
      const idx = base.communityCards.length - 1;
      const replaced = [...base.communityCards];
      replaced[idx] = { value: "0", suit: "spades" };
      return {
        ...base,
        communityCards: replaced,
        foolCardIndex: idx,
        communityChangeKey: base.communityChangeKey + 1,
      };
    }
    case "strength-invert":
    case "emperor-highcard":
    case "hermit-hole-only":
    case "lovers-split-pot":
    case "devil-double-raise":
      return base;

    case "justice-reveal": {
      // Pick one random active (non-folded) player and reveal their hand
      const activePlayers = base.players.filter((p) => !p.folded);
      if (activePlayers.length === 0) return base;
      const chosen = activePlayers[Math.floor(Math.random() * activePlayers.length)];
      return { ...base, justiceRevealedPlayerId: chosen.id };
    }
    case "empress-sixth-card":
    case "world-final-hand":
      return base;

    // ── Hero-interaction effects ───────────────────────────────────────────────

    case "chariot-pass-left": {
      // Bots pass immediately; hero picks interactively
      const evalOpts = buildEvalOptions(base);
      const players = [...base.players] as GamePlayer[];

      // Collect bot passes
      const active = players.filter((p) => !p.folded);
      const passMap = new Map<string, StandardCard>();
      for (const p of active) {
        if (p.type === "ai") {
          passMap.set(p.id, chariotCardToPass(p.holeCards, evalOpts));
        }
      }

      // Apply bot passes (hero's pass applied on RESOLVE_CHARIOT)
      // The card a bot passes TO the hero is deferred into pendingInteraction.receivedCard
      // so the hero's holeCards stay at 2 during the pick dialog.
      let heroReceivedCard: StandardCard | undefined;
      for (let i = 0; i < active.length; i++) {
        const giver = active[i];
        if (giver.type !== "ai") continue;
        const receiver = active[(i + 1) % active.length];
        const card = passMap.get(giver.id)!;
        const gIdx = players.findIndex((p) => p.id === giver.id);
        const rIdx = players.findIndex((p) => p.id === receiver.id);
        if (gIdx !== -1 && rIdx !== -1) {
          players[gIdx] = {
            ...players[gIdx],
            holeCards: players[gIdx].holeCards.filter((c) => c !== card),
          };
          if (receiver.id === HERO_ID) {
            // Defer: add after hero picks their card to pass
            heroReceivedCard = card;
          } else {
            players[rIdx] = {
              ...players[rIdx],
              holeCards: [...players[rIdx].holeCards, card],
            };
          }
        }
      }

      return {
        ...base,
        players,
        pendingInteraction: heroFolded(base)
          ? null
          : { type: "chariot-pass", playerId: HERO_ID, receivedCard: heroReceivedCard },
      };
    }

    case "moon-hide-community": {
      // Return the chosen community card to the deck, draw a replacement face-down
      if (base.communityCards.length === 0) return base;
      const hiddenIdx = Math.floor(Math.random() * base.communityCards.length);
      const removed = base.communityCards[hiddenIdx];
      const deckWithReturned = shuffle([...base.deck, removed]);
      const { dealt, remaining } = dealCards(deckWithReturned, 1);
      const newCommunity = [...base.communityCards];
      newCommunity[hiddenIdx] = dealt[0];
      return {
        ...base,
        communityCards: newCommunity,
        deck: remaining,
        moonHiddenCommunityIndex: hiddenIdx,
        moonAffectedIndex: hiddenIdx,
        communityChangeKey: base.communityChangeKey + 1,
      };
    }

    case "star-discard-draw": {
      // Bots decide immediately; hero gets interaction
      let deck = base.deck;
      const players = [...base.players] as GamePlayer[];
      const evalOpts = buildEvalOptions(base);
      for (const p of players.filter((pl) => pl.type === "ai" && !pl.folded)) {
        const shouldDiscard = starShouldDiscard(
          p.holeCards,
          base.communityCards,
          evalOpts
        );
        if (shouldDiscard && p.holeCards.length > 0) {
          const pIdx = players.findIndex((pl) => pl.id === p.id);
          const cardToDiscard = chariotCardToPass(p.holeCards, evalOpts);
          const { dealt, remaining } = dealCards(deck, 1);
          deck = remaining;
          players[pIdx] = {
            ...players[pIdx],
            holeCards: [
              ...p.holeCards.filter((c) => c !== cardToDiscard),
              dealt[0],
            ],
          };
        }
      }
      return {
        ...base,
        players,
        deck,
        pendingInteraction: heroFolded(base)
          ? null
          : { type: "star-discard", playerId: HERO_ID },
      };
    }

    case "judgement-no-fold":
      // Passive enforcement: players who bet/raise may not fold for the rest of the hand.
      // No immediate side effect on arcana reveal — tracking happens in processPlayerAction.
      return base;

    case "priestess-reveal": {
      // Bots each reveal their lower-value hole card immediately
      const priestessRevealedCards = { ...base.priestessRevealedCards };
      for (const p of base.players.filter((pl) => pl.type === "ai" && !pl.folded)) {
        if (p.holeCards.length === 0) continue;
        const sorted = [...p.holeCards].sort(
          (a, b) => (CARD_NUMERIC_VALUES[a.value] ?? 0) - (CARD_NUMERIC_VALUES[b.value] ?? 0)
        );
        priestessRevealedCards[p.id] = sorted[0];
      }
      return {
        ...base,
        priestessRevealedCards,
        pendingInteraction: heroFolded(base)
          ? null
          : { type: "priestess-reveal", playerId: HERO_ID },
      };
    }

    case "magician-redraw":
      // Effect fires at showdown boundary (applyMagicianRedraw), not on arcana reveal
      return base;

    case "temperance-three-river":
      // Handled in advanceStage when turn ends
      return base;

    case "hanged-man-extra-allin":
      // Persistent: extra card is dealt inside processPlayerAction when a player goes all-in
      return base;

    default:
      return base;
  }
}

// ─── Interaction resolutions ──────────────────────────────────────────────────

function resolveChariot(
  state: StoreGameState,
  heroCard: StandardCard
): StoreGameState {
  const active = state.players.filter((p) => !p.folded);
  const players = [...state.players] as GamePlayer[];

  // Hero is in active; find their index
  const heroActiveIdx = active.findIndex((p) => p.id === HERO_ID);
  if (heroActiveIdx === -1) return { ...state, pendingInteraction: null };

  const receiver = active[(heroActiveIdx + 1) % active.length];
  const hIdx = players.findIndex((p) => p.id === HERO_ID);
  const rIdx = players.findIndex((p) => p.id === receiver.id);

  // Remove the card the hero chose to pass
  const heroHoleCards = players[hIdx].holeCards.filter((c) => c !== heroCard);

  // Apply the card the hero was supposed to receive (deferred from chariot-pass-left)
  const receivedCard =
    state.pendingInteraction?.type === "chariot-pass"
      ? state.pendingInteraction.receivedCard
      : undefined;

  players[hIdx] = {
    ...players[hIdx],
    holeCards: receivedCard ? [...heroHoleCards, receivedCard] : heroHoleCards,
  };
  players[rIdx] = {
    ...players[rIdx],
    holeCards: [...players[rIdx].holeCards, heroCard],
  };

  return { ...state, players, pendingInteraction: null };
}

function resolveTemperance(
  state: StoreGameState,
  chosenCard: StandardCard
): StoreGameState {
  const postFlopStart = firstActiveAfter(state.players, state.dealerIndex);
  // Store hero's personal river choice; communityCards stays at 4 cards
  const next = resetBettingRound(
    {
      ...state,
      temperanceChoices: { ...state.temperanceChoices, [HERO_ID]: chosenCard },
      pendingInteraction: null,
    },
    postFlopStart
  );
  if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
  return next;
}

function resolveStar(
  state: StoreGameState,
  card: StandardCard | null
): StoreGameState {
  if (!card) return { ...state, pendingInteraction: null };

  const hIdx = state.players.findIndex((p) => p.id === HERO_ID);
  const hero = state.players[hIdx];
  const { dealt, remaining } = dealCards(state.deck, 1);
  const players = [...state.players] as GamePlayer[];
  players[hIdx] = {
    ...hero,
    holeCards: [...hero.holeCards.filter((c) => c !== card), dealt[0]],
  };

  return {
    ...state,
    players,
    deck: remaining,
    pendingInteraction: null,
    holeCardChangeSeeds: {
      ...state.holeCardChangeSeeds,
      [HERO_ID]: (state.holeCardChangeSeeds[HERO_ID] ?? 0) + 1,
    },
  };
}


function resolveMagician(
  state: StoreGameState,
  redraw: boolean
): StoreGameState {
  const hIdx = state.players.findIndex((p) => p.id === HERO_ID);
  let players = [...state.players] as GamePlayer[];
  let deck = state.deck;
  let holeCardChangeSeeds = { ...state.holeCardChangeSeeds };

  if (redraw && hIdx !== -1) {
    const { dealt, remaining } = dealCards(deck, 2);
    deck = remaining;
    players[hIdx] = { ...players[hIdx], holeCards: dealt };
    holeCardChangeSeeds[HERO_ID] = (holeCardChangeSeeds[HERO_ID] ?? 0) + 1;
  }

  return evaluateShowdown({ ...state, players, deck, holeCardChangeSeeds, pendingInteraction: null });
}


function resolvePriestess(
  state: StoreGameState,
  card: StandardCard
): StoreGameState {
  return {
    ...state,
    priestessRevealedCards: {
      ...state.priestessRevealedCards,
      [HERO_ID]: card,
    },
    pendingInteraction: null,
  };
}

// ─── Challenge of the Page ────────────────────────────────────────────────────

function resolvePageChallenge(state: StoreGameState): StoreGameState {
  const pageWinners = state.players.filter(
    (p) => state.winnerIds.includes(p.id) && p.holeCards.some((c) => c.value === "0")
  );

  if (pageWinners.length === 0) return { ...state, pendingInteraction: null };

  const players = [...state.players] as GamePlayer[];

  for (const winner of pageWinners) {
    let totalCollected = 0;
    for (let i = 0; i < players.length; i++) {
      if (players[i].id === winner.id) continue;
      const payment = Math.min(state.bigBlind, players[i].stack);
      players[i] = { ...players[i], stack: players[i].stack - payment };
      totalCollected += payment;
    }
    const wIdx = players.findIndex((p) => p.id === winner.id);
    players[wIdx] = { ...players[wIdx], stack: players[wIdx].stack + totalCollected };
  }

  return { ...state, players, pendingInteraction: null };
}

// ─── Next hand prep ───────────────────────────────────────────────────────────

function prepareNextHand(state: StoreGameState): StoreGameState {
  const heroAlive = state.players.some(
    (p) => p.id === HERO_ID && p.stack > 0,
  );
  const isGameOver = state.isFinalHand || !heroAlive;

  if (isGameOver) {
    // Preserve players with current stacks so the modal can show final standings.
    return { ...state, stage: "game-over" };
  }

  const n = state.players.length;
  const newDealer = (state.dealerIndex + 1) % n;
  const activePlayers = state.players.filter((p) => p.stack > 0);

  return {
    ...state,
    players: activePlayers,
    dealerIndex: newDealer % activePlayers.length,
    handNumber: state.handNumber + 1,
    activeArcana: null,
    arcanaTriggeredThisRound: false,
    justiceRevealedPlayerId: null,
    moonHiddenCommunityIndex: null,
    // ruinsPot carries forward; mark it ready to be awarded at next showdown
    ruinsPotReady: state.ruinsPot > 0,
  };
}

// ─── Main reducer ─────────────────────────────────────────────────────────────

export function gameReducer(
  state: StoreGameState,
  action: GameAction
): StoreGameState {
  switch (action.type) {
    case "START_GAME":
      return startHand(createInitialState());

    case "PLAYER_ACTION":
      return processPlayerAction(state, action.payload);

    case "RESOLVE_CHARIOT":
      return resolveChariot(state, action.payload.card);

    case "RESOLVE_TEMPERANCE":
      return resolveTemperance(state, action.payload.card);

    case "RESOLVE_STAR":
      return resolveStar(state, action.payload.card);


    case "RESOLVE_MAGICIAN":
      return resolveMagician(state, action.payload.redraw);

    case "RESOLVE_PRIESTESS":
      return resolvePriestess(state, action.payload.card);

    case "REVEAL_ARCANA": {
      if (state.pendingInteraction?.type !== "arcana-reveal") return state;
      const { arcanaCard } = state.pendingInteraction;
      return applyArcana({ ...state, pendingInteraction: null }, arcanaCard);
    }

    case "RESOLVE_PAGE_CHALLENGE":
      return resolvePageChallenge(state);

    case "NEXT_HAND": {
      const prepared = prepareNextHand(state);
      return prepared.stage === "game-over" ? prepared : startHand(prepared);
    }

    case "FORCE_ARCANA": {
      const VALID_STAGES = ["pre-flop", "flop", "turn", "river", "empress"] as const;
      if (!(VALID_STAGES as readonly GameStage[]).includes(state.stage)) return state;
      const arcanaCard = { suit: "arcana" as const, value: action.payload.value };
      const resetState: StoreGameState = {
        ...state,
        activeArcana: null,
        arcanaTriggeredThisRound: false,
      };
      return applyArcana(resetState, arcanaCard);
    }

    case "TUTORIAL_OVERRIDE_DEAL": {
      const { dealerIndex, playerHoleCards, communityCardQueue, arcanaOverride } = action.payload;
      const n = state.players.length;
      const sbIdx = (dealerIndex + 1) % n;
      const bbIdx = (dealerIndex + 2) % n;
      const utgIdx = (dealerIndex + 3) % n;

      const players = state.players.map((p, idx) => {
        const scripted = playerHoleCards[p.id];
        const isSB = idx === sbIdx;
        const isBB = idx === bbIdx;

        // Undo any blind already posted by a prior startHand call before re-posting
        // at the correct tutorial positions. p.currentBet holds whatever was posted.
        const cleanStack = p.stack + p.currentBet;

        const sbPaidT = isSB ? Math.min(state.smallBlind, cleanStack) : 0;
        const bbPaidT = isBB ? Math.min(state.bigBlind, cleanStack) : 0;
        const paid = sbPaidT || bbPaidT;
        return {
          ...p,
          holeCards: scripted ?? p.holeCards,
          currentBet: paid,
          stack: cleanStack - paid,
          folded: false,
          isAllIn: (isSB && cleanStack <= state.smallBlind) || (isBB && cleanStack <= state.bigBlind),
          currentAction: isSB
            ? ("smallBlind" as const)
            : isBB
            ? ("bigBlind" as const)
            : undefined,
        };
      });

      const tutSbPaid = players[sbIdx].currentBet;
      const tutBbPaid = players[bbIdx].currentBet;

      return {
        ...state,
        stage: "pre-flop",
        players,
        communityCards: [],
        dealerIndex,
        activePlayerIndex: utgIdx,
        currentBet: tutBbPaid,
        potSize: tutSbPaid + tutBbPaid,
        roundActors: [],
        arcanaTriggeredThisRound: false,
        activeArcana: null,
        pendingInteraction: null,
        foolCardIndex: null,
        moonAffectedIndex: null,
        winnerIds: [],
        handResults: [],
        potWon: 0,
        communityCardQueue,
        arcanaOverride,
      };
    }

    default:
      return state;
  }
}
