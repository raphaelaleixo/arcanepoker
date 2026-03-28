# Arcane Poker

A digital card game merging **Texas Hold'Em** with **Tarot mechanics**, built for the web.

The deck is expanded to 56 cards — each suit gains a **Page** (value 0), the lowest card in isolation, but capable of connecting *before* the Ace in straights (Page–A–2–3–4). When a Page appears on the board, a card from the **22-card Major Arcana deck** is drawn, altering the rules of that round — inverting hand rankings, introducing wildcards, forcing card swaps, ending the game early, and much more.

Play ends with an AI-generated **Tarot Reading** interpreting the final hand through a Horseshoe spread.

---

## Features

- **Modified 56-card deck** with the Page card and its special straight rule
- **22 Major Arcana effects** — one drawn per Page revealed on the board, each fundamentally changing how the round is evaluated or played
- **4 AI opponents** with distinct archetypes (Swords, Cups, Pentacles, Wands), each adapting their strategy to active Arcana effects
- **Tutorial mode** — scripted walkthrough hand with guided narration
- **Tarot Reading** at showdown — powered by Google Gemini, framed as a Horseshoe tarot spread
- **Rules page** — in-game guide to hand rankings, the Page card, and all Arcana effects
- Deployed on **Vercel** with a serverless function for the Tarot API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| UI | Material UI v5 + Emotion |
| Routing | React Router v6 |
| Testing | Vitest + jsdom + Testing Library |
| Backend | Vercel Serverless Functions |
| AI | Google Gemini 2.5 Flash Lite |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key (for Tarot Readings)

### Install

```bash
npm install
```

### Environment

Create a `.env.local` file at the root:

```
GEMINI_API_KEY=your_key_here
```

### Run

```bash
npm run dev
```

The dev server starts at `http://localhost:5173`. The Vite plugin intercepts `/api/tarot` requests locally — no separate server needed.

---

## Commands

```bash
npm run dev          # Start development server
npm run build        # Type-check and bundle for production
npm run preview      # Preview the production build locally
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # Run ESLint
```

---

## Project Structure

```
src/
├── engine/          # Pure game logic — deck, hand evaluator, AI heuristics
├── store/           # React Context + useReducer state management
├── pages/           # Route-level page components
├── components/
│   ├── Card/        # Card rendering, 3D flip animation, holographic foil
│   ├── Table/       # Poker table UI — seats, community cards, action bar
│   ├── Modals/      # Game over, Tarot reading, Arcana info, interactions
│   └── Tutorial/    # Tutorial overlay and narration
├── api/             # Tarot reading client + Vercel serverless handler
├── tutorial/        # Tutorial context and scripted hand definition
├── types/           # Shared TypeScript types
└── data/            # Tarot card metadata and keywords
```

### Key architectural decisions

- **Pure engine functions** — `handEvaluator.ts` and `deck.ts` are side-effect-free and fully covered by unit tests
- **Arcana as state flags** — active Arcana effects are stored in game state and read by the evaluator at hand resolution, rather than being applied procedurally
- **Single reducer** — all game state transitions (Pre-flop → Flop → Turn → River → Showdown) run through one `gameReducer`, making the game flow auditable and testable
- **Demo routes excluded from production** — gated behind `VITE_ENABLE_DEMO=true`, set automatically in `.env.development`

---

## Major Arcana — Sample Effects

| Arcana | Effect |
|---|---|
| The Fool | Pages act as wildcards — the evaluator finds the best possible hand for each player |
| The High Priestess | All active players reveal one hole card face up |
| The Chariot | Each active player passes one hole card to the left |
| Strength | Card values are inverted — Page is highest, Ace is lowest |
| The Emperor | All hands collapse to high card — players compare cards one by one, highest wins |
| Death | The round ends immediately; hands are compared with whatever cards are on the table |
| The Sun | The round ends and the pot is split equally among all active players |
| The Lovers | The pot is split between the two best hands |
| The World | This is the final hand of the game |

---

## License

Arcane Poker by [Ludoratory](https://aleixo.me) is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
