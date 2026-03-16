/**
 * Shared display helpers for game stages.
 * Used by CommunityArea and its sub-components.
 */

/** Returns a human-readable display label for a game stage. */
export function stagePill(stage: string): string {
  switch (stage) {
    case "pre-flop":  return "Pre-Flop";
    case "flop":      return "Flop";
    case "turn":      return "Turn";
    case "river":     return "River";
    case "empress":   return "Empress";
    case "showdown":  return "Showdown";
    default:          return stage;
  }
}

/** Returns the MUI Chip color variant for a game stage. */
export function stageColor(
  stage: string
): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (stage) {
    case "pre-flop":  return "info";
    case "flop":      return "primary";
    case "turn":      return "warning";
    case "river":     return "secondary";
    case "empress":   return "error";
    case "showdown":  return "success";
    default:          return "default";
  }
}
