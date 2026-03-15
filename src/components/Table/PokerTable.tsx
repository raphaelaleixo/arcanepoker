import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useGame } from "../../store/useGame";
import type { StandardCard } from "../../types/types";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityArea } from "./CommunityArea";
import { ActionBar } from "./ActionBar";
import { TarotModal } from "../Modals/TarotModal";
import { InteractionModal } from "../Modals/InteractionModal";
import { HERO_ID_CONST } from "../../store/initialState";
import { PlaygroundDrawer } from "../Dev/PlaygroundDrawer";
import { DealerChip } from "./DealerChip";

const BETTING_STAGES = ["pre-flop", "flop", "turn", "river", "empress"];

export function PokerTable() {
  const { state, dispatch } = useGame();
  const [showTarot, setShowTarot] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<StandardCard | null>(null);

  const cardPickInteraction =
    state.pendingInteraction?.type === "priestess-reveal" ||
    state.pendingInteraction?.type === "chariot-pass"
      ? state.pendingInteraction.type
      : null;

  function handleCardPick(card: StandardCard) {
    setSelectedCard((prev) =>
      prev?.value === card.value && prev?.suit === card.suit ? null : card
    );
  }

  function confirmCardPick() {
    if (!selectedCard) return;
    if (cardPickInteraction === "priestess-reveal") {
      dispatch({ type: "RESOLVE_PRIESTESS", payload: { card: selectedCard } });
    } else if (cardPickInteraction === "chariot-pass") {
      dispatch({ type: "RESOLVE_CHARIOT", payload: { card: selectedCard } });
    }
    setSelectedCard(null);
  }

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
            onCardClick={cardPickInteraction ? handleCardPick : undefined}
            selectedCard={cardPickInteraction ? selectedCard : undefined}
          />
        )}

        {/* ActionBar: always present to prevent layout shifts.
            Showdown, arcana-reveal, and page-challenge buttons appear inside the same area via overlayContent. */}
        <ActionBar
          isVisible={isHeroTurn}
          overlayContent={
            cardPickInteraction ? (
              <Stack direction="column" alignItems="center" spacing={0.5}>
                <Typography variant="caption" sx={{ color: "secondary.light", fontSize: "0.7rem", fontStyle: "italic" }}>
                  {cardPickInteraction === "priestess-reveal"
                    ? "Click a card to reveal it to all players."
                    : "Click a card to pass it to the player on your left."}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  disabled={!selectedCard}
                  onClick={confirmCardPick}
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
            ) : state.pendingInteraction?.type === "page-challenge" ? (
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
                <Typography variant="caption" sx={{ color: "silver.light", fontSize: "0.65rem", fontStyle: "italic" }}>
                  The winner holds a Page — all others pay {state.bigBlind} chips.
                </Typography>
              </Stack>
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
              <Stack direction="row" spacing={1} alignItems="center">
                {(state.communityCards.length > 0 || state.winnerIds.includes(HERO_ID_CONST)) && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowTarot(true)}
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
                  onClick={() => { setShowTarot(false); dispatch({ type: "NEXT_HAND" }); }}
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
              </Stack>
            ) : undefined
          }
        />
      </Stack>

      {/* Overlay modals */}
      {showTarot && <TarotModal onClose={() => setShowTarot(false)} />}
      <InteractionModal />
      <DealerChip />
      <Button
        size="small"
        variant="outlined"
        onClick={() => setPlaygroundOpen(true)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1200,
          minWidth: 0,
          px: 1.5,
          py: 0.5,
          fontSize: "0.7rem",
          opacity: 0.5,
          color: "secondary.light",
          borderColor: "secondary.dark",
          "&:hover": { opacity: 1 },
        }}
      >
        ⚗ DEV
      </Button>
      <PlaygroundDrawer open={playgroundOpen} onClose={() => setPlaygroundOpen(false)} />
    </Box>
  );
}
