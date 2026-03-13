import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";

function formatHandRank(rank: string): string {
  return rank
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ResultsModal() {
  const { state, dispatch } = useGame();
  const [minimized, setMinimized] = useState(false);

  const isMultipleWinners = state.winnerIds.length > 1;

  const winnerPlayers = state.players.filter((p) =>
    state.winnerIds.includes(p.id)
  );

  const activePlayers = state.players.filter((p) => !p.folded);

  function handleNextHand() {
    dispatch({ type: "NEXT_HAND" });
  }

  const title = state.isFinalHand ? "Game Over" : "Showdown";

  if (minimized) {
    return (
      <Chip
        label={title}
        onClick={() => setMinimized(false)}
        sx={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 1300,
          bgcolor: "gold.dark",
          color: "background.paper",
          fontWeight: "bold",
          cursor: "pointer",
          "&:hover": { bgcolor: "gold.main" },
        }}
      />
    );
  }

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "linear-gradient(135deg, #0F3D20 0%, #0a1a2e 100%)",
          border: "1px solid",
          borderColor: "gold.dark",
          boxShadow: "0 0 40px rgba(255,215,0,0.2)",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "gold.main",
          fontFamily: '"Georgia", "Times New Roman", serif',
          textAlign: "center",
          fontSize: "1.6rem",
          letterSpacing: "0.08em",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pr: 6,
        }}
      >
        {title}
        <IconButton
          size="small"
          onClick={() => setMinimized(true)}
          sx={{ position: "absolute", right: 8, top: 8, color: "gold.dark" }}
          title="Minimize"
        >
          &#8722;
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {/* Winner announcement */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          {isMultipleWinners ? (
            <Typography
              variant="h6"
              sx={{
                color: "gold.main",
                fontWeight: "bold",
                fontFamily: '"Georgia", "Times New Roman", serif',
              }}
            >
              Split Pot
            </Typography>
          ) : winnerPlayers.length === 1 ? (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "gold.main",
                  fontWeight: "bold",
                  fontFamily: '"Georgia", "Times New Roman", serif',
                }}
              >
                {winnerPlayers[0].name} Wins!
              </Typography>
              {state.handResults.find((r) => r.playerId === winnerPlayers[0].id) && (
                <Typography
                  variant="body2"
                  sx={{ color: "silver.light", fontStyle: "italic", mt: 0.5 }}
                >
                  {formatHandRank(
                    state.handResults.find(
                      (r) => r.playerId === winnerPlayers[0].id
                    )!.rankName
                  )}
                </Typography>
              )}
            </Box>
          ) : null}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />

        {/* Player list */}
        <Stack spacing={1}>
          {activePlayers.map((player) => {
            const result = state.handResults.find(
              (r) => r.playerId === player.id
            );
            const isWinner = state.winnerIds.includes(player.id);

            return (
              <Box
                key={player.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: isWinner
                    ? "gold.dark"
                    : "rgba(255,255,255,0.08)",
                  background: isWinner
                    ? "rgba(255,215,0,0.08)"
                    : "rgba(0,0,0,0.2)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isWinner ? "gold.main" : "silver.light",
                    fontWeight: isWinner ? "bold" : "normal",
                  }}
                >
                  {player.name}
                  {isWinner && " \u2605"}
                </Typography>
                {result && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: isWinner ? "gold.light" : "rgba(255,255,255,0.5)",
                      fontStyle: "italic",
                    }}
                  >
                    {formatHandRank(result.rankName)}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          onClick={handleNextHand}
          sx={{
            px: 4,
            background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
            border: "1px solid",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": {
              background: "linear-gradient(135deg, #388E3C, #2E7D32)",
            },
          }}
        >
          {state.isFinalHand ? "View Final Results" : "Next Hand \u2192"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
