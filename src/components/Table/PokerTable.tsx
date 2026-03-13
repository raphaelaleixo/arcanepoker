import { Box, Button, Stack, Typography } from "@mui/material";
import { useGame } from "../../store/useGame";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityArea } from "./CommunityArea";
import { ActionBar } from "./ActionBar";
import { TarotModal } from "../Modals/TarotModal";
import { HERO_ID_CONST } from "../../store/initialState";

const BETTING_STAGES = ["pre-flop", "flop", "turn", "river"];

export function PokerTable() {
  const { state, dispatch, startGame } = useGame();

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);
  const heroIndex = state.players.findIndex((p) => p.id === HERO_ID_CONST);
  const activePlayer = state.players[state.activePlayerIndex];
  const isHeroTurn =
    activePlayer?.id === HERO_ID_CONST &&
    BETTING_STAGES.includes(state.stage) &&
    state.pendingInteraction === null;

  // Players by position index in the players array
  // Position 0 = hero, positions 1-4 = bots
  const bot1 = state.players.find((p) => p.position === 1);
  const bot2 = state.players.find((p) => p.position === 2);
  const bot3 = state.players.find((p) => p.position === 3);
  const bot4 = state.players.find((p) => p.position === 4);

  if (state.stage === "pre-game") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at center, #0F3D20 0%, #0A2F1A 70%, #061a0f 100%)",
          gap: 4,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            color: "gold.main",
            textShadow: "0 0 20px rgba(255,215,0,0.5)",
            letterSpacing: "0.1em",
            textAlign: "center",
          }}
        >
          Arcane Poker
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "silver.light",
            opacity: 0.7,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Where the Major Arcana shape your fate
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={startGame}
          sx={{
            mt: 2,
            px: 6,
            py: 1.5,
            fontSize: "1.2rem",
            background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
            border: "2px solid",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": {
              background: "linear-gradient(135deg, #388E3C, #2E7D32)",
              borderColor: "gold.main",
            },
          }}
        >
          Begin
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at center, #0F3D20 0%, #0A2F1A 70%, #061a0f 100%)",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1, sm: 2 },
        gap: { xs: 1, sm: 2 },
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Top row: bots at positions 1 and 2 */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="center"
        alignItems="center"
      >
        {bot1 && (
          <PlayerSeat
            player={bot1}
            playerIndex={state.players.indexOf(bot1)}
          />
        )}
        {bot2 && (
          <PlayerSeat
            player={bot2}
            playerIndex={state.players.indexOf(bot2)}
          />
        )}
      </Stack>

      {/* Middle row: bot3 | community | bot4 */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems="center"
        justifyContent="center"
        flex={1}
      >
        {bot3 && (
          <PlayerSeat
            player={bot3}
            playerIndex={state.players.indexOf(bot3)}
          />
        )}
        <CommunityArea sx={{ flex: 1 }} />
        {bot4 && (
          <PlayerSeat
            player={bot4}
            playerIndex={state.players.indexOf(bot4)}
          />
        )}
      </Stack>

      {/* Bottom row: hero + action bar / next hand */}
      <Stack direction="column" alignItems="center" spacing={1}>
        {hero && (
          <PlayerSeat
            player={hero}
            playerIndex={heroIndex}
            isHero
          />
        )}
        {state.pendingInteraction?.type === "page-challenge" ? (
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
        ) : state.pendingInteraction?.type === "arcana-reveal" ? (
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
        ) : state.stage === "showdown" && state.pendingInteraction === null ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => dispatch({ type: "NEXT_HAND" })}
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
            {state.isFinalHand ? "View Final Results" : "Next Hand →"}
          </Button>
        ) : (
          isHeroTurn && <ActionBar />
        )}
      </Stack>

      {/* Overlay modals */}
      {state.pendingInteraction?.type === "tarot-reading" && <TarotModal />}
    </Box>
  );
}
