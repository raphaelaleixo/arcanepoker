/**
 * The three action buttons for the hero's turn: Fold, Check/Call, and Raise/All-In.
 * Pure presentational — all handlers are passed in from ActionBar.
 */
import { Button, Stack } from "@mui/material";

interface ActionButtonsProps {
  canCheck: boolean;
  /**
   * True when toCall >= heroStack. In this case the Call button becomes an
   * all-in action — the hero cannot call more than their remaining stack.
   */
  callExceedsStack: boolean;
  heroStack: number;
  toCall: number;
  isAllIn: boolean;
  clampedRaise: number;
  onFold: () => void;
  onCheckOrCall: () => void;
  onRaiseOrAllIn: () => void;
}

export function ActionButtons({
  canCheck,
  callExceedsStack,
  heroStack,
  toCall,
  isAllIn,
  clampedRaise,
  onFold,
  onCheckOrCall,
  onRaiseOrAllIn,
}: ActionButtonsProps) {
  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Button variant="contained" color="error" size="small" onClick={onFold}>
        Fold
      </Button>

      {canCheck ? (
        <Button variant="contained" color="success" size="small" onClick={onCheckOrCall}>
          Check
        </Button>
      ) : callExceedsStack ? (
        <Button variant="contained" color="info" size="small" onClick={onCheckOrCall}>
          All-in {heroStack}
        </Button>
      ) : (
        <Button variant="contained" color="info" size="small" onClick={onCheckOrCall}>
          Call {toCall}
        </Button>
      )}

      <Button
        variant="contained"
        color={isAllIn ? "warning" : "primary"}
        size="small"
        onClick={onRaiseOrAllIn}
        disabled={heroStack === 0}
      >
        {isAllIn ? `All-In (${heroStack})` : `${toCall === 0 ? "Bet" : "Raise"} ${clampedRaise}`}
      </Button>
    </Stack>
  );
}
