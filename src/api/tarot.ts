/**
 * Client-side tarot reading caller.
 *
 * POSTs to the Vercel Edge Function at /api/tarot (project root: api/tarot.ts),
 * which proxies the request to Google Gemini and returns a prophecy.
 *
 * On any failure (network error, non-ok response, or parse error), falls back
 * to a random entry from MOCK_PROPHECIES prefixed with an error note.
 */
import type { TarotReadingRequest, TarotReadingResponse } from "../types/game";

// Fallback prophecies — used only when the /api/tarot endpoint is unreachable or fails.
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
  const totalCards = request.heroHoleCards.length + request.communityCards.length;
  if (totalCards < 7) {
    return { prophecy: "We need more revealed cards to make the reading." };
  }

  try {
    const res = await fetch("/api/tarot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Tarot reading failed");
    return (await res.json()) as TarotReadingResponse;
  } catch (err) {
    console.error("[tarot] Reading failed, using fallback:", err);
    const index = Math.floor(Math.random() * MOCK_PROPHECIES.length);
    return {
      prophecy: `[The spirits faltered in their message.] ${MOCK_PROPHECIES[index]}`,
    };
  }
}
