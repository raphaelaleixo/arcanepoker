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
