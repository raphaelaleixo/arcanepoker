/**
 * AI Decision Engine
 *
 * Each bot archetype maps to a playing style:
 *   Swords   → Tight-Aggressive   (plays few hands, raises hard)
 *   Cups     → Loose-Aggressive   (plays many hands, raises often, bluffs)
 *   Pentacles → Tight-Passive     (plays few hands, checks/calls, rarely raises)
 *   Wands    → Loose-Passive      (plays many hands, mostly calls)
 *
 * Bots adapt their decisions based on the active Major Arcana effect.
 */

import type { StandardCard } from "../types/types";
import type { AIDecision, BotPersonality, ArcanaEffectKey } from "../types/game";
import { BOT_PERSONALITIES } from "../types/game";
import type { EvalOptions } from "./handEvaluator";
import { evaluateBestHand, compareHands, combinations } from "./handEvaluator";

// ─── Context passed to the AI per decision ────────────────────────────────────

export interface AIContext {
  holeCards: StandardCard[];
  communityCards: StandardCard[];
  /** Amount the bot must add to its current bet to stay in */
  toCall: number;
  potSize: number;
  playerStack: number;
  bigBlind: number;
  personality: BotPersonality;
  evalOptions: EvalOptions;
  /** Active arcana effect (if any) — used for archetype-specific adaptations */
  activeArcanaEffect: ArcanaEffectKey | null;
}

// ─── Arcana-specific archetype adaptations ────────────────────────────────────

interface PersonalityOverride {
  foldUnderPressure?: number;
  aggressionMultiplier?: number;
  bluffChance?: number;
}

function arcanaOverride(
  personality: BotPersonality,
  effect: ArcanaEffectKey | null
): PersonalityOverride {
  if (!effect) return {};

  switch (effect) {
    case "lovers-split-pot":
      // Less incentive to raise — pot will be split regardless
      return { aggressionMultiplier: personality.aggressionMultiplier * 0.4 };

    case "tower-destroy-pot":
      // Half pot destroyed → Pentacles Bot panics, everyone tightens slightly
      if (personality.archetype === "pentacles") {
        return {
          foldUnderPressure: Math.min(0.9, personality.foldUnderPressure * 2.5),
          aggressionMultiplier: personality.aggressionMultiplier * 0.3,
        };
      }
      return { aggressionMultiplier: personality.aggressionMultiplier * 0.7 };

    case "devil-double-raise":
      // Raising costs more → reduce aggression, increase fold threshold
      return {
        aggressionMultiplier: personality.aggressionMultiplier * 0.6,
        foldUnderPressure: Math.min(0.8, personality.foldUnderPressure + 0.2),
      };

    case "sun-split-all":
    case "death-end-now":
      // Round ending — no point raising
      return { aggressionMultiplier: 0 };

    case "wheel-redeal":
      // Fresh start incoming — fold everything marginal
      return { foldUnderPressure: 0.9 };

    case "strength-invert":
      // Swords and Cups love inversion (low pairs become powerful)
      if (
        personality.archetype === "swords" ||
        personality.archetype === "cups"
      ) {
        return { aggressionMultiplier: personality.aggressionMultiplier * 1.3 };
      }
      return {};

    default:
      return {};
  }
}

// ─── Bot-specific Arcana interaction logic (spec requirements) ────────────────

/**
 * Chariot: bot passes its lowest card that doesn't contribute to a pair or draw.
 * Returns the index into holeCards to pass (0 or 1 for standard 2-card hands).
 */
export function chariotCardToPass(
  holeCards: StandardCard[],
  evalOptions: EvalOptions
): StandardCard {
  if (holeCards.length === 1) return holeCards[0];

  // Evaluate what each card contributes
  const handWithBoth = evaluateBestHand(holeCards, evalOptions);

  // Try removing each card and see if the rank drops
  let worstCard = holeCards[0];
  let lowestContribution = Infinity;

  for (const card of holeCards) {
    const remaining = holeCards.filter((c) => c !== card);
    const handWithout = evaluateBestHand(remaining, evalOptions);

    // If removing this card doesn't drop the hand rank, it contributes little
    const contribution = handWithBoth.rankValue - handWithout.rankValue;
    if (contribution < lowestContribution) {
      lowestContribution = contribution;
      worstCard = card;
    }
  }

  return worstCard;
}

/**
 * Star: bot discards its lowest card only if hand is worse than a pair
 * AND there is no straight/flush draw potential. Spec AI rule.
 */
export function starShouldDiscard(
  holeCards: StandardCard[],
  communityCards: StandardCard[],
  evalOptions: EvalOptions
): boolean {
  const available = [...holeCards, ...communityCards];
  const hand = evaluateBestHand(available, evalOptions);

  // Don't discard if already has a pair or better
  if (hand.rankValue >= 1) return false;

  // Simple draw detection: 4+ cards of same suit = flush draw
  const suitCounts = new Map<string, number>();
  for (const c of available) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }
  const hasFlushDraw = [...suitCounts.values()].some((n) => n >= 4);

  // Simple straight draw: any 4 consecutive values in available cards
  const vals = [
    ...new Set(
      available.map((c) =>
        c.value === "0"
          ? 0
          : c.value === "A"
          ? 14
          : c.value === "J"
          ? 11
          : c.value === "Q"
          ? 12
          : c.value === "K"
          ? 13
          : parseInt(c.value)
      )
    ),
  ].sort((a, b) => a - b);

  let maxConsecutive = 1;
  let current = 1;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] === vals[i - 1] + 1) {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 1;
    }
  }
  const hasStraightDraw = maxConsecutive >= 4;

  return !hasFlushDraw && !hasStraightDraw;
}

/**
 * Moon: bot swaps its optional 3rd hole card only if it improves the final hand rank.
 */
export function moonShouldSwap(
  holeCards: StandardCard[],
  thirdCard: StandardCard,
  communityCards: StandardCard[],
  evalOptions: EvalOptions
): boolean {
  const withoutThird = evaluateBestHand(
    [...holeCards.slice(0, 2), ...communityCards],
    evalOptions
  );
  const withThird = evaluateBestHand(
    [...holeCards.slice(0, 2), thirdCard, ...communityCards],
    evalOptions
  );
  return withThird.rankValue > withoutThird.rankValue;
}

/**
 * Magician: bot redraws both hole cards only if the current best hand is high-card or pair.
 */
export function magicianShouldRedraw(
  holeCards: StandardCard[],
  communityCards: StandardCard[],
  evalOptions: EvalOptions
): boolean {
  const hand = evaluateBestHand([...holeCards, ...communityCards], evalOptions);
  return hand.rankValue < 2; // redraw if high-card (0) or pair (1)
}

// ─── Main AI decision function ────────────────────────────────────────────────

export function makeAIDecision(ctx: AIContext): AIDecision {
  const {
    holeCards,
    communityCards,
    toCall,
    potSize,
    playerStack,
    bigBlind,
    personality,
    evalOptions,
    activeArcanaEffect,
  } = ctx;

  // Apply arcana overrides to personality
  const override = arcanaOverride(personality, activeArcanaEffect);
  const foldUnderPressure =
    override.foldUnderPressure ?? personality.foldUnderPressure;
  const aggressionMultiplier =
    override.aggressionMultiplier ?? personality.aggressionMultiplier;
  const bluffChance = override.bluffChance ?? personality.bluffChance;

  // Determine available cards based on active arcana
  let hand;
  if (activeArcanaEffect === "hermit-hole-only") {
    hand = evaluateBestHand(holeCards, evalOptions);
  } else if (activeArcanaEffect === "temperance-three-river" && communityCards.length >= 3) {
    // Must use both hole cards + exactly 3 of the community cards
    const commCombos = combinations(communityCards, 3);
    hand = commCombos
      .map((comm) => evaluateBestHand([...holeCards, ...comm], evalOptions))
      .reduce((best, h) => (compareHands(h, best) > 0 ? h : best));
  } else {
    hand = evaluateBestHand([...holeCards, ...communityCards], evalOptions);
  }
  const handStrength = hand.rankValue; // 0–9

  // Bluff decision
  const isBluffing = Math.random() < bluffChance;
  const effectiveStrength = isBluffing
    ? Math.max(handStrength, personality.tightnessThreshold)
    : handStrength;

  const canCheck = toCall === 0;

  // Pot odds: what fraction of the final pot we're risking
  const potOddsRatio = potSize > 0 ? toCall / (potSize + toCall) : 0;

  // ── All-in edge case ──────────────────────────────────────────────────────
  if (toCall >= playerStack) {
    const shouldCallAllin =
      effectiveStrength >= personality.tightnessThreshold + 2 ||
      (isBluffing && Math.random() > 0.5);
    return shouldCallAllin
      ? { action: "all-in", amount: playerStack }
      : { action: "fold" };
  }

  // ── Check situation (no bet to face) ─────────────────────────────────────
  if (canCheck) {
    if (effectiveStrength >= 5 && aggressionMultiplier > 0) {
      const raiseAmt = Math.min(
        Math.max(
          Math.floor(potSize * aggressionMultiplier),
          bigBlind * 2
        ),
        playerStack
      );
      return { action: "raise", amount: raiseAmt };
    }
    return { action: "check" };
  }

  // ── Facing a bet ──────────────────────────────────────────────────────────

  // Very strong hand: re-raise
  if (effectiveStrength >= 7 && aggressionMultiplier > 0.3) {
    const raiseAmt = Math.min(
      Math.max(
        Math.floor(toCall * 2.5 * aggressionMultiplier),
        bigBlind * 3
      ),
      playerStack
    );
    return { action: "raise", amount: raiseAmt };
  }

  // Marginal hand: call if pot odds justify it or hand meets threshold
  if (
    effectiveStrength >= personality.tightnessThreshold ||
    potOddsRatio < 0.2
  ) {
    return { action: "call", amount: toCall };
  }

  // Weak hand under pressure
  if (Math.random() < foldUnderPressure) {
    return { action: "fold" };
  }

  // Weak hand, small bet — call as a bluff catcher
  if (toCall <= bigBlind && Math.random() > 0.4) {
    return { action: "call", amount: toCall };
  }

  return { action: "fold" };
}

// ─── Convenience factory ──────────────────────────────────────────────────────

export { BOT_PERSONALITIES };
