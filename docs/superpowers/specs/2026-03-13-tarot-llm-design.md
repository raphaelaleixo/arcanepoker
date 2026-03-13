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
  → POST /api/tarot  (Vercel Edge Function at api/tarot.ts)
    → POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
  ← { prophecy: "..." }
← renders prophecy in UI
```

**Key constraint:** The `GEMINI_API_KEY` must never be exposed to the browser bundle. It lives only in the Vercel environment and `.env.local` for local dev.

---

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `api/tarot.ts` | Create (project root) | Vercel Edge Function — proxies request to Gemini |
| `src/api/tarot.ts` | Edit | Switch from mock to production fetch; add error fallback |

---

## Serverless Function: `api/tarot.ts`

- **Runtime:** Vercel Edge Runtime (`export const config = { runtime: 'edge' }`)
  — uses the Web API `Request`/`Response` signature; body parsed with `req.json()`; responses via `new Response(...)` or `Response.json(...)`
- **Route:** `/api/tarot` (auto-discovered by Vercel from the `api/` directory at project root)
- **Accepted method:** POST only. Any other method returns HTTP 405 with `{ error: "Method not allowed" }`.
- **Input:** `TarotReadingRequest` JSON body (`heroHoleCards`, `communityCards`, `handRank`, `activeArcanaName`)
- **Output:** `TarotReadingResponse` JSON (`{ prophecy: string }`) with `Content-Type: application/json`
- **CORS:** Not configured — the app is deployed same-origin on Vercel; CORS headers are out of scope.

### Request Validation

Before calling Gemini, validate that the parsed body contains the required fields (`heroHoleCards`, `communityCards`, `handRank`). If the body is unparseable or missing required fields, return HTTP 400 with `{ error: "Invalid request body" }`.

### Prompt Design

`activeArcanaName` is `string | null` in `TarotReadingRequest`. When building the prompt, convert `null` to the string `"None"`.

```
You are a mystical tarot reader for a poker game called Arcane Poker.
A player just won a hand. Deliver a dramatic, mystical one-paragraph prophecy.

Winning hand: {handRank}
Hole cards: {e.g. "King of Spades, 7 of Hearts"}
Community cards: {e.g. "Ace of Diamonds, 10 of Clubs, 3 of Hearts, 2 of Spades, Jack of Diamonds"}
Active Major Arcana: {activeArcanaName ?? "None"}

Keep it under 80 words. Speak in a mystical, arcane tone. No bullet points.
```

### Gemini REST Call

- **Model:** `gemini-1.5-flash`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}`
- **Request body:** `{ contents: [{ parts: [{ text: prompt }] }] }`
- **Response path:** `candidates[0].content.parts[0].text`

### Error Handling (Server-side)

| Condition | Response |
|-----------|----------|
| Non-POST request | HTTP 405 `{ error: "Method not allowed" }` |
| Unparseable or missing fields | HTTP 400 `{ error: "Invalid request body" }` |
| Gemini returns non-200 | HTTP 502 `{ error: "Gemini call failed" }` |
| Gemini returns 200 but `candidates` is empty (e.g. safety filter triggered) | HTTP 502 `{ error: "Gemini returned no candidates" }` |

All responses include `Content-Type: application/json`. No retries.

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
- CORS headers (same-origin Vercel deployment)
- Any changes to the UI layer or `TarotReadingRequest`/`TarotReadingResponse` types
