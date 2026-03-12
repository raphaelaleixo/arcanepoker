/**
 * Tarot Reading API utility
 *
 * Designed to run as a Vercel Serverless Function at /api/tarot.
 * Currently returns mocked prophecies.
 * To wire up a real LLM (Gemini/Groq), replace the mock block below
 * with a POST to the LLM endpoint using the serialized TarotReadingRequest.
 *
 * Vercel entry signature:
 *   export default async function handler(req, res) { ... }
 */

import type { TarotReadingRequest, TarotReadingResponse } from "../types/game";

const MOCK_PROPHECIES = [
  "The cards reveal a convergence of fate — your hand was more than cards; it was destiny woven by unseen hands.",
  "The Arcana whisper: what was won today carries the echo of countless shuffles yet to come.",
  "Fortune smiled upon you, though the wheel turns for all. Guard your stack; the Major Arcana are watching.",
  "In the sacred geometry of the spread, your victory was written before the deck was cut.",
  "The stars aligned your hand with cosmic intent. The next deal begins a new chapter.",
];

/**
 * Request a tarot prophecy for the winning hand.
 *
 * In production, point this at your Vercel serverless endpoint:
 *   const response = await fetch('/api/tarot', { method: 'POST', body: JSON.stringify(request) });
 */
export async function requestTarotReading(
  request: TarotReadingRequest
): Promise<TarotReadingResponse> {
  // --- MOCK IMPLEMENTATION ---
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  const index = Math.floor(Math.random() * MOCK_PROPHECIES.length);
  return { prophecy: MOCK_PROPHECIES[index] };

  // --- PRODUCTION IMPLEMENTATION (uncomment and configure) ---
  // const res = await fetch('/api/tarot', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // if (!res.ok) throw new Error('Tarot reading failed');
  // return res.json() as Promise<TarotReadingResponse>;
}

/**
 * Vercel Serverless Function handler.
 * Deploy this file (or re-export it) as /api/tarot.ts in a Vercel project.
 *
 * Expected body: TarotReadingRequest JSON
 * Response: TarotReadingResponse JSON
 */
// export default async function handler(req: Request): Promise<Response> {
//   const body: TarotReadingRequest = await req.json();
//   const { heroHoleCards, communityCards, handRank, activeArcanaName } = body;
//
//   const prompt = `
//     You are a mystical tarot reader. A poker player just won a hand.
//     Their winning hand: ${handRank}
//     Their hole cards: ${heroHoleCards.map(c => `${c.value} of ${c.suit}`).join(', ')}
//     Community cards: ${communityCards.map(c => `${c.value} of ${c.suit}`).join(', ')}
//     Active Major Arcana: ${activeArcanaName ?? 'None'}
//     Deliver a dramatic, mystical, one-paragraph tarot prophecy about this victory.
//   `;
//
//   // Groq / Gemini call goes here
//   const prophecy = await callLLM(prompt);
//   return Response.json({ prophecy });
// }
