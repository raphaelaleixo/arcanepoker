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

MVP placeholder. A scrollable page with a "Back to Home" `Button` (`component={Link} to="/"`) at the top. Content covers only the two differences from standard Texas Hold'Em:

1. **The Page Card (0)** — The lowest card in isolation. In straights, it connects before the Ace: `0, A, 2, 3, 4` is a valid straight.
2. **Major Arcana** — A 22-card Major Arcana deck is shuffled separately. One card is drawn each round and modifies the game's rules for that round. There are 22 distinct modifiers (e.g. Strength/Arcana 8 inverts hand rankings entirely). Full Arcana reference is out of scope for this page.

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
- Full Major Arcana rules reference
