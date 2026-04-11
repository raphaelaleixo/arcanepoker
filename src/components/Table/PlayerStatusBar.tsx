/**
 * Renders the action chip, hand rank label, and bet/all-in line for a player seat.
 * Pure presentational — receives all data as props from PlayerSeat.
 */
import { Box, Typography } from "@mui/material";
import { useTranslation } from "../../i18n";
import {
  actionTranslationKey,
  actionLabel,
  actionColor,
  handRankTranslationKey,
} from "../../utils/cardUtils";

interface PlayerStatusBarProps {
  currentAction: string | null;
  /** Present at showdown if this player's hand was evaluated. */
  handResult: { rankName: string } | undefined;
  isWinner: boolean;
  /** True when the stage is showdown and the player has not folded. Controls the cross-fade. */
  showHandResult: boolean;
}

export function PlayerStatusBar({
  currentAction,
  handResult,
  isWinner,
  showHandResult,
}: PlayerStatusBarProps) {
  const { t } = useTranslation();

  const translatedAction = currentAction
    ? (() => {
        const key = actionTranslationKey(currentAction);
        return key ? t(key) : actionLabel(currentAction);
      })()
    : null;

  const translatedRank = handResult
    ? t(handRankTranslationKey(handResult.rankName))
    : null;

  return (
    <>
      {/*
        CSS grid stack: action chip and hand rank occupy gridArea "1/1" so they
        share the same space. Opacity transitions swap between them without any
        layout shift — the container height never changes.
      */}
      <Box sx={{ display: "grid", mt: 0.5, height: "1.125rem" }}>
        {/* Action chip — fades out at showdown */}
        <Box
          sx={{
            gridArea: "1 / 1",
            display: "flex",
            justifyContent: "center",
            opacity: showHandResult ? 0 : 1,
            pointerEvents: showHandResult ? "none" : "auto",
            transition: "opacity 250ms ease",
          }}
        >
          <Typography
            sx={{
              color: currentAction ? actionColor(currentAction) : "default",
              fontSize: "0.65rem",
              height: "1.125rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              visibility: currentAction ? "visible" : "hidden",
            }}
          >
            {translatedAction ?? "\u00A0"}
          </Typography>
        </Box>

        {/* Hand rank — fades in at showdown */}
        <Box
          sx={{
            height: "1.125rem",
            gridArea: "1 / 1",
            display: "flex",
            justifyContent: "center",
            opacity: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isWinner ? "primary.main" : "silver.light",
              fontSize: "0.65rem",
              fontWeight: "bold",
              textAlign: "center",
              visibility: handResult ? "visible" : "hidden",
            }}
          >
            {translatedRank
              ? `${translatedRank}${isWinner ? " ★" : ""}`
              : "\u00A0"}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
