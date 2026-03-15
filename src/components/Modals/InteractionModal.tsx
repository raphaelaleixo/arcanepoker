import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";

const SUIT_BUTTONS: { suit: string; label: string }[] = [
  { suit: "hearts", label: "\u2665 Hearts" },
  { suit: "clubs", label: "\u2663 Clubs" },
  { suit: "diamonds", label: "\u2666 Diamonds" },
  { suit: "spades", label: "\u2660 Spades" },
];

function dialogTitle(type: string): string {
  switch (type) {
    case "star-discard":
      return "The Star: Discard or Keep?";
    case "moon-swap":
      return "The Moon: Swap for 3rd Card?";
    case "magician-guess":
      return "The Magician: Guess a Suit";
    case "judgement-return":
      return "Judgement: Rejoin the Hand?";
    case "priestess-reveal":
      return "The High Priestess: Reveal a Card";
    default:
      return "Choose";
  }
}

export function InteractionModal() {
  const { state, dispatch } = useGame();
  const { pendingInteraction } = state;
  const [minimized, setMinimized] = useState(false);

  if (
    pendingInteraction === null ||
    pendingInteraction.type === "tarot-reading" ||
    pendingInteraction.type === "arcana-reveal" ||
    pendingInteraction.type === "page-challenge" ||
    pendingInteraction.type === "chariot-pass" ||
    pendingInteraction.type === "priestess-reveal"
  ) {
    return null;
  }

  function handleStar(discard: boolean) {
    dispatch({ type: "RESOLVE_STAR", payload: { discard } });
  }

  function handleMoon(swap: boolean) {
    dispatch({ type: "RESOLVE_MOON", payload: { swap } });
  }

  function handleMagician(suit: string) {
    dispatch({ type: "RESOLVE_MAGICIAN", payload: { suit } });
  }

  function handleJudgement(rejoin: boolean) {
    dispatch({ type: "RESOLVE_JUDGEMENT", payload: { rejoin } });
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
      <DialogTitle sx={{ ...titleSx, display: "flex", alignItems: "center", justifyContent: "center", pr: 6 }}>
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
        {pendingInteraction.type === "star-discard" && (
          <Typography
            variant="body1"
            sx={{ color: "silver.light", textAlign: "center" }}
          >
            Discard your lowest card and draw a new one?
          </Typography>
        )}

        {pendingInteraction.type === "moon-swap" && (
          <Typography
            variant="body1"
            sx={{ color: "silver.light", textAlign: "center" }}
          >
            Swap one of your hole cards for a 3rd card dealt to you?
          </Typography>
        )}

        {pendingInteraction.type === "magician-guess" && (
          <Box>
            <Typography
              variant="body2"
              sx={{ color: "silver.light", textAlign: "center", mb: 2 }}
            >
              Guess the suit of the top card. If correct, you keep it as an extra hole card.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              {SUIT_BUTTONS.map(({ suit, label }) => (
                <Button
                  key={suit}
                  variant="outlined"
                  onClick={() => handleMagician(suit)}
                  sx={{
                    color: suit === "hearts" || suit === "diamonds" ? "redSuit.main" : "silver.light",
                    borderColor: suit === "hearts" || suit === "diamonds" ? "redSuit.main" : "silver.dark",
                    "&:hover": {
                      borderColor: "gold.main",
                      color: "gold.main",
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        {pendingInteraction.type === "judgement-return" && (
          <Typography
            variant="body1"
            sx={{ color: "silver.light", textAlign: "center" }}
          >
            Pay 1 big blind ({state.bigBlind} chips) to rejoin the hand with new cards?
          </Typography>
        )}

      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2, gap: 1 }}>
        {pendingInteraction.type === "star-discard" && (
          <>
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleStar(true)}
            >
              Discard
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleStar(false)}
              sx={{ color: "silver.light", borderColor: "silver.dark" }}
            >
              Keep
            </Button>
          </>
        )}

        {pendingInteraction.type === "moon-swap" && (
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleMoon(true)}
            >
              Swap
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleMoon(false)}
              sx={{ color: "silver.light", borderColor: "silver.dark" }}
            >
              Keep
            </Button>
          </>
        )}

        {pendingInteraction.type === "judgement-return" && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleJudgement(true)}
            >
              Rejoin
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleJudgement(false)}
            >
              Sit Out
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
