import type { TarotReadingRequest, TarotReadingResponse } from "../src/types/game";

declare const process: { env: Record<string, string | undefined> };

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

// Major Arcana keywords lookup — keyed by full name
const ARCANA_LOOKUP: Record<string, { keywords: string }> = {
  "The Fool":           { keywords: "beginnings, innocence, spontaneity" },
  "The Magician":       { keywords: "willpower, skill, resourcefulness" },
  "The High Priestess": { keywords: "intuition, mystery, the subconscious" },
  "The Empress":        { keywords: "fertility, abundance, creativity" },
  "The Emperor":        { keywords: "authority, structure, stability" },
  "The Hierophant":     { keywords: "tradition, guidance, conformity" },
  "The Lovers":         { keywords: "love, harmony, choices" },
  "The Chariot":        { keywords: "determination, victory, control" },
  "Strength":           { keywords: "courage, patience, inner strength" },
  "The Hermit":         { keywords: "solitude, introspection, inner guidance" },
  "Wheel of Fortune":   { keywords: "fate, cycles, turning points" },
  "Justice":            { keywords: "fairness, truth, karmic balance" },
  "The Hanged Man":     { keywords: "surrender, sacrifice, new perspective" },
  "Death":              { keywords: "endings, transition, transformation" },
  "Temperance":         { keywords: "balance, moderation, patience" },
  "The Devil":          { keywords: "bondage, materialism, shadow self" },
  "The Tower":          { keywords: "disruption, revelation, sudden change" },
  "The Star":           { keywords: "hope, inspiration, serenity" },
  "The Moon":           { keywords: "illusion, fear, the subconscious" },
  "The Sun":            { keywords: "joy, success, vitality" },
  "Judgement":          { keywords: "renewal, reckoning, absolution" },
  "The World":          { keywords: "completion, integration, accomplishment" },
};

type ReadingSlot =
  | { value: string; suit: string }
  | { _arcana: true; name: string; keywords: string };

function slotToTarot(slot: ReadingSlot): string {
  if ("_arcana" in slot) {
    return `${slot.name} (${slot.keywords})`;
  }
  const info = TAROT_LOOKUP[slot.suit]?.[slot.value];
  return info ? `${info.name} (${info.keywords})` : `${slot.value} of ${slot.suit}`;
}

const HORSESHOE_POSITIONS = ["Past", "Present", "Hidden", "Obstacle", "External", "Advice", "Outcome"] as const;

export function buildPrompt(request: TarotReadingRequest): string {
  const { heroHoleCards, communityCards, handRank, activeArcanaName } = request;

  // Assemble spread: hole cards first (max 2), then community — truncate to 7
  const combined = [...heroHoleCards.slice(0, 2), ...communityCards];
  const seven = combined.slice(0, 7);

  // Arcana substitution: replace any Page (value "0") with the summoned Arcana
  const arcanaInfo = activeArcanaName ? ARCANA_LOOKUP[activeArcanaName] : null;
  const slots: ReadingSlot[] = seven.map((card) => {
    if (card.value === "0" && arcanaInfo && activeArcanaName) {
      return { _arcana: true, name: activeArcanaName, keywords: arcanaInfo.keywords };
    }
    return card;
  });

  const spreadLines = slots
    .map((slot, i) => `Card ${i + 1} (${HORSESHOE_POSITIONS[i]}): ${slotToTarot(slot)}`)
    .join("\n");

  return `You are a mystical tarot oracle presiding over a game of Arcane Poker. A hand has just concluded.

Deliver a Horseshoe spread reading using exactly these 7 cards:
${spreadLines}

Hand formed: ${handRank}
Active Major Arcana: ${activeArcanaName ?? "None"}

Return the reading in this EXACT format — use the card names in parentheses, bold the key themes with **, and end with a "The Big Picture" summary paragraph:

Past (Card Name): [one sentence with **bolded key theme**].
Present (Card Name): [one sentence with **bolded key theme**].
Hidden (Card Name): [one sentence with **bolded key theme**].
Obstacle (Card Name): [one sentence with **bolded key theme**].
External (Card Name): [one sentence with **bolded key theme**].
Advice (Card Name): [one sentence with **bolded key theme**].
Outcome (Card Name): [one sentence with **bolded key theme**].
The Big Picture: [A summary connecting the key themes, with each theme bolded using **].

Speak in a mystical, arcane tone. Do not speak of winning or losing.

EXAMPLE:
Past (8 of Pentacles): You've put in the **hard work** to build a solid foundation.
Present (4 of Cups): You're currently **stagnant** and ignoring a new opportunity.
Hidden (High Priestess): Your **intuition** knows the answer even if your head doesn't.
Obstacle (9 of Swords): **Anxiety** and overthinking are your only real enemies.
External (King of Wands): A **bold mentor** is ready to back your vision.
Advice (The Chariot): Stop hesitating and **take control** of the reins.
Outcome (The Sun): Success and **total clarity** await if you move forward.
The Big Picture: Your **hard work** (8 of Pentacles) has led to **boredom** (4 of Cups), but if you conquer your **fear** (9 of Swords) and **take charge** (The Chariot), you'll find **complete success** (The Sun).`;
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
    !Array.isArray(body.heroHoleCards) ||
    !Array.isArray(body.communityCards) ||
    !body.handRank
  ) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  const abort = new AbortController();
  const abortTimer = setTimeout(() => abort.abort(), 8_000);

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(body) }] }],
          generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal: abort.signal,
      }
    );
  } catch (err) {
    clearTimeout(abortTimer);
    console.error("[tarot] Gemini fetch error:", err);
    return Response.json({ error: "Gemini request failed" }, { status: 502 });
  }
  clearTimeout(abortTimer);

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
