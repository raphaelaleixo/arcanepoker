/**
 * Top-level layout component for the poker table.
 * Arranges player seats, the community area, and the action bar.
 * Manages card-pick state (Priestess / Chariot interactions) and
 * delegates all overlay UI to TableOverlayContent.
 */
import { useState } from "react";
import { Box, Button, Stack } from "@mui/material";
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
import { TableOverlayContent } from "./TableOverlayContent";

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
      prev?.value === card.value && prev?.suit === card.suit ? null : card,
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

  const bot1 = state.players.find((p) => p.position === 1);
  const bot2 = state.players.find((p) => p.position === 2);
  const bot3 = state.players.find((p) => p.position === 3);
  const bot4 = state.players.find((p) => p.position === 4);

  // Call as a plain function (not JSX) so it can return undefined.
  // If constructed as <TableOverlayContent .../> it would always be a
  // ReactElement (truthy), making ActionBar's overlay guard permanently on.
  const overlayContent = TableOverlayContent({
    cardPickInteraction,
    selectedCard,
    stage: state.stage,
    pendingInteraction: state.pendingInteraction,
    winnerIds: state.winnerIds,
    communityCards: state.communityCards,
    bigBlind: state.bigBlind,
    isFinalHand: state.isFinalHand,
    onConfirmCardPick: confirmCardPick,
    onNextHand: () => { setShowTarot(false); dispatch({ type: "NEXT_HAND" }); },
    onShowTarot: () => setShowTarot(true),
    dispatch,
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "linear-gradient(to bottom, #252525 0%, black 100%)",
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
        {bot1 && <PlayerSeat player={bot1} playerIndex={state.players.indexOf(bot1)} />}
        {bot2 && <PlayerSeat player={bot2} playerIndex={state.players.indexOf(bot2)} />}
      </Stack>

      {/* Middle row: bot3 | community area | bot4 */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems="center"
        justifyContent="center"
        flex={1}
      >
        {bot3 && <PlayerSeat player={bot3} playerIndex={state.players.indexOf(bot3)} />}
        <CommunityArea sx={{ flex: 1 }} />
        {bot4 && <PlayerSeat player={bot4} playerIndex={state.players.indexOf(bot4)} />}
      </Stack>

      {/* Bottom row: hero seat */}
      <Stack direction="row" justifyContent="center">
        {hero && (
          <PlayerSeat
            player={hero}
            playerIndex={heroIndex}
            isHero
            onCardClick={cardPickInteraction ? handleCardPick : undefined}
            selectedCard={cardPickInteraction ? selectedCard : undefined}
          />
        )}
      </Stack>

      {/* Action bar */}
      <Box
        sx={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          pt: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ActionBar isVisible={isHeroTurn} overlayContent={overlayContent} />
      </Box>

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
