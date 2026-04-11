/**
 * Top-level layout component for the poker table.
 * Arranges player seats, the community area, and the action bar.
 * Manages card-pick state (Priestess / Chariot interactions) and
 * delegates all overlay UI to TableOverlayContent.
 */
import { useState } from "react";
import { Box } from "@mui/material";
import { useGame } from "../../store/useGame";
import type { ArcanaCard, StandardCard } from "../../types/types";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityArea } from "./CommunityArea";
import { ActionBar } from "./ActionBar";
import { HERO_ID_CONST } from "../../store/initialState";
import { TableOverlayContent } from "./TableOverlayContent";
import { TutorialOverlay } from "../Tutorial/TutorialOverlay";
import { useTutorialOptional } from "../../tutorial/TutorialContext";
import { useDemo3Optional } from "../../demo/Demo3Context";
import { useSettings } from "../../store/SettingsContext";
import { TutorialNarrationContent } from "../Tutorial/TutorialNarrationContent";
import { ArcanaDisplayCard } from "./ArcanaDisplayCard";
import { useGameSounds } from "../../hooks/useGameSounds";
import { PokerTableModals } from "./PokerTableModals";
import { BotSeatsGrid } from "./BotSeatsGrid";
import { TarotMinimizedChip } from "./TarotMinimizedChip";

const BETTING_STAGES = ["pre-flop", "flop", "turn", "river", "empress"];

export function PokerTable() {
  const { state, dispatch } = useGame();
  const tutorial = useTutorialOptional();
  const isTutorial = tutorial?.isTutorial ?? false;
  const narration = tutorial?.narration ?? null;
  const demo3 = useDemo3Optional();
  const { devMode } = useSettings();
  const [showTarot, setShowTarot] = useState(false);
  const [tarotMinimized, setTarotMinimized] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<StandardCard | null>(null);
  const [pageInfoOpen, setPageInfoOpen] = useState(false);
  const [arcanaInfoOpen, setArcanaInfoOpen] = useState(false);
  const [arcanaDiscarding, setArcanaDiscarding] = useState(false);
  const [arcanaRevealCard, setArcanaRevealCard] = useState<ArcanaCard | null>(null);

  useGameSounds([
    showTarot,
    pageInfoOpen,
    arcanaInfoOpen,
    arcanaRevealCard !== null,
    state.stage === "game-over",
  ]);

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

  function handleNextHand() {
    setShowTarot(false);
    if (state.activeArcana) {
      setArcanaDiscarding(true);
      setTimeout(() => {
        setArcanaDiscarding(false);
        dispatch({ type: "NEXT_HAND" });
      }, 370);
    } else {
      dispatch({ type: "NEXT_HAND" });
    }
  }

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
      onNextHand={handleNextHand}
      onShowTarot={() => setShowTarot(true)}
      onRevealArcana={() => {
        if (state.pendingInteraction?.type === "arcana-reveal") {
          setArcanaRevealCard(
            (state.pendingInteraction as { type: "arcana-reveal"; arcanaCard: ArcanaCard }).arcanaCard
          );
        }
      }}
      dispatch={dispatch}
    />
  ) : undefined;

  const gamePendingArcana =
    state.pendingInteraction?.type === "arcana-reveal"
      ? (
          state.pendingInteraction as {
            type: "arcana-reveal";
            arcanaCard: ArcanaCard;
          }
        ).arcanaCard
      : null;

  // During Demo3 cycling, pendingCycleArcana drives the facedown float phase.
  const pendingArcanaCard = demo3?.pendingCycleArcana ?? gamePendingArcana;

  // When demo3 is showing a card facedown, use that card as arcanaCardToShow
  // so PlayingCard renders the correct face before it flips.
  // For display-only arcanas (Death, Sun), use displayArcana instead of activeArcana.
  const arcanaCardToShow =
    pendingArcanaCard ??
    demo3?.displayArcana ??
    state.activeArcana?.card ??
    null;

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
          top: "max(0px, calc(50% - 400px))",
          left: 0,
          right: 0,
          mx: "auto",
          display: "grid",
          gridTemplateColumns: "minmax(130px, 1fr) auto minmax(130px, 1fr)",
          gridTemplateRows: "auto auto auto auto auto",
        }}
      >
        <CommunityArea
          sx={{
            gridRow: 1,
            gridColumnStart: 1,
            gridColumnEnd: 4,
          }}
          onOpenPageInfo={() => setPageInfoOpen(true)}
        />
        <BotSeatsGrid
          players={state.players}
          activePlayerId={activePlayer?.id}
        />
        {hero && (
          <PlayerSeat
            player={hero}
            playerIndex={heroIndex}
            isHero
            isActive={activePlayer?.id === hero.id}
            onCardClick={cardPickInteraction ? handleCardPick : undefined}
            selectedCard={cardPickInteraction ? selectedCard : undefined}
            onOpenPageInfo={() => setPageInfoOpen(true)}
            sx={{
              gridRow: 4,
              gridColumnStart: 1,
              gridColumnEnd: 4,
              mt: "-1em",
            }}
          />
        )}
        <ArcanaDisplayCard
          pendingArcanaCard={pendingArcanaCard}
          arcanaCardToShow={arcanaCardToShow}
          isDiscarding={arcanaDiscarding || (demo3?.arcanaDiscarding ?? false)}
          onOpenArcanaInfo={() => setArcanaInfoOpen(true)}
        />
        {showTarot && tarotMinimized && (
          <TarotMinimizedChip onClick={() => setTarotMinimized(false)} />
        )}
        {/* Action bar */}
        <Box
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            pt: 1,
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
      <PokerTableModals
        showTarot={showTarot}
        tarotMinimized={tarotMinimized}
        onMinimizeTarot={() => setTarotMinimized(true)}
        onRestoreTarot={() => setTarotMinimized(false)}
        onCloseTarot={() => {
          setShowTarot(false);
          setTarotMinimized(false);
        }}
        onNextHandTarot={() => {
          setTarotMinimized(false);
          handleNextHand();
        }}
        pageInfoOpen={pageInfoOpen}
        onClosePageInfo={() => setPageInfoOpen(false)}
        arcanaInfoOpen={arcanaInfoOpen}
        onCloseArcanaInfo={() => setArcanaInfoOpen(false)}
        arcanaRevealCard={arcanaRevealCard}
        onDismissArcanaReveal={() => {
          setArcanaRevealCard(null);
          dispatch({ type: "REVEAL_ARCANA" });
        }}
        devMode={devMode}
        playgroundOpen={playgroundOpen}
        onOpenPlayground={() => setPlaygroundOpen(true)}
        onClosePlayground={() => setPlaygroundOpen(false)}
        onOpenTarotFromPlayground={() => {
          setPlaygroundOpen(false);
          setShowTarot(true);
        }}
        onOpenGameOverFromPlayground={() => {
          setPlaygroundOpen(false);
          dispatch({ type: "DEV_FORCE_GAME_OVER" });
        }}
        dispatch={dispatch}
      />
      <TutorialOverlay />
    </Box>
  );
}
