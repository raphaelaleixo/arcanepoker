import type { TarotReadingRequest, TarotReadingResponse } from "../src/types/game";

declare const process: { env: Record<string, string | undefined> };

export const config = { runtime: "edge" };

// Compact tarot meanings per suit+value — mirrors src/data/tarot.ts
const TAROT_LOOKUP: Record<string, Record<string, { name: string; keywords: string }>> = {
  hearts: {
    "0":  { name: "Page of Cups",    keywords: "intuition, sensitivity, emotional curiosity" },
    A:    { name: "Ace of Cups",     keywords: "love, new emotions, intuition" },
    "2":  { name: "Two of Cups",     keywords: "partnership, unity, connection" },
    "3":  { name: "Three of Cups",   keywords: "celebration, friendship, joy" },
    "4":  { name: "Four of Cups",    keywords: "apathy, withdrawal, missed opportunities" },
    "5":  { name: "Five of Cups",    keywords: "loss, regret, emotional pain" },
    "6":  { name: "Six of Cups",     keywords: "nostalgia, memories, familiarity" },
    "7":  { name: "Seven of Cups",   keywords: "choices, illusions, fantasy" },
    "8":  { name: "Eight of Cups",   keywords: "walking away, disappointment, surrender" },
    "9":  { name: "Nine of Cups",    keywords: "wishes fulfilled, satisfaction, comfort" },
    "10": { name: "Ten of Cups",     keywords: "harmony, happiness, emotional fulfillment" },
    J:    { name: "Knight of Cups",  keywords: "romance, idealism, emotional pursuit" },
    Q:    { name: "Queen of Cups",   keywords: "compassion, intuition, nurturing" },
    K:    { name: "King of Cups",    keywords: "emotional balance, wisdom, composure" },
  },
  spades: {
    "0":  { name: "Page of Swords",   keywords: "curiosity, mental alertness, new ideas" },
    A:    { name: "Ace of Swords",    keywords: "truth, clarity, breakthrough" },
    "2":  { name: "Two of Swords",    keywords: "indecision, stalemate, avoidance" },
    "3":  { name: "Three of Swords",  keywords: "heartbreak, sorrow, pain" },
    "4":  { name: "Four of Swords",   keywords: "rest, recovery, retreat" },
    "5":  { name: "Five of Swords",   keywords: "conflict, defeat, betrayal" },
    "6":  { name: "Six of Swords",    keywords: "transition, moving on, recovery" },
    "7":  { name: "Seven of Swords",  keywords: "deception, trickery, stealth" },
    "8":  { name: "Eight of Swords",  keywords: "restriction, helplessness, self-imposed limits" },
    "9":  { name: "Nine of Swords",   keywords: "anxiety, worry, nightmares" },
    "10": { name: "Ten of Swords",    keywords: "endings, rock bottom, painful conclusion" },
    J:    { name: "Knight of Swords", keywords: "assertiveness, determination, swift action" },
    Q:    { name: "Queen of Swords",  keywords: "intellect, clarity, independence" },
    K:    { name: "King of Swords",   keywords: "authority, truth, mental clarity" },
  },
  clubs: {
    "0":  { name: "Page of Wands",   keywords: "enthusiasm, inspiration, new ideas" },
    A:    { name: "Ace of Wands",    keywords: "raw potential, passion, new beginnings" },
    "2":  { name: "Two of Wands",    keywords: "planning, forward vision, decisions" },
    "3":  { name: "Three of Wands",  keywords: "progress, expansion, exploration" },
    "4":  { name: "Four of Wands",   keywords: "celebration, harmony, stability" },
    "5":  { name: "Five of Wands",   keywords: "conflict, competition, challenge" },
    "6":  { name: "Six of Wands",    keywords: "victory, recognition, triumph" },
    "7":  { name: "Seven of Wands",  keywords: "defense, perseverance, standing ground" },
    "8":  { name: "Eight of Wands",  keywords: "swiftness, momentum, rapid change" },
    "9":  { name: "Nine of Wands",   keywords: "resilience, final obstacles, anxiety" },
    "10": { name: "Ten of Wands",    keywords: "burden, responsibility, overwhelm" },
    J:    { name: "Knight of Wands", keywords: "action, adventure, impulsiveness" },
    Q:    { name: "Queen of Wands",  keywords: "confidence, passion, charisma" },
    K:    { name: "King of Wands",   keywords: "leadership, vision, authority" },
  },
  diamonds: {
    "0":  { name: "Page of Pentacles",   keywords: "practicality, manifestation, new opportunity" },
    A:    { name: "Ace of Pentacles",    keywords: "prosperity, abundance, new beginnings" },
    "2":  { name: "Two of Pentacles",   keywords: "balance, juggling priorities, adaptability" },
    "3":  { name: "Three of Pentacles", keywords: "teamwork, collaboration, craftsmanship" },
    "4":  { name: "Four of Pentacles",  keywords: "security, possessiveness, conservatism" },
    "5":  { name: "Five of Pentacles",  keywords: "hardship, lack, worry" },
    "6":  { name: "Six of Pentacles",   keywords: "generosity, giving and receiving, charity" },
    "7":  { name: "Seven of Pentacles", keywords: "patience, long-term vision, evaluation" },
    "8":  { name: "Eight of Pentacles", keywords: "skill, dedication, craftsmanship" },
    "9":  { name: "Nine of Pentacles",  keywords: "independence, self-sufficiency, luxury" },
    "10": { name: "Ten of Pentacles",   keywords: "wealth, legacy, stability" },
    J:    { name: "Knight of Pentacles", keywords: "efficiency, dependability, methodical" },
    Q:    { name: "Queen of Pentacles", keywords: "nurturing, practicality, abundance" },
    K:    { name: "King of Pentacles",  keywords: "financial mastery, prosperity, authority" },
  },
};

function cardToTarot(c: { value: string; suit: string }): string {
  const info = TAROT_LOOKUP[c.suit]?.[c.value];
  return info ? `${info.name} (${info.keywords})` : `${c.value} of ${c.suit}`;
}

export function buildPrompt(request: TarotReadingRequest): string {
  const { heroHoleCards, communityCards, handRank, activeArcanaName } = request;

  const holeCardStr = heroHoleCards.map(cardToTarot).join("\n  • ");
  const communityStr = communityCards.map(cardToTarot).join("\n  • ");
  const arcanaStr = activeArcanaName ?? "None";

  // Pull the key themes from hole cards to weave into the reading
  const holeThemes = heroHoleCards
    .map((c) => TAROT_LOOKUP[c.suit]?.[c.value]?.keywords)
    .filter(Boolean)
    .join("; ");

  return `You are a mystical tarot reader presiding over a game of Arcane Poker.
A hand has just concluded. Deliver a dramatic, mystical one-paragraph reading that interprets the specific tarot symbolism of the cards that appeared.

Player's hole cards:
  • ${holeCardStr}
Community cards:
  • ${communityStr}
Hand formed: ${handRank}
Active Major Arcana: ${arcanaStr}

Draw meaning from the tarot nature of these specific cards — the themes of ${holeThemes} are woven into this moment. Do not speak of winning or losing. Keep it under 80 words. Speak in a mystical, arcane tone. No bullet points.`;
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

  if (
    !Array.isArray(body.heroHoleCards) || body.heroHoleCards.length === 0 ||
    !Array.isArray(body.communityCards) || body.communityCards.length === 0 ||
    !body.handRank
  ) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(body) }] }] }),
    }
  );

  if (!geminiRes.ok) {
    const errBody = await geminiRes.text();
    console.error("[tarot] Gemini non-200:", geminiRes.status, errBody);
    return Response.json({ error: "Gemini call failed" }, { status: 502 });
  }

  const data = await geminiRes.json() as { candidates?: { content: { parts: { text: string }[] } }[] };
  const candidates = data.candidates;

  if (!candidates || candidates.length === 0) {
    console.error("[tarot] Gemini empty candidates:", JSON.stringify(data));
    return Response.json({ error: "Gemini returned no candidates" }, { status: 502 });
  }

  const text = candidates[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[tarot] Gemini no text:", JSON.stringify(data));
    return Response.json({ error: "Gemini returned no text" }, { status: 502 });
  }
  return Response.json({ prophecy: text } as TarotReadingResponse);
}
