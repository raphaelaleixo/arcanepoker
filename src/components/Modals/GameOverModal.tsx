/**
 * Shown when the game ends — either the hero is eliminated or The World (21)
 * triggers the final hand. Displays final standings and a Play Again button.
 */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";

export function GameOverModal() {
  const { state, dispatch } = useGame();

  if (state.stage !== "game-over") return null;

  const heroAlive = state.players.some(
    (p) => p.id === HERO_ID_CONST && p.stack > 0,
  );
  const title = heroAlive ? "The World's Decree" : "Eliminated";
  const subtitle = heroAlive
    ? "The World has spoken — the game is complete."
    : "Your chips have run dry. The arcane table claims another soul.";

  const standings = [...state.players].sort((a, b) => b.stack - a.stack);

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: "linear-gradient(135deg, #1a0a2e 0%, #0a0a0a 100%)",
            border: "1px solid",
            borderColor: "secondary.dark",
            boxShadow: "0 0 40px rgba(108,52,131,0.35)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "secondary.light",
          fontFamily: '"Georgia", "Times New Roman", serif',
          textAlign: "center",
          fontSize: "1.6rem",
          letterSpacing: "0.08em",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Typography
          variant="body2"
          sx={{
            color: "silver.light",
            fontStyle: "italic",
            textAlign: "center",
            mb: 3,
          }}
        >
          {subtitle}
        </Typography>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />

        <Stack spacing={1}>
          {standings.map((player, rank) => {
            const isFirst = rank === 0;
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
                  borderColor: isFirst ? "gold.dark" : "rgba(255,255,255,0.08)",
                  background: isFirst
                    ? "rgba(255,215,0,0.07)"
                    : "rgba(0,0,0,0.2)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isFirst ? "gold.main" : "silver.light",
                    fontWeight: isFirst ? "bold" : "normal",
                  }}
                >
                  #{rank + 1} {player.name}
                  {isFirst ? " \u2605" : ""}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  &#9824; {player.stack}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "START_GAME" })}
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
          Play Again
        </Button>
      </DialogActions>
    </Dialog>
  );
}
