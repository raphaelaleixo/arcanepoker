/**
 * Modal dialog for arcana interactions that require a multi-choice decision.
 * Supports minimize to a chip so the player can see the table state first.
 *
 * Interactions handled here (multi-choice, minimize-able):
 *   star-discard, moon-swap, magician-guess, judgement-return
 *
 * Interactions handled inline on the table (ActionBar overlay):
 *   priestess-reveal, chariot-pass, arcana-reveal, page-challenge
 */
import { useState } from "react";
import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import type { PendingInteraction } from "../../types/game";
import { MagicianGuessContent } from "./MagicianGuessContent";
import { HierophantVoteContent } from "./HierophantVoteContent";

/** Maps interaction type to a dialog title string. Also used for the minimized chip label. */
function dialogTitle(type: PendingInteraction["type"]): string {
  switch (type) {
    case "star-discard":      return "The Star: Discard or Keep?";
    case "hierophant-vote":   return "The Hierophant: Vote for an Arcana";
    case "magician-redraw":   return "The Magician: Redraw?";
    // Inline types retained so the minimized chip still gets a label if needed.
    case "priestess-reveal":  return "The High Priestess: Reveal a Card";
    default:                  return "Choose";
  }
}

const paperSx = {
  background: "linear-gradient(135deg, #0F3D20 0%, #1a0a2e 100%)",
  border: "1px solid",
  borderColor: "secondary.dark",
  boxShadow: "0 0 40px rgba(155,89,182,0.2)",
};

const titleSx = {
  color: "secondary.main",
  fontFamily: '"Georgia", "Times New Roman", serif',
  textAlign: "center",
  borderBottom: "1px solid rgba(155,89,182,0.2)",
};

export function InteractionModal() {
  const { state, dispatch } = useGame();
  const { pendingInteraction } = state;
  const [minimized, setMinimized] = useState(false);

  // These interaction types are handled inline on the table or in TableOverlayContent.
  if (
    pendingInteraction === null ||
    pendingInteraction.type === "tarot-reading" ||
    pendingInteraction.type === "arcana-reveal" ||
    pendingInteraction.type === "page-challenge" ||
    pendingInteraction.type === "chariot-pass" ||
    pendingInteraction.type === "priestess-reveal" ||
    pendingInteraction.type === "temperance-pick" ||
    pendingInteraction.type === "star-discard"
  ) {
    return null;
  }


  if (minimized) {
    return (
      <Chip
        label={dialogTitle(pendingInteraction.type)}
        onClick={() => setMinimized(false)}
        sx={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 1300,
          bgcolor: "secondary.dark",
          color: "gold.light",
          fontWeight: "bold",
          cursor: "pointer",
          "&:hover": { bgcolor: "secondary.main" },
        }}
      />
    );
  }

  return (
    <Dialog open maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogTitle
        sx={{ ...titleSx, display: "flex", alignItems: "center", justifyContent: "center", pr: 6 }}
      >
        {dialogTitle(pendingInteraction.type)}
        <IconButton
          size="small"
          onClick={() => setMinimized(true)}
          sx={{ position: "absolute", right: 8, top: 8, color: "secondary.light" }}
          title="Minimize"
        >
          &#8722;
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {pendingInteraction.type === "hierophant-vote" && (
          <HierophantVoteContent
            options={pendingInteraction.options}
            onVote={(choice) => dispatch({ type: "RESOLVE_HIEROPHANT", payload: { choice } })}
          />
        )}
        {pendingInteraction.type === "magician-redraw" && (
          <MagicianGuessContent
            onChoice={(redraw) => dispatch({ type: "RESOLVE_MAGICIAN", payload: { redraw } })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
