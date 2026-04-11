/**
 * The three action buttons for the hero's turn: Fold, Check/Call, and Raise/All-In.
 * Pure presentational — all handlers are passed in from ActionBar.
 */
import { Button, Stack } from "@mui/material";
import { useTranslation } from "../../i18n";

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
  /** Demo mode: the button key currently being "pressed" — shows a pulse/scale animation. */
  demoHighlightedAction?: string | null;
}

const TUTORIAL_HIGHLIGHT = "2px solid #c9a96e";

const DEMO_PRESSED_SX = {
  transform: "scale(0.93)",
  filter: "brightness(1.35)",
  transition: "transform 0.1s ease, filter 0.1s ease",
} as const;

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
  demoHighlightedAction,
}: ActionButtonsProps) {
  const { t } = useTranslation();
  const tut = tutorialAllowedAction ?? null;
  const demo = demoHighlightedAction ?? null;

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
        sx={{
          ...(!foldEnabled && tut ? { opacity: 0.45, pointerEvents: "none" } : {}),
          ...(demo === "fold" ? DEMO_PRESSED_SX : {}),
        }}
      >
        {t("actions.fold")}
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
            ...(demo === "check" ? DEMO_PRESSED_SX : {}),
          }}
        >
          {t("actions.check")}
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
            ...(demo === "all-in" ? DEMO_PRESSED_SX : {}),
          }}
        >
          {t("actions.allIn")} {heroStack}
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
            ...(demo === "call" ? DEMO_PRESSED_SX : {}),
          }}
        >
          {t("actions.call")} {toCall}
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
          ...(demo === "raise" || demo === "all-in" ? DEMO_PRESSED_SX : {}),
        }}
      >
        {isAllIn
          ? `${t("actions.allIn")} (${heroStack})`
          : `${toCall === 0 ? t("actions.bet") : t("actions.raise")} ${clampedRaise}`}
      </Button>
    </Stack>
  );
}
