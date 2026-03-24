/**
 * Shared display helpers for player actions.
 * Used by PlayerSeat and its sub-components.
 */

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

/** Converts a kebab-case hand rank to Title Case (e.g. "two-pair" → "Two Pair"). */
export function formatHandRank(rank: string): string {
  return rank
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
