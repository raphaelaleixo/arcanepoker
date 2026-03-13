# Tarot LLM Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock tarot prophecies with real Google Gemini 1.5 Flash responses, routed through a Vercel Edge Function to keep the API key server-side.

**Architecture:** A new Vercel Edge Function at `api/tarot.ts` (project root) receives a `TarotReadingRequest`, builds a prompt, calls the Gemini REST API, and returns the prophecy. The existing client-side caller at `src/api/tarot.ts` is updated to POST to that endpoint, with the mock prophecies retained as an error fallback.

**Tech Stack:** TypeScript, Vercel Edge Runtime (Web API `Request`/`Response`), Google Gemini 1.5 Flash REST API, Vitest

---

## Chunk 1: Vercel Edge Function (`api/tarot.ts`)

**Files:**
- Create: `api/tarot.ts`
- Create: `api/__tests__/tarot.test.ts`

---

### Task 1: Write failing tests for `buildPrompt`

The `buildPrompt` function is the only pure, testable unit in the edge function. Write its tests first.

- [ ] **Step 1: Create the test file**

Create `api/__tests__/tarot.test.ts` with the following content:

```ts
import { describe, it, expect } from "vitest";
import { buildPrompt } from "../tarot";
import type { TarotReadingRequest } from "../../src/types/game";

function makeRequest(overrides: Partial<TarotReadingRequest> = {}): TarotReadingRequest {
  return {
    heroHoleCards: [
      { value: "K", suit: "spades" },
      { value: "7", suit: "hearts" },
    ],
    communityCards: [
      { value: "A", suit: "diamonds" },
      { value: "10", suit: "clubs" },
      { value: "3", suit: "hearts" },
    ],
    handRank: "Two Pair",
    activeArcanaName: null,
    ...overrides,
  } as TarotReadingRequest;
}

describe("buildPrompt", () => {
  it("includes the hand rank", () => {
    const prompt = buildPrompt(makeRequest({ handRank: "Full House" }));
    expect(prompt).toContain("Full House");
  });

  it("includes hole cards formatted as 'value of suit'", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("K of spades");
    expect(prompt).toContain("7 of hearts");
  });

  it("includes community cards formatted as 'value of suit'", () => {
    const prompt = buildPrompt(makeRequest());
    expect(prompt).toContain("A of diamonds");
    expect(prompt).toContain("10 of clubs");
  });

  it("renders null activeArcanaName as 'None'", () => {
    const prompt = buildPrompt(makeRequest({ activeArcanaName: null }));
    expect(prompt).toContain("Active Major Arcana: None");
    expect(prompt).not.toContain("null");
  });

  it("renders a named arcana correctly", () => {
    const prompt = buildPrompt(makeRequest({ activeArcanaName: "The Tower" }));
    expect(prompt).toContain("Active Major Arcana: The Tower");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- api/__tests__/tarot.test.ts
```

Expected: FAIL — `Cannot find module '../tarot'`

---

### Task 2: Implement `api/tarot.ts`

- [ ] **Step 3: Create `api/tarot.ts`**

```ts
import type { TarotReadingRequest, TarotReadingResponse } from "../src/types/game";

export const config = { runtime: "edge" };

export function buildPrompt(request: TarotReadingRequest): string {
  const { heroHoleCards, communityCards, handRank, activeArcanaName } = request;
  const holeCardStr = heroHoleCards.map((c) => `${c.value} of ${c.suit}`).join(", ");
  const communityStr = communityCards.map((c) => `${c.value} of ${c.suit}`).join(", ");
  const arcanaStr = activeArcanaName ?? "None";

  return `You are a mystical tarot reader for a poker game called Arcane Poker.
A player just won a hand. Deliver a dramatic, mystical one-paragraph prophecy.

Winning hand: ${handRank}
Hole cards: ${holeCardStr}
Community cards: ${communityStr}
Active Major Arcana: ${arcanaStr}

Keep it under 80 words. Speak in a mystical, arcane tone. No bullet points.`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: TarotReadingRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.heroHoleCards || !body.communityCards || !body.handRank) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(body) }] }] }),
    }
  );

  if (!geminiRes.ok) {
    return Response.json({ error: "Gemini call failed" }, { status: 502 });
  }

  const data = await geminiRes.json() as { candidates?: { content: { parts: { text: string }[] } }[] };
  const candidates = data.candidates;

  if (!candidates || candidates.length === 0) {
    return Response.json({ error: "Gemini returned no candidates" }, { status: 502 });
  }

  const prophecy: string = candidates[0].content.parts[0].text;
  return Response.json({ prophecy } satisfies TarotReadingResponse);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- api/__tests__/tarot.test.ts
```

Expected: All 5 tests PASS

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npm run test
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add api/tarot.ts api/__tests__/tarot.test.ts
git commit -m "feat: add Vercel edge function for Gemini tarot readings"
```

---

## Chunk 2: Client-Side Caller (`src/api/tarot.ts`)

**Files:**
- Modify: `src/api/tarot.ts`
- Create: `src/api/__tests__/tarot.test.ts`

---

### Task 3: Write failing tests for the client caller

- [ ] **Step 1: Create `src/api/__tests__/tarot.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestTarotReading } from "../tarot";
import type { TarotReadingRequest } from "../../types/game";

const MOCK_REQUEST: TarotReadingRequest = {
  heroHoleCards: [{ value: "A", suit: "spades" }, { value: "K", suit: "spades" }],
  communityCards: [
    { value: "Q", suit: "spades" },
    { value: "J", suit: "spades" },
    { value: "10", suit: "spades" },
  ],
  handRank: "royal-flush",
  activeArcanaName: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("requestTarotReading", () => {
  it("returns the prophecy from the API on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ prophecy: "The stars aligned." }),
      })
    );

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toBe("The stars aligned.");
  });

  it("POSTs to /api/tarot with the request body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ prophecy: "test" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await requestTarotReading(MOCK_REQUEST);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tarot",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(MOCK_REQUEST),
      })
    );
  });

  it("falls back to a mock prophecy prefixed with an error note when the API returns non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toMatch(/^\[The spirits faltered in their message\.\]/);
  });

  it("falls back to a mock prophecy prefixed with an error note when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toMatch(/^\[The spirits faltered in their message\.\]/);
  });

  it("falls back to a mock prophecy prefixed with an error note when res.json() throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error("Invalid JSON"); },
      })
    );

    const result = await requestTarotReading(MOCK_REQUEST);
    expect(result.prophecy).toMatch(/^\[The spirits faltered in their message\.\]/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/api/__tests__/tarot.test.ts
```

Expected: FAIL — tests for production path fail because `requestTarotReading` still uses the mock implementation

---

### Task 4: Update `src/api/tarot.ts` to use the production path

- [ ] **Step 3: Replace the mock implementation in `src/api/tarot.ts`**

The full updated file:

```ts
import type { TarotReadingRequest, TarotReadingResponse } from "../types/game";

const MOCK_PROPHECIES = [
  "The cards reveal a convergence of fate — your hand was more than cards; it was destiny woven by unseen hands.",
  "The Arcana whisper: what was won today carries the echo of countless shuffles yet to come.",
  "Fortune smiled upon you, though the wheel turns for all. Guard your stack; the Major Arcana are watching.",
  "In the sacred geometry of the spread, your victory was written before the deck was cut.",
  "The stars aligned your hand with cosmic intent. The next deal begins a new chapter.",
];

export async function requestTarotReading(
  request: TarotReadingRequest
): Promise<TarotReadingResponse> {
  try {
    const res = await fetch("/api/tarot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Tarot reading failed");
    return res.json() as Promise<TarotReadingResponse>;
  } catch {
    const index = Math.floor(Math.random() * MOCK_PROPHECIES.length);
    return {
      prophecy: `[The spirits faltered in their message.] ${MOCK_PROPHECIES[index]}`,
    };
  }
}
```

- [ ] **Step 4: Run the client tests to verify they pass**

```bash
npm run test -- src/api/__tests__/tarot.test.ts
```

Expected: All 5 tests PASS

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npm run test
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/api/tarot.ts src/api/__tests__/tarot.test.ts
git commit -m "feat: switch tarot client to production Gemini endpoint with fallback"
```

---

## Post-Implementation Smoke Test

After both chunks are implemented and committed:

- [ ] Run `vercel dev` locally (requires Vercel CLI: `npm i -g vercel`)
- [ ] Play a hand in the game to completion
- [ ] Verify the tarot reading modal shows a real Gemini-generated prophecy
- [ ] Set `GEMINI_API_KEY=invalid` in `.env.local`, restart `vercel dev`, play another hand, and verify the fallback message appears prefixed with exactly: `[The spirits faltered in their message.]`
- [ ] Restore the valid key in `.env.local`, restart `vercel dev`, play one more hand, and verify a real Gemini prophecy is shown (no fallback prefix)
- [ ] Deploy: `vercel --prod`
