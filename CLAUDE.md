# Arcane Poker - Claude System Directives

## Project Overview
Arcane Poker is a digital web-based card game merging Texas Hold'Em with Tarot mechanics. 
The core hook involves a 56-card standard deck containing a "Page" (Value 0) in each suit, and a 22-card Major Arcana deck that modifies the game's state rules when drawn.

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite
- **UI Framework:** Material-UI (MUI) v5, Emotion
- **Testing:** Vitest
- **Backend:** Vercel Serverless Functions (for LLM API calls)

## 🛑 CRITICAL DIRECTIVES (NEVER VIOLATE)

### 1. UI and Visual Components
- The visual card components located in `src/components/Card/` (e.g., `PlayingCard.tsx`, `CardFront.tsx`, and all `*Art.tsx` SVG files) are FINALIZED. 
- **DO NOT** modify the SVG paths, the 3D CSS flip animations, or the holographic Foil keyframes unless explicitly instructed by the user. 
- Build all new UI layouts using standard Material-UI components (`Box`, `Stack`, `Grid`, `Typography`). Keep the UI rudimentary and responsive. Do not write custom CSS unless absolutely necessary.

### 2. The Game Engine & Math (`/engine`)
- **The Page Card (0):** It is the lowest card in isolation. However, in straights, it connects *before* the Ace (e.g., `0, A, 2, 3, 4`).
- **State Modifiers:** Always check the active Major Arcana state before evaluating hands. For example, if "Strength" (Arcana 8) is active, standard hand rankings are completely inverted (2 is high, Ace is low).
- **Pure Functions:** The `handEvaluator.ts` and deck generators must be pure functions with no side effects, fully covered by Vitest unit tests.

### 3. State Management (`/store`)
- Use React Context combined with `useReducer` (or Zustand if requested) for the `GameState`.
- State transitions (Pre-flop -> Flop -> Turn -> River -> Showdown) must strictly follow Texas Hold'Em betting rules, but account for AI Bot turns and Arcana interruptions.

### 4. Bot AI Heuristics
- AI opponents must adapt their decisions (Fold, Call, Raise) based on both their hard-coded archetypes (Swords=Aggressive, Pentacles=Passive, etc.) AND the currently active Major Arcana modifier.

### 5. API & LLM Integration (`/api`)
- Keep the Tarot Reading logic isolated in `src/api/tarot.ts`. This must be formatted to work as a Vercel Serverless Function, receiving the final hand/board state and returning a text prophecy.

## Git Workflow
- **Never commit directly to `main`.** Always create a feature branch and open a Pull Request.
- When work is complete, create a branch, commit to it, and use `gh pr create` to open a PR targeting `main`.

## Commands
- Dev Server: `npm run dev`
- Run Tests: `npm run test`
- Build: `npm run build`

When writing code, prioritize strict TypeScript typing, avoid `any`, and always ensure tests pass after modifying the `/engine` directory.