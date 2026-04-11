import tarot from "./tarot";
import type { CardEntryInfo } from "../components/Modals/CardEntry";

/**
 * Look up the tarot reading info for any card (standard or arcana).
 * Returns null when the card has no entry in the data file.
 */
export function getTarotInfo(card: {
  value: string;
  suit: string;
}): CardEntryInfo | null {
  if (card.suit === "arcana") {
    return (tarot.arcana as Record<string, CardEntryInfo>)[card.value] ?? null;
  }
  const suitData = tarot[card.suit as keyof typeof tarot] as
    | Record<string, CardEntryInfo>
    | undefined;
  return suitData?.[card.value] ?? null;
}
