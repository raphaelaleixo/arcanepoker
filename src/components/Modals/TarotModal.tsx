import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import { requestTarotReading } from "../../api/tarot";
import { HERO_ID_CONST } from "../../store/initialState";
import tarot from "../../data/tarot";
import { PlayingCard } from "../Card/PlayingCard";
import type {
  ArcanaValue,
  ArcanaSuit,
  StandardCardValue,
  Suit,
} from "../../types/types";

interface TarotModalProps {
  onClose: () => void;
  onNextHand: () => void;
}

export function TarotModal({ onClose, onNextHand }: TarotModalProps) {
  const { state } = useGame();
  const [prophecy, setProphecy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);

  const arcanaName =
    state.activeArcana != null
      ? ((tarot.arcana as Record<string, { fullName: string }>)[
          state.activeArcana.card.value
        ]?.fullName ?? null)
      : null;

  const arcanaCard = state.activeArcana?.card ?? null;

  let arcanaSubstituted = false;
  function communityCardDisplayProps(card: { value: string; suit: string }): {
    rank: ArcanaValue | StandardCardValue;
    suit: ArcanaSuit | Suit;
  } {
    if (card.value === "0" && arcanaCard && !arcanaSubstituted) {
      arcanaSubstituted = true;
      return { rank: arcanaCard.value, suit: arcanaCard.suit };
    }
    return { rank: card.value as StandardCardValue, suit: card.suit as Suit };
  }

  function holeCardDisplayProps(card: { value: string; suit: string }): {
    rank: StandardCardValue;
    suit: Suit;
  } {
    return { rank: card.value as StandardCardValue, suit: card.suit as Suit };
  }

  const handRank =
    state.handResults.find((r) => r.playerId === HERO_ID_CONST)?.rankName ??
    "high-card";

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setProphecy(null);

    const request = {
      heroHoleCards: hero?.holeCards ?? [],
      communityCards: state.communityCards,
      handRank,
      activeArcanaName: arcanaName,
    };

    requestTarotReading(request).then((res) => {
      if (!cancelled) {
        setProphecy(res.prophecy);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // We intentionally only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parseLine(line: string, key: number) {
    const isBigPicture = line.startsWith("The Big Picture");
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    const nodes = parts.map((part, i) =>
      i % 2 === 1 ? (
        <Box
          key={i}
          component="span"
          sx={{ fontWeight: "bold", color: "gold.light" }}
        >
          {part}
        </Box>
      ) : (
        part
      ),
    );
    return (
      <Typography
        key={key}
        variant="body1"
        sx={{
          color: isBigPicture ? "gold.light" : "silver.light",
          textAlign: "left",
          lineHeight: 1.8,
          fontSize: isBigPicture ? "0.95rem" : "0.9rem",
          mt: isBigPicture ? 1.5 : 1,
          borderTop: isBigPicture ? "1px solid rgba(255,215,0,0.2)" : "none",
          pt: isBigPicture ? 1.5 : 0,
        }}
      >
        {nodes}
      </Typography>
    );
  }

  function handleContinue() {
    onClose();
    onNextHand();
  }

  if (minimized) {
    return (
      <Chip
        label="The Cards Speak"
        onClick={() => setMinimized(false)}
        sx={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 1300,
          bgcolor: "secondary.dark",
          color: "gold.light",
          fontWeight: "bold",
          cursor: "pointer",
          "&:hover": { bgcolor: "secondary.main" },
        }}
      />
    );
  }

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "linear-gradient(135deg, #0F3D20 0%, #1a0a2e 100%)",
          border: "1px solid",
          borderColor: "gold.dark",
          boxShadow: "0 0 40px rgba(255,215,0,0.2)",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "gold.main",
          fontFamily: 'Young Serif, "Georgia", serif',
          textAlign: "center",
          fontSize: "1.4rem",
          letterSpacing: "0.08em",
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
          onClick={() => setMinimized(true)}
          sx={{ position: "absolute", right: 8, top: 8, color: "gold.dark" }}
          title="Minimize"
        >
          &#8722;
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          minHeight: 160,
          py: 3,
        }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="flex-end"
          gap={2}
          sx={{ my: 2, py: 0 }}
        >
          <Stack direction="row" alignItems="flex-end">
            {(hero?.holeCards ?? []).map((card, i) => (
              <Box
                key={i}
                sx={{
                  transform: i === 0 ? "rotate(-6deg)" : "rotate(6deg)",
                  transformOrigin: "bottom center",
                  ml: i === 0 ? 0 : -1.5,
                }}
              >
                <PlayingCard small {...holeCardDisplayProps(card)} flipped />
              </Box>
            ))}
          </Stack>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: "rgba(255,215,0,0.2)" }}
          />
          <Stack direction="row" alignItems="flex-end" gap={0.5}>
            {state.communityCards.map((card, i) => (
              <PlayingCard
                key={i}
                small
                {...communityCardDisplayProps(card)}
                flipped
              />
            ))}
          </Stack>
        </Stack>

        {loading ? (
          <CircularProgress sx={{ color: "gold.main" }} />
        ) : (
          <Box sx={{ width: "100%" }}>
            {prophecy
              ?.replace(/\/n/g, "\n\n")
              .split("\n")
              .map((line, i) =>
                line.trim() ? (
                  parseLine(line, i)
                ) : (
                  <Box key={i} sx={{ height: 12 }} />
                ),
              )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={loading}
          sx={{
            px: 4,
            background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
            border: "1px solid",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": {
              background: "linear-gradient(135deg, #388E3C, #2E7D32)",
            },
          }}
        >
          Next Hand
        </Button>
      </DialogActions>
    </Dialog>
  );
}
