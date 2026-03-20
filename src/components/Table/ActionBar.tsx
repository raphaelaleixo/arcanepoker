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

interface ActionBarProps {
  isVisible?: boolean;
  /** When provided, fades in over the action buttons in the same fixed container. */
  overlayContent?: ReactNode;
}

export function ActionBar({ isVisible = true, overlayContent }: ActionBarProps) {
  const { state, dispatch } = useGame();

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);

  // The Devil arcana doubles the minimum raise to 4× the current bet.
  const devilActive = state.activeArcana?.effectKey === "devil-double-raise";
  const judgementFoldBlocked =
    state.activeArcana?.effectKey === "judgement-no-fold" &&
    state.judgementCommittedIds.includes(HERO_ID_CONST);
  const toCall = hero ? state.currentBet - hero.currentBet : 0;
  const canCheck = toCall === 0;
  const minRaiseCalc = hero
    ? devilActive
      ? state.currentBet * 4
      : Math.max(state.currentBet * 2, hero.currentBet + state.bigBlind)
    : state.bigBlind;
  const minRaise = Math.max(minRaiseCalc, state.bigBlind);
  const effectiveMax = hero ? Math.max(minRaise, hero.stack + hero.currentBet) : minRaise;
  const callExceedsStack = hero ? toCall >= hero.stack : false;

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
  useEffect(() => { setRaiseAmount(minRaise); }, [minRaise]);

  if (!hero) return null;

  const clampedRaise = Math.min(Math.max(raiseAmount, minRaise), effectiveMax);
  const sliderDisabled = effectiveMax <= minRaise;
  const isAllIn = clampedRaise >= effectiveMax;

  function handleFold() {
    dispatch({ type: "PLAYER_ACTION", payload: { playerId: HERO_ID_CONST, action: "fold" } });
  }

  function handleCheckOrCall() {
    dispatch({
      type: "PLAYER_ACTION",
      payload: { playerId: HERO_ID_CONST, action: canCheck ? "check" : "call" },
    });
  }

  function handleRaiseOrAllIn() {
    if (isAllIn) {
      dispatch({ type: "PLAYER_ACTION", payload: { playerId: HERO_ID_CONST, action: "all-in" } });
    } else {
      dispatch({
        type: "PLAYER_ACTION",
        payload: { playerId: HERO_ID_CONST, action: "raise", amount: clampedRaise },
      });
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        width: "100%",
        maxWidth: 600,
      }}
    >
      {/*
        CSS grid stack: action controls and overlayContent share gridArea "1/1".
        Opacity transitions swap between them with no layout shift.
      */}
      <Box sx={{ display: "grid" }}>
        {/* Action controls */}
        <Box
          sx={{
            gridArea: "1 / 1",
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
          />
        </Box>

        {/* Overlay content — same grid cell, fades in when provided */}
        <Box
          sx={{
            gridArea: "1 / 1",
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
