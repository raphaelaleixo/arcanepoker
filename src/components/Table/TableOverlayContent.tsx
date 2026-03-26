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
 *   - magician-redraw   Two buttons: Redraw / Keep Hand
 *   - showdown          Two buttons: Read These Cards (tarot) / Next Hand
 *
 * Interactions handled in InteractionModal (multi-choice dialogs with minimize):
 *   - star-discard, moon-swap, judgement-return
 */
import { Button, Stack, Typography } from "@mui/material";
import type React from "react";
import type { StandardCard } from "../../types/types";
import type { StoreGameState, GameAction } from "../../store/storeTypes";
import { HERO_ID_CONST } from "../../store/initialState";

interface TableOverlayContentProps {
  cardPickInteraction:
    | "priestess-reveal"
    | "chariot-pass"
    | "star-discard"
    | null;
  selectedCard: StandardCard | null;
  stage: string;
  pendingInteraction: StoreGameState["pendingInteraction"];
  winnerIds: string[];
  communityCards: StandardCard[];
  bigBlind: number;
  isFinalHand: boolean;
  onConfirmCardPick: () => void;
  onKeepBothStar: () => void;
  onNextHand: () => void;
  onShowTarot: () => void;
  /** Pre-bound dispatch from PokerTable's useGame() call. */
  dispatch: React.Dispatch<GameAction>;
}

/**
 * Rendered via JSX from PokerTable (guarded by `hasTableOverlay`) so React
 * Fast Refresh can hot-swap it during development.
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
  onKeepBothStar,
  onNextHand,
  onShowTarot,
  dispatch,
}: TableOverlayContentProps): React.ReactNode {
  // ── Card-pick interactions (Priestess reveal / Chariot pass / Star discard) ─
  if (cardPickInteraction) {
    const instructionText =
      cardPickInteraction === "priestess-reveal"
        ? "Click a card to reveal it to all players."
        : cardPickInteraction === "star-discard"
          ? "Click a card to discard and redraw it."
          : "Click a card to pass it to the player on your left.";

    return (
      <Stack direction="column" alignItems="center" spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: "silver.light",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          {instructionText}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            disabled={!selectedCard}
            onClick={onConfirmCardPick}
          >
            Confirm
          </Button>
          {cardPickInteraction === "star-discard" && (
            <Button variant="outlined" size="small" onClick={onKeepBothStar}>
              Keep Both
            </Button>
          )}
        </Stack>
      </Stack>
    );
  }

  // ── Page Challenge ────────────────────────────────────────────────────────
  if (pendingInteraction?.type === "page-challenge") {
    return (
      <Stack direction="column" alignItems="center" spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: "silver.light",
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        >
          The winner holds a Page — all others pay {bigBlind} chips.
        </Typography>
        <Button
          size="small"
          variant="contained"
          onClick={() => dispatch({ type: "RESOLVE_PAGE_CHALLENGE" })}
        >
          Challenge of the Page
        </Button>
      </Stack>
    );
  }

  // ── Arcana Reveal ─────────────────────────────────────────────────────────
  if (pendingInteraction?.type === "arcana-reveal") {
    return (
      <Button
        variant="contained"
        size="small"
        onClick={() => dispatch({ type: "REVEAL_ARCANA" })}
      >
        Reveal Arcana
      </Button>
    );
  }

  // ── Magician Redraw ───────────────────────────────────────────────────────
  if (pendingInteraction?.type === "magician-redraw") {
    return (
      <Stack direction="column" alignItems="center" spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: "silver.light",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          Discard both hole cards and draw two new ones — or keep your current
          hand.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            onClick={() =>
              dispatch({ type: "RESOLVE_MAGICIAN", payload: { redraw: true } })
            }
          >
            Redraw
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              dispatch({ type: "RESOLVE_MAGICIAN", payload: { redraw: false } })
            }
          >
            Keep Hand
          </Button>
        </Stack>
      </Stack>
    );
  }

  // ── Showdown ──────────────────────────────────────────────────────────────
  if (stage === "showdown" && pendingInteraction === null) {
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          width: "100%",
          "& > *": {
            flexGrow: 1,
            width: "100%",
          },
        }}
      >
        {(communityCards.length > 0 || winnerIds.includes(HERO_ID_CONST)) && (
          <Button variant="outlined" size="small" onClick={onShowTarot}>
            Tarot reading
          </Button>
        )}
        <Button variant="contained" size="small" onClick={onNextHand}>
          {isFinalHand ? "Final Results" : "Next Hand"}
        </Button>
      </Stack>
    );
  }

  return null;
}
