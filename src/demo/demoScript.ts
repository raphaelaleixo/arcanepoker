// src/demo/demoScript.ts
//
// Scripted hand for the /demo route.
// Based on tutorial Round 2, with The Fool moved to the river:
//
//   Hero:  10♣ + Q♣
//   Flop:  A♣  J♣  6♥           (no Page, no arcana trigger)
//   Turn:  3♦
//   River: Page♣  →  The Fool   (wildcard replaces Page at index 4)
//
//   Hero best hand:  10♣ J♣ Q♣ Fool(=K♣) A♣ = Royal Flush
//   Bot-cups:        A♥  A♦  A♣(board) Fool(=A) = Four of a Kind (Aces)

import type { TutorialRound } from "../tutorial/tutorialScript";

export const DEMO_SCRIPT: TutorialRound = {
  dealerIndex: 4,
  playerHoleCards: {
    hero: [
      { value: "10", suit: "clubs" },
      { value: "Q", suit: "clubs" },
    ],
    "bot-swords": [
      { value: "5", suit: "spades" },
      { value: "7", suit: "clubs" },
    ], // folds pre-flop
    "bot-cups": [
      { value: "A", suit: "hearts" },
      { value: "A", suit: "diamonds" },
    ], // three of a kind (aces) → showdown
    "bot-wands": [
      { value: "2", suit: "clubs" },
      { value: "8", suit: "diamonds" },
    ], // folds on turn
    "bot-pentacles": [
      { value: "4", suit: "diamonds" },
      { value: "9", suit: "hearts" },
    ], // folds on river
  },
  communityCardQueue: [
    { value: "A", suit: "clubs" },    // flop 1 — gives Mystic three Aces on board; Fool = 4th Ace → four of a kind
    { value: "J", suit: "clubs" },    // flop 2
    { value: "6", suit: "hearts" },   // flop 3
    { value: "3", suit: "diamonds" }, // turn
    { value: "0", suit: "clubs" },    // river — Page♣ triggers arcana; Fool replaces index 4
  ],
  arcanaOverride: { suit: "arcana", value: "0" }, // The Fool
  heroActions: {
    river: "raise", // hero checks first (toCall=0), then raises after bot-cups bets
  },
  botActions: [
    // Pre-flop
    { playerId: "bot-swords",    stage: "pre-flop", action: "fold" },
    { playerId: "bot-cups",      stage: "pre-flop", action: "raise", amount: 40 },
    { playerId: "bot-wands",     stage: "pre-flop", action: "call" },
    { playerId: "bot-pentacles", stage: "pre-flop", action: "call" },
    // Flop: Merchant(pentacles) first, Hero last
    { playerId: "bot-pentacles", stage: "flop", action: "bet",  amount: 20 },
    { playerId: "bot-cups",      stage: "flop", action: "call" },
    { playerId: "bot-wands",     stage: "flop", action: "call" },
    // Turn: hero checks first; pentacles bets; cups calls; wands folds; hero re-acts (call)
    { playerId: "bot-pentacles", stage: "turn", action: "bet",  amount: 40 },
    { playerId: "bot-cups",      stage: "turn", action: "call" },
    { playerId: "bot-wands",     stage: "turn", action: "fold" },
    // River: Page♣ dealt → Fool reveals → betting begins
    // hero checks first; pentacles checks; cups bets; pentacles folds;
    // hero raises (heroActions.river="raise"); cups calls
    { playerId: "bot-pentacles", stage: "river", action: "check" },
    { playerId: "bot-cups",      stage: "river", action: "bet",  amount: 40 },
    { playerId: "bot-pentacles", stage: "river", action: "fold" },
    { playerId: "bot-cups",      stage: "river", action: "all-in" }, // after hero raises — Mystic goes all-in
  ],
  narrations: [], // unused — DemoContext does not show narrations
};
