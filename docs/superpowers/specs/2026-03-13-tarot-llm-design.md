# Tarot LLM Integration — Design Spec

**Date:** 2026-03-13
**Status:** Approved

---

## Overview

Replace the mock prophecy system in Arcane Poker with real LLM-generated tarot readings powered by Google Gemini 1.5 Flash, routed through a Vercel Serverless Function to keep the API key server-side.

---

## Architecture

```
Browser (React)
  → POST /api/tarot  (Vercel Serverless Function at api/tarot.ts)
    → POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
  ← { prophecy: "..." }
← renders prophecy in UI
```

**Key constraint:** The `GEMINI_API_KEY` must never be exposed to the browser bundle. It lives only in the Vercel environment and `.env.local` for local dev.

---

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `api/tarot.ts` | Create (project root) | Vercel Serverless Function — proxies request to Gemini |
| `src/api/tarot.ts` | Edit | Switch from mock to production fetch; add error fallback |

---

## Serverless Function: `api/tarot.ts`

- **Route:** `/api/tarot` (auto-discovered by Vercel from the `api/` directory at project root)
- **Method:** POST
- **Input:** `TarotReadingRequest` JSON body (`heroHoleCards`, `communityCards`, `handRank`, `activeArcanaName`)
- **Output:** `TarotReadingResponse` JSON (`{ prophecy: string }`)

### Prompt Design

```
You are a mystical tarot reader for a poker game called Arcane Poker.
A player just won a hand. Deliver a dramatic, mystical one-paragraph prophecy.

Winning hand: {handRank}
Hole cards: {e.g. "King of Spades, 7 of Hearts"}
Community cards: {e.g. "Ace of Diamonds, 10 of Clubs, 3 of Hearts, 2 of Spades, Jack of Diamonds"}
Active Major Arcana: {e.g. "The Tower" or "None"}

Keep it under 80 words. Speak in a mystical, arcane tone. No bullet points.
```

### Gemini REST Call

- **Model:** `gemini-1.5-flash`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}`
- **Request body:** `{ contents: [{ parts: [{ text: prompt }] }] }`
- **Response path:** `candidates[0].content.parts[0].text`

### Error Handling (Server-side)

- If Gemini returns non-200: respond with HTTP 502 and `{ error: "Gemini call failed" }`
- No retries

---

## Client Caller: `src/api/tarot.ts`

- Remove the mock implementation block
- Uncomment and use the production `fetch('/api/tarot', ...)` block
- Keep the `MOCK_PROPHECIES` array for the error fallback

### Error Fallback (Client-side)

If the fetch to `/api/tarot` fails or returns a non-OK response, return a `TarotReadingResponse` shaped like:

```
"[The spirits faltered in their message.] {one of the MOCK_PROPHECIES picked at random}"
```

This keeps the UI intact and the tone consistent even when the LLM call fails.

---

## Environment Variables

| Variable | Where |
|----------|-------|
| `GEMINI_API_KEY` | Vercel project settings (Production + Preview) |
| `GEMINI_API_KEY` | `.env.local` at project root (local dev, gitignored via `*.local`) |

---

## Out of Scope

- Retries or exponential backoff
- Caching responses
- Streaming responses
- Switching models
- Any changes to the UI layer or `TarotReadingRequest`/`TarotReadingResponse` types
