# Page Transition Design — Arcane Poker

**Date:** 2026-03-30
**Status:** Approved

---

## Overview

Smooth bidirectional transitions between the home page and the game/tutorial pages using the CSS View Transitions API. The two background SVG decorations on the home page morph into the matching background elements inside `ArcanaDisplayCard` on the game page, while the rest of the home page UI fades out and the game UI fades in.

---

## Transition Sequence

### Home → Game

1. **Phase 1 (~250ms):** Title, buttons, border decoration, and credits fade out.
2. **Phase 2 (~400ms, overlapping):** The two background elements shrink and move from their home page positions (large, top and bottom of screen) to the ArcanaDisplayCard center position (small, centered, rows 2–4 of the table grid). The SVG cross-fades from `background.svg` to `background-table.svg` as the container morphs.
3. **Phase 3:** Game UI fades in once the route has mounted.

### Game → Home (reverse)

The exact reverse: backgrounds expand outward from the ArcanaDisplayCard center position back to the home page positions, SVGs cross-fade from `background-table.svg` to `background.svg`, and the home UI fades in.

The View Transitions API handles reversal automatically — no separate reverse logic needed.

---

## Implementation

### 1. Convert pseudo-elements to real DOM elements

Both pages currently render the background images via CSS `::before`/`::after` pseudo-elements. These cannot receive `view-transition-name`, so they must become real DOM nodes.

**`src/pages/HomePage.tsx`**
- Remove `::before`/`::after` background image rules from the `Stack`'s `sx` prop.
- Add two `<Box>` components inside the Stack: one at the top (renders `background.svg`), one at the bottom (renders `background.svg`, rotated 180°).
- Assign `style={{ viewTransitionName: 'bg-top' }}` and `style={{ viewTransitionName: 'bg-bottom' }}` respectively.
- Size: `width: '15em'`, `aspectRatio: '69/56'`, `backgroundImage`, `backgroundSize: 'cover'`.
- Assign `style={{ viewTransitionName: 'home-ui' }}` to the outer `Box` containing the title, buttons, and border decoration.
- Assign `style={{ viewTransitionName: 'home-credits' }}` to the separate credits `Box` below (it is a sibling, not a child, so it needs its own name). Both fade out the same way.

**`src/components/Table/ArcanaDisplayCard.tsx`**
- Remove `::before`/`::after` background image rules from the outer `Box`'s `sx` prop.
- Add two `<Box>` components as children: one at the top of the grid area (renders `background-table.svg`), one at the bottom (renders `background-table.svg`, rotated 180°).
- Assign `style={{ viewTransitionName: 'bg-top' }}` and `style={{ viewTransitionName: 'bg-bottom' }}` respectively.
- Size: `width: '160%'`, `maxWidth: '10em'`, `aspectRatio: '69/57'`, `opacity: 0.3`, `position: 'absolute'`.
- The top element: `top: 0`, centered horizontally. The bottom: `bottom: 0`, rotated 180°, centered.

**Important:** `view-transition-name` values must be unique in the document at any given moment. Since `HomePage` and `ArcanaDisplayCard` are never mounted simultaneously, reusing `bg-top`/`bg-bottom` is safe.

### 2. Navigation hook

**`src/hooks/useNavigateWithTransition.ts`** *(new file)*

```ts
import { useNavigate } from 'react-router-dom';

export function useNavigateWithTransition() {
  const navigate = useNavigate();
  return (to: string) => {
    if (!document.startViewTransition) {
      navigate(to);
      return;
    }
    document.startViewTransition(() => {
      navigate(to);
    });
  };
}
```

The graceful fallback ensures the feature degrades to a normal navigation on browsers without View Transitions support (Firefox pre-131, older Safari).

### 3. Update HomePage navigation

In `src/pages/HomePage.tsx`, replace the `<Button component={Link}>` pattern for the "start new game" and "tutorial" buttons with `<Button onClick={() => navigateWithTransition('/game')}>` (and `/tutorial`). The "learn to play" button navigates to `/rules`, which has no special transition, so it can keep using `<Link>` or `navigate()` directly.

### 4. CSS — `src/index.css`

Add `@view-transition` opt-in and override default transition timing:

```css
@view-transition {
  navigation: auto;
}

/* Background elements morph position + size, cross-fade SVGs */
::view-transition-group(bg-top),
::view-transition-group(bg-bottom) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Home UI + credits fade out quickly */
::view-transition-old(home-ui),
::view-transition-old(home-credits) {
  animation: fade-out 200ms ease forwards;
}
::view-transition-new(home-ui),
::view-transition-new(home-credits) {
  animation: none;
  opacity: 0;
}

@keyframes fade-out {
  to { opacity: 0; }
}
```

The SVG cross-fade between `background.svg` and `background-table.svg` is handled by the browser's default `::view-transition-old` / `::view-transition-new` behavior (cross-fade) within the morphing container — no extra keyframes needed.

---

## Files Touched

| File | Change |
|------|--------|
| `src/pages/HomePage.tsx` | Convert bg pseudo-elements → real Box nodes; add `viewTransitionName`; use `useNavigateWithTransition` on nav buttons |
| `src/components/Table/ArcanaDisplayCard.tsx` | Convert bg pseudo-elements → real Box nodes; add `viewTransitionName` |
| `src/hooks/useNavigateWithTransition.ts` | New hook — wraps `useNavigate` with `startViewTransition` + fallback |
| `src/index.css` | `@view-transition` opt-in + `::view-transition-*` timing overrides |

---

## Constraints & Decisions

- **No new dependencies.** Pure CSS View Transitions API + React Router.
- **Pseudo-elements → real DOM.** Required because `view-transition-name` cannot be assigned to `::before`/`::after`.
- **`view-transition-name` reuse is safe** — `HomePage` and game pages are never mounted simultaneously.
- **Graceful degradation** — falls back to instant navigation on unsupported browsers.
- **Tutorial page** — `TutorialGamePage` uses the same `PokerTable` → `ArcanaDisplayCard` tree, so it inherits the transition for free. Navigation to `/tutorial` should also use `useNavigateWithTransition`.
- **"Learn to play" (`/rules`)** — no special transition; keep standard navigation.
- **Back-navigation from game → home** — no back button exists yet. The hook will be used when that button is added. The transition reverses automatically.

---

## Out of Scope

- Transition to/from `/rules` page.
- Demo pages (`/demo`, `/demo2`, `/demo3`).
- Adding the back/home button to the game page (deferred, noted in constraints).
