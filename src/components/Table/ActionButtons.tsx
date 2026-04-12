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
  /** When true, all buttons are non-interactive (tutorial autoplay). */
  isTutorial?: boolean;
  /** Demo mode: the button key currently being "pressed" — shows a pulse/scale animation. */
  demoHighlightedAction?: string | null;
}


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
  isTutorial,
  demoHighlightedAction,
}: ActionButtonsProps) {
  const { t } = useTranslation();
  const demo = demoHighlightedAction ?? null;
  const inert = isTutorial ? { tabIndex: -1, pointerEvents: "none" as const } : {};


  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      useFlexGap
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
        tabIndex={inert.tabIndex}
        sx={{
          ...(demo === "fold" ? DEMO_PRESSED_SX : {}),
          pointerEvents: inert.pointerEvents,
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
          tabIndex={inert.tabIndex}
          sx={{
            ...(checkDisabled ? { opacity: 0.4 } : {}),
            ...(demo === "check" ? DEMO_PRESSED_SX : {}),
            pointerEvents: inert.pointerEvents,
          }}
        >
          {t("actions.check")}
        </Button>
      ) : callExceedsStack ? (
        <Button
          variant="contained"
          size="small"
          onClick={onCheckOrCall}
          tabIndex={inert.tabIndex}
          sx={{
            ...(demo === "all-in" ? DEMO_PRESSED_SX : {}),
            pointerEvents: inert.pointerEvents,
          }}
        >
          {t("actions.allIn")} {heroStack}
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          onClick={onCheckOrCall}
          tabIndex={inert.tabIndex}
          sx={{
            ...(demo === "call" ? DEMO_PRESSED_SX : {}),
            pointerEvents: inert.pointerEvents,
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
        tabIndex={inert.tabIndex}
        sx={{
          ...(demo === "raise" || demo === "all-in" ? DEMO_PRESSED_SX : {}),
          pointerEvents: inert.pointerEvents,
        }}
      >
        {isAllIn
          ? `${t("actions.allIn")} (${heroStack})`
          : `${toCall === 0 ? t("actions.bet") : t("actions.raise")} ${clampedRaise}`}
      </Button>
    </Stack>
  );
}
