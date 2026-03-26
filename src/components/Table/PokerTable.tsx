/**
 * Top-level layout component for the poker table.
 * Arranges player seats, the community area, and the action bar.
 * Manages card-pick state (Priestess / Chariot interactions) and
 * delegates all overlay UI to TableOverlayContent.
 */
import { useState } from "react";
import { Box, Button } from "@mui/material";
import { useGame } from "../../store/useGame";
import type { ArcanaCard, StandardCard } from "../../types/types";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityArea } from "./CommunityArea";
import { ActionBar } from "./ActionBar";
import { TarotModal } from "../Modals/TarotModal";
import { InteractionModal } from "../Modals/InteractionModal";
import { GameOverModal } from "../Modals/GameOverModal";
import { HERO_ID_CONST } from "../../store/initialState";
import { PlaygroundDrawer } from "../Dev/PlaygroundDrawer";
import { TableOverlayContent } from "./TableOverlayContent";
import { TutorialOverlay } from "../Tutorial/TutorialOverlay";
import { useTutorialOptional } from "../../tutorial/TutorialContext";
import { TutorialNarrationContent } from "../Tutorial/TutorialNarrationContent";
import { ArcanaDisplayCard } from "./ArcanaDisplayCard";

const BETTING_STAGES = ["pre-flop", "flop", "turn", "river", "empress"];

export function PokerTable() {
  const { state, dispatch } = useGame();
  const tutorial = useTutorialOptional();
  const isTutorial = tutorial?.isTutorial ?? false;
  const narration = tutorial?.narration ?? null;
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

  // Mirrors the render conditions inside TableOverlayContent so that
  // overlayContent is undefined (falsy) when nothing would show — allowing
  // ActionBar's `overlayContent ? 1 : 0` guard to work correctly while
  // still using JSX (required for React Fast Refresh / HMR).
  const hasTableOverlay =
    cardPickInteraction !== null ||
    state.pendingInteraction?.type === "page-challenge" ||
    state.pendingInteraction?.type === "arcana-reveal" ||
    state.pendingInteraction?.type === "magician-redraw" ||
    (state.stage === "showdown" && state.pendingInteraction === null);

  // In tutorial mode, skip TableOverlayContent entirely — the tutorial manages
  // all interactive flow via pendingDispatchOnDismiss automatically.
  // This also prevents the arcana-reveal button from flashing during the 100ms
  // gap between dismissNarration() and the REVEAL_ARCANA dispatch.
  const overlayContent = isTutorial ? (
    narration ? (
      <TutorialNarrationContent />
    ) : undefined
  ) : hasTableOverlay ? (
    <TableOverlayContent
      cardPickInteraction={cardPickInteraction}
      selectedCard={selectedCard}
      stage={state.stage}
      pendingInteraction={state.pendingInteraction}
      winnerIds={state.winnerIds}
      communityCards={state.communityCards}
      bigBlind={state.bigBlind}
      isFinalHand={state.isFinalHand}
      onConfirmCardPick={confirmCardPick}
      onKeepBothStar={keepBothStar}
      onNextHand={() => {
        setShowTarot(false);
        dispatch({ type: "NEXT_HAND" });
      }}
      onShowTarot={() => setShowTarot(true)}
      dispatch={dispatch}
    />
  ) : undefined;

  const pendingArcanaCard =
    state.pendingInteraction?.type === "arcana-reveal"
      ? (
          state.pendingInteraction as {
            type: "arcana-reveal";
            arcanaCard: ArcanaCard;
          }
        ).arcanaCard
      : null;

  const arcanaCardToShow =
    pendingArcanaCard ?? state.activeArcana?.card ?? null;

  return (
    <Box
      sx={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1, sm: 2 },
        gap: { xs: 1, sm: 2 },
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          maxHeight: "800px",
          width: "calc(100% - 3em)",
          maxWidth: "500px",
          top: "calc(50% - 400px)",
          left: 0,
          right: 0,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gridTemplateRows: "auto auto auto auto auto",
        }}
      >
        {/* <Box
          sx={{
            gridColumn: "1 / 4",
            gridRow: "1 / 5",
            p: "6em 3em",
          }}
        >
          <Box
            component="img"
            src="/public/art/circleBackground.svg"
            sx={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid",
              borderColor: "#333",
            }}
          />
        </Box> */}
        <CommunityArea
          sx={{
            gridRow: 1,
            gridColumnStart: 1,
            gridColumnEnd: 4,
          }}
        />
        {bot1 && (
          <PlayerSeat
            player={bot1}
            playerIndex={state.players.indexOf(bot1)}
            isActive={activePlayer?.id === bot1.id}
            sx={{
              gridColumn: 1,
              gridRow: 2,
            }}
          />
        )}
        {bot2 && (
          <PlayerSeat
            player={bot2}
            playerIndex={state.players.indexOf(bot2)}
            isActive={activePlayer?.id === bot2.id}
            sx={{
              gridColumn: 3,
              gridRow: 2,
            }}
          />
        )}
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
        <ArcanaDisplayCard
          pendingArcanaCard={pendingArcanaCard}
          arcanaCardToShow={arcanaCardToShow}
        />
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
          <ActionBar
            isVisible={isHeroTurn || (isTutorial && narration !== null)}
            overlayContent={overlayContent}
          />
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
