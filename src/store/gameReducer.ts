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
  moonShouldSwap,
  judgementShouldRejoin,
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
    emperorActive: key === "emperor-kickers",
    foolActive: key === "fool-wildcard",
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

  const [arcanaCard, ...remainingArcanaDeck] = state.arcanaDeck;
  if (!arcanaCard) return state;

  // Pause for the hero to reveal the arcana before applying its effect
  return {
    ...state,
    arcanaDeck: remainingArcanaDeck,
    arcanaTriggeredThisRound: true,
    pendingInteraction: { type: "arcana-reveal", arcanaCard },
  };
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
      const { dealt, remaining } = dealCards(state.deck, 3);
      let next = resetBettingRound(
        { ...state, stage: "flop", communityCards: dealt, deck: remaining },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      // If all eligible players can't act (everyone all-in/folded), run the board
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }

    case "flop": {
      const { dealt, remaining } = dealCards(state.deck, 1);
      let next = resetBettingRound(
        {
          ...state,
          stage: "turn",
          communityCards: [...state.communityCards, dealt[0]],
          deck: remaining,
        },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
      if (eligiblePlayers(next.players).length <= 1) return advanceStage(next);
      return next;
    }

    case "turn": {
      const { dealt, remaining } = dealCards(state.deck, 1);
      let next = resetBettingRound(
        {
          ...state,
          stage: "river",
          communityCards: [...state.communityCards, dealt[0]],
          deck: remaining,
        },
        postFlopStart
      );
      next = checkPageTrigger(next, dealt);
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
      return evaluateShowdown(state);
    }

    case "empress":
      return evaluateShowdown(state);

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

  const perWinner = Math.floor(state.potSize / winnerIds.length);
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
    potWon: state.potSize,
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
  players[sbIdx] = {
    ...players[sbIdx],
    currentBet: state.smallBlind,
    stack: players[sbIdx].stack - state.smallBlind,
    currentAction: "smallBlind",
  };
  players[bbIdx] = {
    ...players[bbIdx],
    currentBet: state.bigBlind,
    stack: players[bbIdx].stack - state.bigBlind,
    currentAction: "bigBlind",
  };

  return {
    ...state,
    stage: "pre-flop",
    players,
    deck: remaining,
    communityCards: [],
    potSize: state.smallBlind + state.bigBlind,
    currentBet: state.bigBlind,
    dealerIndex: state.dealerIndex,
    activePlayerIndex: utgIdx,
    roundActors: [],
    arcanaTriggeredThisRound: false,
    activeArcana: null,
    empress6thCardDealt: false,
    moonExtraCards: {},
    temperanceCandidates: null,
    temperanceChoices: {},
    priestessRevealedCards: {},
    foolCardIndex: null,
    winnerIds: [],
    handResults: [],
    potWon: 0,
    pendingInteraction: null,
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

  // Check if only one player remains (everyone else folded)
  const activePlayers = players.filter((p) => !p.folded);
  if (activePlayers.length === 1) {
    return goToLastPlayerWins(state, players, newPot, activePlayers[0].id);
  }

  const next: StoreGameState = {
    ...state,
    players,
    deck: hangedManDeck,
    potSize: newPot,
    currentBet: newCurrentBet,
    roundActors: newRoundActors,
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

  // Hierophant shield cancels the next arcana
  if (state.hierophantShield) {
    return { ...state, hierophantShield: false, arcanaTriggeredThisRound: true };
  }

  const activeArcana: ActiveArcana = { card: arcanaCard, effectKey };
  const base: StoreGameState = {
    ...state,
    activeArcana,
    arcanaTriggeredThisRound: true,
    isFinalHand: state.isFinalHand || arcanaCard.value === "21",
  };

  switch (effectKey) {
    // ── Immediate effects ─────────────────────────────────────────────────────

    case "hierophant-persist":
      return { ...base, hierophantShield: true };

    case "wheel-redeal": {
      // Collect all in-play cards (deck + hole cards + community) into one shuffled deck
      const allCards = [
        ...base.deck,
        ...base.players.flatMap((p) => p.holeCards),
        ...base.communityCards,
      ];
      let wheelDeck = shuffle(allCards);

      // Re-deal 2 hole cards to every non-folded player, preserving deal order
      const wheelPlayers = base.players.map((p) => ({ ...p, holeCards: [] as typeof p.holeCards }));
      const activePosns = wheelPlayers
        .map((_, i) => i)
        .filter((i) => !wheelPlayers[i].folded);
      for (let round = 0; round < 2; round++) {
        for (const idx of activePosns) {
          const { dealt, remaining } = dealCards(wheelDeck, 1);
          wheelPlayers[idx] = {
            ...wheelPlayers[idx],
            holeCards: [...wheelPlayers[idx].holeCards, dealt[0]],
          };
          wheelDeck = remaining;
        }
      }

      // Deal community cards matching the current stage
      const communityCounts: Partial<Record<typeof base.stage, number>> = {
        "pre-flop": 0,
        flop: 3,
        turn: 4,
        river: base.empress6thCardDealt ? 6 : 5,
      };
      const communityCount = communityCounts[base.stage] ?? 0;
      const { dealt: newCommunity, remaining: wheelFinalDeck } = dealCards(wheelDeck, communityCount);

      return {
        ...base,
        players: wheelPlayers,
        deck: wheelFinalDeck,
        communityCards: newCommunity,
        wheelRound: (base.wheelRound ?? 0) + 1,
        // Clear card-specific arcana state that referenced the old cards
        moonExtraCards: {},
        temperanceCandidates: null,
        temperanceChoices: {},
        priestessRevealedCards: {},
        foolCardIndex: null,
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
      const destroyed = Math.ceil(base.potSize / 2);
      return { ...base, potSize: base.potSize - destroyed };
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
      };
    }
    case "strength-invert":
    case "emperor-kickers":
    case "hermit-hole-only":
    case "lovers-split-pot":
    case "devil-double-raise":
    case "justice-partial-bet":
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

    case "moon-third-card": {
      // Deal each active player a 3rd hole card face down
      let deck = base.deck;
      const players = [...base.players] as GamePlayer[];
      const moonExtras: Record<string, StandardCard> = {};
      for (const p of players.filter((pl) => !pl.folded)) {
        const { dealt, remaining } = dealCards(deck, 1);
        moonExtras[p.id] = dealt[0];
        deck = remaining;
        // Bots decide immediately
        if (p.type === "ai") {
          const evalOpts = buildEvalOptions(base);
          const shouldSwap = moonShouldSwap(
            p.holeCards,
            dealt[0],
            base.communityCards,
            evalOpts
          );
          if (shouldSwap) {
            const pIdx = players.findIndex((pl) => pl.id === p.id);
            players[pIdx] = {
              ...players[pIdx],
              holeCards: [...p.holeCards, dealt[0]],
            };
          }
        }
      }
      return {
        ...base,
        players,
        deck,
        moonExtraCards: moonExtras,
        pendingInteraction: heroFolded(base)
          ? null
          : { type: "moon-swap", playerId: HERO_ID },
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
          const sorted = [...p.holeCards].sort(
            (a, b) =>
              (CARD_NUMERIC_VALUES[a.value] ?? 0) -
              (CARD_NUMERIC_VALUES[b.value] ?? 0)
          );
          const { dealt, remaining } = dealCards(deck, 1);
          deck = remaining;
          players[pIdx] = {
            ...players[pIdx],
            holeCards: [
              ...p.holeCards.filter((c) => c !== sorted[0]),
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

    case "judgement-rejoin": {
      // Bots that qualify auto-rejoin
      let deck = base.deck;
      const players = [...base.players] as GamePlayer[];
      let potDelta = 0;
      for (const p of players.filter((pl) => pl.folded && pl.type === "ai")) {
        if (judgementShouldRejoin(p.stack, base.bigBlind)) {
          const { dealt, remaining } = dealCards(deck, 2);
          deck = remaining;
          const pIdx = players.findIndex((pl) => pl.id === p.id);
          players[pIdx] = {
            ...players[pIdx],
            folded: false,
            holeCards: dealt,
            stack: p.stack - base.bigBlind,
          };
          potDelta += base.bigBlind;
        }
      }
      return {
        ...base,
        players,
        deck,
        potSize: base.potSize + potDelta,
        // Only prompt hero to rejoin if they actually folded this hand
        pendingInteraction: heroFolded(base)
          ? { type: "judgement-return", playerId: HERO_ID }
          : null,
      };
    }

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

    case "magician-extra-card": {
      // Bots guess a random suit immediately
      let deck = base.deck;
      const players = [...base.players] as GamePlayer[];
      const suits = ["hearts", "clubs", "diamonds", "spades"];
      for (const p of players.filter((pl) => pl.type === "ai" && !pl.folded)) {
        const guess = suits[Math.floor(Math.random() * suits.length)];
        const { dealt: botDealt, remaining: botRem } = dealCards(deck, 1);
        deck = botRem;
        if (botDealt[0].suit === guess) {
          const pIdx = players.findIndex((pl) => pl.id === p.id);
          players[pIdx] = {
            ...players[pIdx],
            holeCards: [...players[pIdx].holeCards, botDealt[0]],
          };
        }
      }
      return {
        ...base,
        players,
        deck,
        pendingInteraction: heroFolded(base)
          ? null
          : { type: "magician-guess", playerId: HERO_ID },
      };
    }

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
  discard: boolean
): StoreGameState {
  if (!discard) return { ...state, pendingInteraction: null };

  const hIdx = state.players.findIndex((p) => p.id === HERO_ID);
  const hero = state.players[hIdx];
  const { dealt, remaining } = dealCards(state.deck, 1);

  // Discard hero's lowest card (by raw numeric value) and draw a new one
  const sorted = [...hero.holeCards].sort(
    (a, b) => (CARD_NUMERIC_VALUES[a.value] ?? 0) - (CARD_NUMERIC_VALUES[b.value] ?? 0)
  );
  const players = [...state.players] as GamePlayer[];
  players[hIdx] = {
    ...hero,
    holeCards: [...hero.holeCards.filter((c) => c !== sorted[0]), dealt[0]],
  };

  return {
    ...state,
    players,
    deck: remaining,
    pendingInteraction: null,
  };
}

function resolveMoon(state: StoreGameState, swap: boolean): StoreGameState {
  if (!swap) return { ...state, pendingInteraction: null };

  const hIdx = state.players.findIndex((p) => p.id === HERO_ID);
  const thirdCard = state.moonExtraCards[HERO_ID];
  if (!thirdCard) return { ...state, pendingInteraction: null };

  const players = [...state.players] as GamePlayer[];
  players[hIdx] = {
    ...players[hIdx],
    holeCards: [...players[hIdx].holeCards, thirdCard],
  };

  return { ...state, players, pendingInteraction: null };
}

function resolveMagician(
  state: StoreGameState,
  suit: string
): StoreGameState {
  // Hero draws top card; if its suit matches guess, hero keeps it
  // (bots already resolved their guesses in applyArcana)
  const { dealt, remaining } = dealCards(state.deck, 1);
  const drawnCard = dealt[0];
  const correct = drawnCard.suit === suit;

  const hIdx = state.players.findIndex((p) => p.id === HERO_ID);
  const players = [...state.players] as GamePlayer[];

  if (correct) {
    players[hIdx] = {
      ...players[hIdx],
      holeCards: [...players[hIdx].holeCards, drawnCard],
    };
  }

  return { ...state, players, deck: remaining, pendingInteraction: null };
}

function resolveJudgement(
  state: StoreGameState,
  rejoin: boolean
): StoreGameState {
  if (!rejoin) return { ...state, pendingInteraction: null };

  const hIdx = state.players.findIndex((p) => p.id === HERO_ID);
  const hero = state.players[hIdx];

  // Guard: can only rejoin if actually folded
  if (!hero?.folded) return { ...state, pendingInteraction: null };
  const { dealt, remaining } = dealCards(state.deck, 2);
  const players = [...state.players] as GamePlayer[];
  players[hIdx] = {
    ...hero,
    folded: false,
    holeCards: dealt,
    stack: hero.stack - state.bigBlind,
  };

  return {
    ...state,
    players,
    deck: remaining,
    potSize: state.potSize + state.bigBlind,
    pendingInteraction: null,
  };
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
    (p) => p.id === HERO_ID_CONST && p.stack > 0,
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
      return resolveStar(state, action.payload.discard);

    case "RESOLVE_MOON":
      return resolveMoon(state, action.payload.swap);

    case "RESOLVE_MAGICIAN":
      return resolveMagician(state, action.payload.suit);

    case "RESOLVE_JUDGEMENT":
      return resolveJudgement(state, action.payload.rejoin);

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
        hierophantShield: false,
        arcanaTriggeredThisRound: false,
      };
      return applyArcana(resetState, arcanaCard);
    }

    default:
      return state;
  }
}
