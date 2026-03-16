/**
 * Shared display helpers for player actions.
 * Used by PlayerSeat and PlayerStatusBar.
 */

/** Maps a player action string to a human-readable display label. */
export function actionLabel(action: string): string {
  switch (action) {
    case "fold":       return "Fold";
    case "check":      return "Check";
    case "call":       return "Call";
    case "raise":      return "Raise";
    case "bet":        return "Bet";
    case "all-in":     return "All-In";
    case "smallBlind": return "SB";
    case "bigBlind":   return "BB";
    default:           return action;
  }
}

/** Maps a player action string to a MUI Chip color variant. */
export function actionColor(
  action: string
): "default" | "error" | "warning" | "success" | "info" | "primary" | "secondary" {
  switch (action) {
    case "fold":   return "error";
    case "raise":
    case "bet":
    case "all-in": return "warning";
    case "call":   return "info";
    case "check":  return "success";
    default:       return "default";
  }
}

/** Converts a kebab-case hand rank to Title Case (e.g. "two-pair" → "Two Pair"). */
export function formatHandRank(rank: string): string {
  return rank
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
