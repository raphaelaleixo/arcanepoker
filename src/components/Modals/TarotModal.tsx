import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import { HERO_ID_CONST } from "../../store/initialState";
import tarot from "../../data/tarot";
import { PlayingCard } from "../Card/PlayingCard";
import { evaluateBestHand } from "../../engine/handEvaluator";
import { buildEvalOptions } from "../../store/gameReducer";
import type {
  StandardCard,
  ArcanaCard,
  StandardCardValue,
  ArcanaValue,
  Suit,
  ArcanaSuit,
} from "../../types/types";
import { Minimize } from "@mui/icons-material";

interface TarotModalProps {
  onClose: () => void;
  onNextHand: () => void;
  minimized: boolean;
  onMinimize: () => void;
  onRestore: () => void;
}

type TarotEntry = {
  fullName: string;
  tags: string[];
  description: string;
  gameEffect?: string;
};

function getTarotInfo(card: StandardCard | ArcanaCard): TarotEntry | null {
  if (card.suit === "arcana") {
    return (tarot.arcana as Record<string, TarotEntry>)[card.value] ?? null;
  }
  const suitData = tarot[card.suit] as Record<string, TarotEntry>;
  return suitData[card.value] ?? null;
}

function CardEntry({
  card,
  showGameEffect,
}: {
  card: StandardCard | ArcanaCard;
  showGameEffect?: boolean;
}) {
  const info = getTarotInfo(card);
  if (!info) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box sx={{ display: "inline-block", scale: 0.7, flexShrink: 0 }}>
        <PlayingCard
          rank={card.value as StandardCardValue | ArcanaValue}
          suit={card.suit as Suit | ArcanaSuit}
          flipped
        />
      </Box>
      <Stack spacing={0}>
        <Typography
          variant="caption"
          sx={{
            color: "gold.main",
            fontWeight: "bold",
            fontSize: "0.875rem",
            fontFamily: 'Young Serif, "Georgia", serif',
          }}
        >
          {info.fullName}
        </Typography>
        <Typography
          component="div"
          variant="caption"
          sx={{
            my: 0.5,
            color: "silver.main",
            fontSize: "0.6rem",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {info.tags.join(" · ")}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "white", fontSize: "0.75rem", lineHeight: 1.5 }}
        >
          {info.description}
        </Typography>
        {showGameEffect && info.gameEffect && (
          <Typography
            variant="caption"
            sx={{
              color: "gold.light",
              fontSize: "0.65rem",
              fontStyle: "italic",
              mt: 0.5,
            }}
          >
            {info.gameEffect}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
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
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.8)",
            border: "1px solid",
            borderColor: "gold.dark",
            borderRadius: 2,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "gold.main",
          fontFamily: 'Young Serif, "Georgia", serif',
          textAlign: "center",
          fontSize: "1.4rem",
          borderBottom: "1px solid rgba(255,215,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pr: 6,
        }}
      >
        Your Cards Speak
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
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack direction="column" gap={1.5}>
          {bestCards.map((card, i) => (
            <CardEntry key={i} card={card} />
          ))}
        </Stack>

        {arcanaCard && (
          <>
            <Divider sx={{ my: 2, borderColor: "rgba(255,215,0,0.2)" }} />
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
            <CardEntry card={arcanaCard} showGameEffect />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button variant="contained" size="small" onClick={handleContinue}>
          Next Hand
        </Button>
      </DialogActions>
    </Dialog>
  );
}
