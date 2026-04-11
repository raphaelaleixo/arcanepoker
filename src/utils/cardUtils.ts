/**
 * Shared display helpers for player actions.
 * Used by PlayerSeat and its sub-components.
 */

import type { TranslationKey } from "../i18n";

/** Maps a player action string to its chip-display translation key. */
const ACTION_CHIP_KEY_MAP: Record<string, TranslationKey> = {
  fold: "actionChips.fold",
  check: "actionChips.check",
  call: "actionChips.call",
  raise: "actionChips.raise",
  bet: "actionChips.bet",
  "all-in": "actionChips.all-in",
  smallBlind: "actionChips.smallBlind",
  bigBlind: "actionChips.bigBlind",
};

/** Returns the chip-display translation key for a player action, or null if unknown. */
export function actionTranslationKey(action: string): TranslationKey | null {
  return ACTION_CHIP_KEY_MAP[action] ?? null;
}

/** Maps a player action string to a human-readable display label. */
export function actionLabel(action: string): string {
  switch (action) {
    case "fold":
      return "Fold";
    case "check":
      return "Check";
    case "call":
      return "Call";
    case "raise":
      return "Raise";
    case "bet":
      return "Bet";
    case "all-in":
      return "All-In";
    case "smallBlind":
      return "Small Blind";
    case "bigBlind":
      return "Big Blind";
    default:
      return action;
  }
}

/** Maps a player action string to a MUI Chip color variant. */
export function actionColor(
  action: string
):
  | "default"
  | "rgb(239, 68, 68)"
  | "rgb(245, 158, 11)"
  | "rgb(34, 197, 94)"
  | "info"
  | "primary"
  | "secondary" {
  switch (action) {
    case "fold":
      return "rgb(239, 68, 68)";
    case "raise":
    case "bet":
    case "all-in":
    case "smallBlind":
    case "bigBlind":
      return "rgb(245, 158, 11)";
    case "call":
    case "check":
      return "rgb(34, 197, 94)";
    default:
      return "default";
  }
}

/** Returns the translation key for a kebab-case hand rank name. */
export function handRankTranslationKey(rank: string): TranslationKey {
  return `handRanks.${rank}` as TranslationKey;
}

/** Converts a kebab-case hand rank to Title Case (e.g. "two-pair" → "Two Pair"). */
export function formatHandRank(rank: string): string {
  return rank
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
