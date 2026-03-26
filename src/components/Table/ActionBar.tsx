/**
 * The hero's action control panel.
 * Derives game state, owns the raiseAmount slider state, and composes
 * RaiseSlider + ActionButtons. Uses a CSS grid stack to cross-fade between
 * action controls and overlayContent (e.g. showdown buttons, arcana prompts).
 * ActionBarInner is deleted — all logic lives directly in ActionBar.
 */
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";
import { RaiseSlider } from "./RaiseSlider";
import { ActionButtons } from "./ActionButtons";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

interface ActionBarProps {
  isVisible?: boolean;
  /** When provided, fades in over the action buttons in the same fixed container. */
  overlayContent?: ReactNode;
}

export function ActionBar({
  isVisible = true,
  overlayContent,
}: ActionBarProps) {
  const { state, dispatch } = useGame();
  const tutorial = useTutorialOptional();
  const tutorialAllowedAction = tutorial?.tutorialAllowedAction ?? null;

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);

  // The Devil arcana doubles the minimum raise to 4× the current bet.
  const devilActive = state.activeArcana?.effectKey === "devil-double-raise";
  // Devil: first actor in each post-flop round must bet (checking is forbidden).
  const devilMustBet =
    devilActive && state.roundActors.length === 0 && state.currentBet === 0;
  const judgementFoldBlocked =
    state.activeArcana?.effectKey === "judgement-no-fold" &&
    state.judgementCommittedIds.includes(HERO_ID_CONST);
  const toCall = hero ? state.currentBet - hero.currentBet : 0;
  const canCheck = toCall === 0;
  const minRaiseCalc = hero
    ? Math.max(state.currentBet * 2, hero.currentBet + state.bigBlind)
    : state.bigBlind;
  const minRaise = Math.max(minRaiseCalc, state.bigBlind);
  const effectiveMax = hero
    ? Math.max(minRaise, hero.stack + hero.currentBet)
    : minRaise;
  const callExceedsStack = hero ? toCall >= hero.stack : false;

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
  useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);

  if (!hero) return null;

  const clampedRaise = Math.min(Math.max(raiseAmount, minRaise), effectiveMax);
  const sliderDisabled = effectiveMax <= minRaise;
  const isAllIn = clampedRaise >= effectiveMax;

  function handleFold() {
    dispatch({
      type: "PLAYER_ACTION",
      payload: { playerId: HERO_ID_CONST, action: "fold" },
    });
  }

  function handleCheckOrCall() {
    dispatch({
      type: "PLAYER_ACTION",
      payload: { playerId: HERO_ID_CONST, action: canCheck ? "check" : "call" },
    });
  }

  function handleRaiseOrAllIn() {
    if (isAllIn) {
      dispatch({
        type: "PLAYER_ACTION",
        payload: { playerId: HERO_ID_CONST, action: "all-in" },
      });
    } else {
      dispatch({
        type: "PLAYER_ACTION",
        payload: {
          playerId: HERO_ID_CONST,
          action: "raise",
          amount: clampedRaise,
        },
      });
    }
  }

  return (
    <Box
      sx={{
        width: "100%",
        // Elevate above the tutorial backdrop (z-index 1290) when active
        ...(tutorial && { position: "relative", zIndex: 1300 }),
      }}
    >
      {/*
        Action controls define the container height.
        overlayContent is absolutely positioned so it never contributes to
        the measured height — no layout shift when overlay appears or changes.
      */}
      <Box sx={{ position: "relative" }}>
        {/* Action controls — always occupies layout space */}
        <Box
          sx={{
            opacity: isVisible && !overlayContent ? 1 : 0,
            pointerEvents: isVisible && !overlayContent ? "auto" : "none",
            transition: "opacity 200ms ease",
          }}
        >
          <RaiseSlider
            value={clampedRaise}
            minRaise={minRaise}
            maxRaise={effectiveMax}
            bigBlind={state.bigBlind}
            disabled={sliderDisabled}
            onChange={setRaiseAmount}
          />
          <ActionButtons
            canCheck={canCheck}
            callExceedsStack={callExceedsStack}
            heroStack={hero.stack}
            toCall={toCall}
            isAllIn={isAllIn}
            clampedRaise={clampedRaise}
            onFold={handleFold}
            onCheckOrCall={handleCheckOrCall}
            onRaiseOrAllIn={handleRaiseOrAllIn}
            foldDisabled={judgementFoldBlocked}
            checkDisabled={devilMustBet}
            tutorialAllowedAction={tutorialAllowedAction}
          />
        </Box>

        {/* Overlay content — absolutely positioned so it doesn't affect height.
            top/left/right anchor with minHeight:"100%" lets short overlays stay
            centered (flex) while tall content (TutorialNarrationContent) grows
            downward instead of overflowing upward into the hero-seat area. */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            minHeight: "100%",
            opacity: overlayContent ? 1 : 0,
            pointerEvents: overlayContent ? "auto" : "none",
            transition: "opacity 200ms ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {overlayContent}
        </Box>
      </Box>
    </Box>
  );
}
