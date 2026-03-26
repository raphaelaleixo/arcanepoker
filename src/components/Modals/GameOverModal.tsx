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
import { PlayingCard } from "../Card/PlayingCard";
import tarot from "../../data/tarot";

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
            backgroundColor: "rgba(0,0,0,0.8)",
            border: "1px solid",
            borderColor: "gold.dark",
            borderRadius: 2,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "gold.main",
          fontFamily: "Young Serif, Georgia, serif",
          textAlign: "center",
          fontSize: "1.6rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          lineHeight: 1.1,
        }}
      >
        {title}
        <Typography
          variant="body2"
          sx={{
            color: "silver.light",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          {subtitle}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {heroAlive &&
          (() => {
            const worldInfo = tarot.arcana["21"] as {
              fullName: string;
              tags: string[];
              description: string;
            };
            return (
              <>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{ display: "inline-block", scale: 0.7, flexShrink: 0 }}
                  >
                    <PlayingCard rank="21" suit="arcana" flipped />
                  </Box>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "gold.main",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                        fontFamily: "Young Serif, Georgia, serif",
                      }}
                    >
                      {worldInfo.fullName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "silver.light",
                        fontSize: "0.6rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                      }}
                    >
                      {worldInfo.tags.join(" · ")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "white",
                        fontSize: "0.75rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {worldInfo.description}
                    </Typography>
                  </Stack>
                </Stack>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />
              </>
            );
          })()}
        {!heroAlive && (
          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />
        )}

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
                  borderColor: isFirst
                    ? "secondary.main"
                    : "rgba(255,255,255,0.08)",
                  background: isFirst
                    ? "rgba(255,215,0,0.07)"
                    : "rgba(0,0,0,0.2)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isFirst ? "secondary.main" : "silver.light",
                    fontWeight: isFirst ? "bold" : "normal",
                  }}
                >
                  #{rank + 1} {player.name}
                  {isFirst ? " \u2605" : ""}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isFirst ? "secondary.main" : "silver.light",
                    fontWeight: "bold",
                  }}
                >
                  {player.stack}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          size="small"
          variant="contained"
          onClick={() => dispatch({ type: "START_GAME" })}
        >
          Play Again
        </Button>
      </DialogActions>
    </Dialog>
  );
}
