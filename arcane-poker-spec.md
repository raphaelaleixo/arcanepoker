# Arcane Poker - Game Specification

## Overview
Arcane Poker is a Texas Hold'Em variant incorporating Tarot cards. The base game follows strict Texas Hold'Em rules but introduces state modifiers through the "Page" card and the Major Arcana deck.

## Deck Structures
**1. Playing Deck (56 cards):**
* 4 Suits: Hearts (Cups), Clubs (Wands), Diamonds (Pentacles), Spades (Swords).
* Ranks (14 per suit): Page (0), 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King, Ace.
* Note on the Page: In Straights, the Page connects before the Ace (e.g., Page, A, 2, 3, 4). Its standalone high-card value is 0.

**2. Major Arcana Deck (22 cards):**
* Cards numbered from 0 (The Fool) to 21 (The World).
* Setup: Card 21 (The World) is set aside. The deck is split in half. The World is shuffled into one half. The half without The World is placed on top.

## Triggers and Mechanics
* **Page in Hole Cards:** If a player wins the showdown and has a Page in their hole cards, all players (even folded ones) pay them 1 Big Blind.
* **Page on the Board:** If a Page is revealed in the community cards, the dealer draws the top card of the Major Arcana Deck.
* **Arcana Limit:** Only ONE Major Arcana can be active per round. Subsequent Pages on the board do not trigger new draws.

## Major Arcana Effects (State Modifiers & AI Rules)
* **0: The Fool** - Acts as an absolute Wildcard. The algorithm (`handEvaluator`) must test The Fool as all 52 possible cards and automatically assume the combination that generates the Best 5-card hand for each player.
* **1: The Magician** - Players guess a suit. If correct, they draw an extra hole card.
* **2: The High Priestess** - All active players reveal one hole card face up.
* **3: The Empress** - The board will have 6 community cards (an extra card dealt after the River).
* **4: The Emperor** - In tie-breakers, numeric cards lose their value. Only J, Q, K, and Page serve as kickers.
* **5: The Hierophant** - Effect remains active for subsequent hands until a new Arcana is drawn. It does not cancel The World.
* **6: The Lovers** - The pot is split between the two best hands.
* **7: The Chariot** - Active players pass one hole card to the left (folded players are ignored). **AI Logic:** Bots always pass their lowest non-pairing, non-drawing card. The game pauses for the Hero's click.
* **8: Strength** - Card values are inverted (2 is highest, Ace is lowest. Page remains 0).
* **9: The Hermit** - The board is ignored. Hands are formed using only hole cards.
* **10: Wheel of Fortune** - Complete redeal maintaining the current betting round structure.
* **11: Justice** - Players can bet less than the current call amount; the excess is returned to others.
* **12: The Hanged Man** - An All-in player receives a 3rd hole card from the playing deck.
* **13: Death** - The round ends immediately. Hands are compared at the current stage.
* **14: Temperance** - River reveals 3 cards. The Hero clicks 1 to keep for the board. **AI Logic:** The evaluator simulates the 3 cards secretly, and the AI automatically chooses the one that maximizes its final hand rank.
* **15: The Devil** - Raises must be at least double the current total bet value.
* **16: The Tower** - Half of the pot (rounded up) is destroyed and removed from play.
* **17: The Star** - Players may discard 1 hole card to draw a new one. **AI Logic:** Bots will exchange their lowest card only if their hand is worse than a Pair and has no straight/flush draw. Otherwise, they skip.
* **18: The Moon** - Players receive a 3rd hole card face down. At showdown, they may swap it. **AI Logic:** The evaluator simulates the swap; bots only swap if it improves their final rank.
* **19: The Sun** - Round ends. Pot is split equally among active players.
* **20: Judgement** - Folded players are prompted to pay 1 BB to return with 2 new cards and resume active status. **AI Logic:** Bots only pay to return if their stack is > 10 BB.
* **21: The World** - Announces the final hand of the entire game.

## Logic Clarifications
* **0: The Fool**: Absolute Wildcard. Evaluator must test all 52 possibilities to find the best hand.
* **7: The Chariot**: Active players pass 1 card left. AI passes lowest non-pairing card.
* **8: Strength**: Hand rank values are inverted (2 is high, Ace is low).
* **14: Temperance**: River reveals 3 cards; player chooses 1.
* **20: Judgement**: Folded players can pay 1 BB to rejoin with new cards.