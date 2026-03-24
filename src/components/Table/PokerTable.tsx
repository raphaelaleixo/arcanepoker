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
import { GameOverModal } from "../Modals/GameOverModal";
import { HERO_ID_CONST } from "../../store/initialState";
import { PlaygroundDrawer } from "../Dev/PlaygroundDrawer";
import { DealerChip } from "./DealerChip";
import { TableOverlayContent } from "./TableOverlayContent";
import { TutorialOverlay } from "../Tutorial/TutorialOverlay";

const BETTING_STAGES = ["pre-flop", "flop", "turn", "river", "empress"];

export function PokerTable() {
  const { state, dispatch } = useGame();
  const [showTarot, setShowTarot] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<StandardCard | null>(null);

  const cardPickInteraction =
    state.pendingInteraction?.type === "priestess-reveal" ||
    state.pendingInteraction?.type === "chariot-pass" ||
    state.pendingInteraction?.type === "star-discard"
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
    } else if (cardPickInteraction === "star-discard") {
      dispatch({ type: "RESOLVE_STAR", payload: { card: selectedCard } });
    }
    setSelectedCard(null);
  }

  function keepBothStar() {
    dispatch({ type: "RESOLVE_STAR", payload: { card: null } });
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
    onKeepBothStar: keepBothStar,
    onNextHand: () => {
      setShowTarot(false);
      dispatch({ type: "NEXT_HAND" });
    },
    onShowTarot: () => setShowTarot(true),
    dispatch,
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1, sm: 2 },
        gap: { xs: 1, sm: 2 },
        boxSizing: "border-box",
        overflow: "hidden",
        width: "800px",
        height: "360px",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          height: "800px",
          width: "360px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 999,
          pointerEvents: "none",
          background:
            'url("/public/art/circleBackground.svg") center center / cover no-repeat',
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          gridTemplateRows: "auto auto auto auto auto",
        }}
      >
        {bot1 && (
          <PlayerSeat
            player={bot1}
            playerIndex={state.players.indexOf(bot1)}
            isActive={activePlayer?.id === bot1.id}
          />
        )}
        {bot2 && (
          <PlayerSeat
            player={bot2}
            playerIndex={state.players.indexOf(bot2)}
            isActive={activePlayer?.id === bot2.id}
            sx={{
              gridColumn: 3,
              gridRow: 1,
            }}
          />
        )}
        <CommunityArea
          sx={{
            gridRow: 2,
            gridColumnStart: 1,
            gridColumnEnd: 4,
          }}
        />
        {bot3 && (
          <PlayerSeat
            player={bot3}
            playerIndex={state.players.indexOf(bot3)}
            isActive={activePlayer?.id === bot3.id}
            sx={{
              gridColumn: 1,
              gridRow: 3,
            }}
          />
        )}

        {bot4 && (
          <PlayerSeat
            player={bot4}
            playerIndex={state.players.indexOf(bot4)}
            isActive={activePlayer?.id === bot4.id}
            sx={{
              gridColumn: 3,
              gridRow: 3,
            }}
          />
        )}
        {hero && (
          <PlayerSeat
            player={hero}
            playerIndex={heroIndex}
            isHero
            isActive={activePlayer?.id === hero.id}
            onCardClick={cardPickInteraction ? handleCardPick : undefined}
            selectedCard={cardPickInteraction ? selectedCard : undefined}
            sx={{
              gridRow: 4,
              gridColumnStart: 1,
              gridColumnEnd: 4,
            }}
          />
        )}
        {/* Action bar */}
        <Box
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            pt: 2,
            display: "flex",
            justifyContent: "center",
            gridRow: 5,
            gridColumnStart: 1,
            gridColumnEnd: 4,
          }}
        >
          <ActionBar isVisible={isHeroTurn} overlayContent={overlayContent} />
        </Box>
      </Box>
      {/* Overlay modals */}
      {showTarot && (
        <TarotModal
          onClose={() => setShowTarot(false)}
          onNextHand={() => {
            setShowTarot(false);
            dispatch({ type: "NEXT_HAND" });
          }}
        />
      )}
      <InteractionModal />
      <GameOverModal />
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
      <PlaygroundDrawer
        open={playgroundOpen}
        onClose={() => setPlaygroundOpen(false)}
      />
      <TutorialOverlay />
    </Box>
  );
}
