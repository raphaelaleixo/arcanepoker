# Routing Design — Arcane Poker

**Date:** 2026-03-15
**Status:** Approved

## Overview

Add client-side routing to Arcane Poker using React Router v6. The app will have three routes: a landing page (`/`), the game (`/game`), and a quick-start rules reference (`/rules`).

## Goals

- Move the game to its own `/game` route
- Add a `/rules` route explaining only the differences from standard Texas Hold'Em
- Add a `/` landing page with navigation to both routes
- No persistent navigation bar — all navigation is contextual

## Dependencies

Install: `react-router-dom@^6.8.0` (types are bundled; no separate `@types` package needed)

## File Changes

### `vercel.json`

Add SPA rewrite rule so direct links and browser refreshes on `/game` and `/rules` resolve to `index.html` instead of returning 404:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### `src/main.tsx`

Wrap the app in `<BrowserRouter>` from `react-router-dom`. Placement is outside `App`, alongside the existing `ThemeProvider`.

### `src/App.tsx`

Replace the single `<GameProvider><PokerTable /></GameProvider>` render with `<Routes>` defining four `<Route>` entries:

- `/` → `<HomePage />`
- `/game` → `<GamePage />`
- `/rules` → `<RulesPage />`
- `*` (catch-all) → `<Navigate to="/" replace />` — unknown paths silently redirect to home

### `src/pages/HomePage.tsx`

Full-screen centered layout (`Box` + `Stack`). Contains:
- Title: "Arcane Poker"
- Short tagline
- "Play" button (variant `contained`, color `primary`) — MUI `Button` composed with React Router `Link` via `component={Link} to="/game"`
- "Rules" button (variant `outlined`) — same pattern, `to="/rules"`

Using `component={Link}` on MUI `Button` is the idiomatic pattern that preserves accessibility semantics (renders as `<a>`).

### `src/pages/GamePage.tsx`

Thin wrapper. Moves existing logic from `App.tsx`:

```tsx
<GameProvider>
  <PokerTable />
</GameProvider>
```

No visual changes to the game. **No back-navigation UI is added here intentionally.** Navigating away from `/game` unmounts `GameProvider` and destroys all in-progress game state — this is accepted behavior. Future implementers must not add browser-history navigation controls inside `GamePage`.

### `src/pages/RulesPage.tsx`

A scrollable page with a "Back to Home" `Button` (`component={Link} to="/"`) at the top. Content covers only the differences from standard Texas Hold'Em:

**Section 1 — The Page Card (0)**
- Lowest card in standalone high-card value (0)
- In straights, connects *before* the Ace: `Page, A, 2, 3, 4` is a valid straight
- **Trigger:** If a Page appears in the community cards, the top card of the Major Arcana deck is drawn and its effect activates. Only one Arcana can be active per round — subsequent Pages on the board do not trigger new draws.
- **Bonus:** If a player wins the showdown holding a Page in their hole cards, all players (including folded ones) pay them 1 Big Blind.

**Section 2 — The Major Arcana Deck**
- A separate 22-card deck (The Fool 0 through The World 21)
- **Setup:** The World (21) is set aside. The deck is split in half. The World is shuffled into the second half. The first half (without The World) is placed on top — ensuring The World only appears late in the game.
- A card is drawn only when a Page appears on the board (see above). Its effect modifies the rules for the rest of that round.
- All 22 effects listed briefly (one line each):
  - **0 – The Fool:** Acts as a wildcard; evaluator finds the best possible hand for each player.
  - **1 – The Magician:** Players guess a suit; correct guess earns an extra hole card.
  - **2 – The High Priestess:** All active players reveal one hole card face up.
  - **3 – The Empress:** A 6th community card is dealt after the River.
  - **4 – The Emperor:** In tie-breakers, only J, Q, K, and Page count as kickers.
  - **5 – The Hierophant:** Effect persists into subsequent hands until a new Arcana is drawn.
  - **6 – The Lovers:** The pot is split between the two best hands.
  - **7 – The Chariot:** Active players pass one hole card to the left.
  - **8 – Strength:** Card values are inverted — 2 is highest, Ace is lowest, Page stays 0.
  - **9 – The Hermit:** The board is ignored; hands are formed from hole cards only.
  - **10 – Wheel of Fortune:** Complete redeal, keeping the current betting round structure.
  - **11 – Justice:** Players may bet less than the call amount; excess is returned.
  - **12 – The Hanged Man:** An all-in player receives a 3rd hole card.
  - **13 – Death:** The round ends immediately; hands compared at the current stage.
  - **14 – Temperance:** River reveals 3 cards; each player chooses 1 to keep on the board.
  - **15 – The Devil:** Raises must be at least double the current total bet.
  - **16 – The Tower:** Half the pot (rounded up) is destroyed and removed from play.
  - **17 – The Star:** Players may discard 1 hole card and draw a new one.
  - **18 – The Moon:** Players receive a 3rd hole card face down; may swap it at showdown.
  - **19 – The Sun:** Round ends; pot is split equally among active players.
  - **20 – Judgement:** Folded players may pay 1 BB to return with 2 new hole cards.
  - **21 – The World:** Announces the final hand of the entire game.

Uses MUI `Typography` and `Stack` only. No custom CSS.

## Navigation Flow

```
/  ──[Play]──▶  /game
/  ──[Rules]──▶ /rules
/rules ──[Back]──▶ /
/game  ── (no navigation UI)
* (unknown) ──▶ / (redirect)
```

## Out of Scope

- Persistent navigation bar
- Dynamic route parameters
- Game state persistence across navigation
- Auth or protected routes
