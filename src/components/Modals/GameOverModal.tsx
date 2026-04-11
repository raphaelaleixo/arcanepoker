/**
 * Shown when the game ends — either the hero is eliminated or The World (21)
 * triggers the final hand. Displays final standings and a Play Again button.
 */
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";
import { ArcaneDialog } from "./ArcaneDialog";
import { CardEntry } from "./CardEntry";
import { getTarotInfo } from "../../data/getTarotInfo";

export function GameOverModal() {
  const { state, dispatch } = useGame();

  if (state.stage !== "game-over") return null;

  const heroAlive = state.players.some(
    (p) => p.id === HERO_ID_CONST && p.stack > 0,
  );
  const heroWon = heroAlive && !state.isFinalHand;
  const title = heroWon
    ? "Fortune Favors You!"
    : heroAlive
      ? "The World's Decree"
      : "Eliminated";
  const subtitle = heroWon
    ? "You outlasted every challenger. The arcane table is yours."
    : heroAlive
      ? "The World has spoken — the game is complete."
      : "Your chips have run dry. The arcane table claims another soul.";

  const standings = [...state.players].sort((a, b) => b.stack - a.stack);

  return (
    <ArcaneDialog
      open
      title={
        <>
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
        </>
      }
      titleSx={{
        fontSize: "1.6rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        lineHeight: 1.1,
      }}
      actions={
        <Button
          size="small"
          variant="contained"
          onClick={() => dispatch({ type: "START_GAME" })}
        >
          Play Again
        </Button>
      }
    >
      {heroAlive && !heroWon &&
        (() => {
          const info = getTarotInfo({ value: "21", suit: "arcana" });
          if (!info) return null;
          return (
            <>
              <CardEntry
                card={{ value: "21", suit: "arcana" }}
                info={info}
                sx={{ mb: 2 }}
              />
              <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />
            </>
          );
        })()}
      {(!heroAlive || heroWon) && (
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
    </ArcaneDialog>
  );
}
