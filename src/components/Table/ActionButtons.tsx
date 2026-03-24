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
  foldDisabled?: boolean;
  checkDisabled?: boolean;
  /** When set, only the matching button is enabled; others are dimmed. */
  tutorialAllowedAction?: string | null;
}

const TUTORIAL_HIGHLIGHT = "2px solid #c9a96e";

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
  foldDisabled,
  checkDisabled,
  tutorialAllowedAction,
}: ActionButtonsProps) {
  const tut = tutorialAllowedAction ?? null;

  const checkCallKey = canCheck
    ? "check"
    : callExceedsStack
      ? "all-in"
      : "call";
  const raiseKey = isAllIn ? "all-in" : "raise";

  const foldEnabled = !tut || tut === "fold";
  const checkCallEnabled = !tut || tut === checkCallKey;
  const raiseEnabled = !tut || tut === raiseKey;

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      sx={{
        "& > *": {
          flexGrow: 1,
          width: "100%",
        },
      }}
    >
      <Button
        variant="outlined"
        size="small"
        onClick={onFold}
        disabled={foldDisabled}
        sx={
          !foldEnabled && tut
            ? { opacity: 0.45, pointerEvents: "none" }
            : undefined
        }
      >
        Fold
      </Button>

      {canCheck ? (
        <Button
          variant="contained"
          size="small"
          onClick={onCheckOrCall}
          disabled={checkDisabled}
          sx={{
            ...(checkDisabled ? { opacity: 0.4 } : {}),
            ...(!checkCallEnabled && tut
              ? { opacity: 0.45, pointerEvents: "none" }
              : {}),
            ...(checkCallEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
          }}
        >
          Check
        </Button>
      ) : callExceedsStack ? (
        <Button
          variant="contained"
          size="small"
          onClick={onCheckOrCall}
          sx={{
            ...(!checkCallEnabled && tut
              ? { opacity: 0.45, pointerEvents: "none" }
              : {}),
            ...(checkCallEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
          }}
        >
          All-in {heroStack}
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          onClick={onCheckOrCall}
          sx={{
            ...(!checkCallEnabled && tut
              ? { opacity: 0.45, pointerEvents: "none" }
              : {}),
            ...(checkCallEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
          }}
        >
          Call {toCall}
        </Button>
      )}

      <Button
        variant="contained"
        color={isAllIn ? "warning" : "primary"}
        size="small"
        onClick={onRaiseOrAllIn}
        disabled={heroStack === 0}
        sx={{
          ...(!raiseEnabled && tut
            ? { opacity: 0.45, pointerEvents: "none" }
            : {}),
          ...(raiseEnabled && tut ? { border: TUTORIAL_HIGHLIGHT } : {}),
        }}
      >
        {isAllIn
          ? `All-In (${heroStack})`
          : `${toCall === 0 ? "Bet" : "Raise"} ${clampedRaise}`}
      </Button>
    </Stack>
  );
}
