/**
 * Returns the overlay ReactNode for whichever non-betting interaction is active,
 * or undefined if none. Constructed by PokerTable and passed as the
 * `overlayContent` prop to ActionBar.
 *
 * Interactions handled inline here (simple one-button or card-click flows):
 *   - priestess-reveal  Card-pick: click a card to reveal it to all players
 *   - chariot-pass      Card-pick: click a card to pass it left
 *   - arcana-reveal     One button: flip the pending arcana card
 *   - page-challenge    One button: trigger the Page bounty
 *   - showdown          Two buttons: Read These Cards (tarot) / Next Hand
 *
 * Interactions handled in InteractionModal (multi-choice dialogs with minimize):
 *   - star-discard, moon-swap, magician-guess, judgement-return
 */
import { Button, Stack, Typography } from "@mui/material";
import type React from "react";
import type { StandardCard } from "../../types/types";
import type { StoreGameState, GameAction } from "../../store/storeTypes";
import { HERO_ID_CONST } from "../../store/initialState";

interface TableOverlayContentProps {
  cardPickInteraction: "priestess-reveal" | "chariot-pass" | null;
  selectedCard: StandardCard | null;
  stage: string;
  pendingInteraction: StoreGameState["pendingInteraction"];
  winnerIds: string[];
  communityCards: StandardCard[];
  bigBlind: number;
  isFinalHand: boolean;
  onConfirmCardPick: () => void;
  onNextHand: () => void;
  onShowTarot: () => void;
  /** Pre-bound dispatch from PokerTable's useGame() call. */
  dispatch: React.Dispatch<GameAction>;
}

/**
 * Called as a plain function (not JSX) from PokerTable so it can return
 * undefined — JSX element instantiation always produces a ReactElement object,
 * which would make ActionBar's `overlayContent ? 1 : 0` guard always truthy.
 */
export function TableOverlayContent({
  cardPickInteraction,
  selectedCard,
  stage,
  pendingInteraction,
  winnerIds,
  communityCards,
  bigBlind,
  isFinalHand,
  onConfirmCardPick,
  onNextHand,
  onShowTarot,
  dispatch,
}: TableOverlayContentProps): React.ReactNode {
  // ── Card-pick interactions (Priestess reveal / Chariot pass) ─────────────
  if (cardPickInteraction) {
    return (
      <Stack direction="column" alignItems="center" spacing={0.5}>
        <Typography
          variant="caption"
          sx={{ color: "secondary.light", fontSize: "0.7rem", fontStyle: "italic" }}
        >
          {cardPickInteraction === "priestess-reveal"
            ? "Click a card to reveal it to all players."
            : "Click a card to pass it to the player on your left."}
        </Typography>
        <Button
          variant="contained"
          size="large"
          disabled={!selectedCard}
          onClick={onConfirmCardPick}
          sx={{
            px: 5,
            py: 1,
            background: "linear-gradient(135deg, #4a1a6e, #1a0a2e)",
            border: "1px solid",
            borderColor: "secondary.main",
            color: "secondary.light",
            letterSpacing: "0.08em",
            "&:hover": {
              background: "linear-gradient(135deg, #6c3483, #2d0f4e)",
              borderColor: "secondary.light",
            },
            "&.Mui-disabled": { opacity: 0.4 },
          }}
        >
          Confirm
        </Button>
      </Stack>
    );
  }

  // ── Page Challenge ────────────────────────────────────────────────────────
  if (pendingInteraction?.type === "page-challenge") {
    return (
      <Stack direction="column" alignItems="center" spacing={0.5}>
        <Button
          variant="contained"
          size="large"
          onClick={() => dispatch({ type: "RESOLVE_PAGE_CHALLENGE" })}
          sx={{
            px: 5,
            py: 1,
            background: "linear-gradient(135deg, #7B3F00, #3E1F00)",
            border: "1px solid",
            borderColor: "gold.main",
            color: "gold.light",
            letterSpacing: "0.08em",
            "&:hover": {
              background: "linear-gradient(135deg, #A0522D, #5C2E00)",
              borderColor: "gold.light",
            },
          }}
        >
          Challenge of the Page
        </Button>
        <Typography
          variant="caption"
          sx={{ color: "silver.light", fontSize: "0.65rem", fontStyle: "italic" }}
        >
          The winner holds a Page — all others pay {bigBlind} chips.
        </Typography>
      </Stack>
    );
  }

  // ── Arcana Reveal ─────────────────────────────────────────────────────────
  if (pendingInteraction?.type === "arcana-reveal") {
    return (
      <Button
        variant="contained"
        size="large"
        onClick={() => dispatch({ type: "REVEAL_ARCANA" })}
        sx={{
          px: 5,
          py: 1,
          background: "linear-gradient(135deg, #4a1a6e, #1a0a2e)",
          border: "1px solid",
          borderColor: "secondary.main",
          color: "secondary.light",
          letterSpacing: "0.08em",
          "&:hover": {
            background: "linear-gradient(135deg, #6c3483, #2d0f4e)",
            borderColor: "secondary.light",
          },
        }}
      >
        Reveal Arcana
      </Button>
    );
  }

  // ── Showdown ──────────────────────────────────────────────────────────────
  if (stage === "showdown" && pendingInteraction === null) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        {(communityCards.length > 0 || winnerIds.includes(HERO_ID_CONST)) && (
          <Button
            variant="outlined"
            size="large"
            onClick={onShowTarot}
            sx={{
              px: 3,
              py: 1,
              borderColor: "secondary.main",
              color: "secondary.light",
              letterSpacing: "0.05em",
              "&:hover": {
                borderColor: "secondary.light",
                background: "rgba(108,52,131,0.15)",
              },
            }}
          >
            Read These Cards
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          onClick={onNextHand}
          sx={{
            px: 5,
            py: 1,
            background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
            border: "1px solid",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": {
              background: "linear-gradient(135deg, #388E3C, #2E7D32)",
              borderColor: "gold.main",
            },
          }}
        >
          {isFinalHand ? "View Final Results" : "Next Hand →"}
        </Button>
      </Stack>
    );
  }

  return undefined;
}
