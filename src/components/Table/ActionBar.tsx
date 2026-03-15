import { useEffect, useState } from "react";
import { Box, Button, Slider, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";

interface ActionBarProps {
  isVisible?: boolean;
  /** When provided, fades in over the action buttons in the same fixed container. */
  overlayContent?: ReactNode;
}

export function ActionBar({ isVisible = true, overlayContent }: ActionBarProps) {
  const { state, dispatch } = useGame();

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);

  if (!hero) return null;

  const toCall = state.currentBet - hero.currentBet;
  const canCheck = toCall === 0;

  const devilActive =
    state.activeArcana?.effectKey === "devil-double-raise";

  const minRaiseCalc = devilActive
    ? state.currentBet * 4
    : Math.max(state.currentBet * 2, hero.currentBet + state.bigBlind);

  const minRaise = Math.max(minRaiseCalc, state.bigBlind);
  const maxRaise = hero.stack + hero.currentBet;

  return (
    <ActionBarInner
      isVisible={isVisible}
      overlayContent={overlayContent}
      toCall={toCall}
      canCheck={canCheck}
      minRaise={minRaise}
      maxRaise={maxRaise}
      heroStack={hero.stack}
      bigBlind={state.bigBlind}
      dispatch={dispatch}
    />
  );
}

interface ActionBarInnerProps {
  isVisible: boolean;
  overlayContent?: ReactNode;
  toCall: number;
  canCheck: boolean;
  minRaise: number;
  maxRaise: number;
  heroStack: number;
  bigBlind: number;
  dispatch: ReturnType<typeof useGame>["dispatch"];
}

function ActionBarInner({
  isVisible,
  overlayContent,
  toCall,
  canCheck,
  minRaise,
  maxRaise,
  heroStack,
  bigBlind,
  dispatch,
}: ActionBarInnerProps) {
  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);

  useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);

  const effectiveMax = Math.max(minRaise, maxRaise);
  const clampedRaise = Math.min(Math.max(raiseAmount, minRaise), effectiveMax);

  function handleFold() {
    dispatch({
      type: "PLAYER_ACTION",
      payload: { playerId: HERO_ID_CONST, action: "fold" },
    });
  }

  function handleCheckOrCall() {
    if (canCheck) {
      dispatch({
        type: "PLAYER_ACTION",
        payload: { playerId: HERO_ID_CONST, action: "check" },
      });
    } else {
      dispatch({
        type: "PLAYER_ACTION",
        payload: { playerId: HERO_ID_CONST, action: "call" },
      });
    }
  }

  const callExceedsStack = toCall >= heroStack;
  const sliderDisabled = effectiveMax <= minRaise;
  const isAllIn = clampedRaise >= effectiveMax;

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
        p: 2,
        borderRadius: 2,
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        width: "100%",
        maxWidth: 600,
      }}
    >
      {/* Overlay content (e.g. showdown buttons) — fades in when provided */}
      {overlayContent !== undefined && (
        <Box
          sx={{
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
      )}
      {/* Action controls — hidden when overlay is active */}
      <Box
        sx={{
          opacity: isVisible && !overlayContent ? 1 : 0,
          pointerEvents: isVisible && !overlayContent ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      >
      {/* Raise slider */}
      <Box sx={{ px: 1, mb: 1 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: "silver.light" }}>
            Raise amount
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "gold.main", fontWeight: "bold" }}
          >
            {clampedRaise}
          </Typography>
        </Stack>
        <Slider
          value={clampedRaise}
          min={minRaise}
          max={effectiveMax}
          step={bigBlind}
          disabled={sliderDisabled}
          onChange={(_e, v) => setRaiseAmount(v as number)}
          sx={{
            color: "gold.main",
            "& .MuiSlider-thumb": {
              borderColor: "gold.dark",
            },
          }}
        />
      </Box>

      {/* Action buttons */}
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={handleFold}
        >
          Fold
        </Button>

        {canCheck ? (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handleCheckOrCall}
          >
            Check
          </Button>
        ) : callExceedsStack ? (
          <Button
            variant="contained"
            color="info"
            size="small"
            onClick={handleCheckOrCall}
          >
            All-in {heroStack}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="info"
            size="small"
            onClick={handleCheckOrCall}
          >
            Call {toCall}
          </Button>
        )}

        <Button
          variant="contained"
          color={isAllIn ? "warning" : "primary"}
          size="small"
          onClick={handleRaiseOrAllIn}
          disabled={heroStack === 0}
        >
          {isAllIn ? `All-In (${heroStack})` : `${toCall === 0 ? "Bet" : "Raise"} ${clampedRaise}`}
        </Button>
      </Stack>
      </Box>
    </Box>
  );
}
