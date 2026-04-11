import {
  Button,
  Divider,
  IconButton,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";
import { evaluateBestHand } from "../../engine/handEvaluator";
import { buildEvalOptions } from "../../store/gameReducer";
import type { StandardCard } from "../../types/types";
import { Minimize } from "@mui/icons-material";
import { GOLD_DIVIDER_SX } from "../../theme";
import { ArcaneDialog } from "./ArcaneDialog";
import { CardEntry } from "./CardEntry";
import { getTarotInfo } from "../../data/getTarotInfo";

interface TarotModalProps {
  onClose: () => void;
  onNextHand: () => void;
  minimized: boolean;
  onMinimize: () => void;
  onRestore: () => void;
}

export function TarotModal({
  onClose,
  onNextHand,
  minimized,
  onMinimize,
}: TarotModalProps) {
  const { state } = useGame();

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);
  const heroCards = hero?.holeCards ?? [];
  const isHermit = state.activeArcana?.effectKey === "hermit-hole-only";

  const available = isHermit
    ? heroCards
    : [...heroCards, ...state.communityCards];
  const evalOpts = buildEvalOptions(state);

  const bestCards: StandardCard[] =
    available.length > 0
      ? evaluateBestHand(available, evalOpts).bestFive
      : heroCards;

  const arcanaCard = state.activeArcana?.card ?? null;

  function handleContinue() {
    onClose();
    onNextHand();
  }

  if (minimized) return null;

  return (
    <ArcaneDialog
      open
      title="Your Cards Speak"
      titleAction={
        <IconButton
          size="small"
          onClick={onMinimize}
          sx={{ position: "absolute", right: 16, top: 16, color: "gold.dark" }}
          title="Minimize"
        >
          <SvgIcon>
            <Minimize />
          </SvgIcon>
        </IconButton>
      }
      titleSx={{ display: "flex", alignItems: "center", justifyContent: "center", pr: 6 }}
      actions={
        <Button variant="contained" size="small" onClick={handleContinue}>
          Next Hand
        </Button>
      }
    >
      <Stack direction="column" gap={1.5}>
        {bestCards.map((card, i) => {
          const info = getTarotInfo(card);
          if (!info) return null;
          return <CardEntry key={i} card={card} info={info} />;
        })}
      </Stack>

      {arcanaCard && (() => {
        const info = getTarotInfo(arcanaCard);
        if (!info) return null;
        return (
          <>
            <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />
            <Typography
              variant="overline"
              sx={{
                color: "gold.dark",
                display: "block",
                textAlign: "center",
                mb: 1,
              }}
            >
              Active Arcana
            </Typography>
            <CardEntry card={arcanaCard} info={info} showGameEffect />
          </>
        );
      })()}
    </ArcaneDialog>
  );
}
