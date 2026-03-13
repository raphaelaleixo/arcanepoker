import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import { requestTarotReading } from "../../api/tarot";
import { HERO_ID_CONST } from "../../store/initialState";
import tarot from "../../data/tarot";

interface TarotModalProps {
  onClose: () => void;
}

export function TarotModal({ onClose }: TarotModalProps) {
  const { state } = useGame();
  const [prophecy, setProphecy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const hero = state.players.find((p) => p.id === HERO_ID_CONST);

  const arcanaName =
    state.activeArcana != null
      ? (tarot.arcana as Record<string, { fullName: string }>)[
          state.activeArcana.card.value
        ]?.fullName ?? null
      : null;

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

  function handleContinue() {
    onClose();
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
          fontFamily: '"Georgia", "Times New Roman", serif',
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
        The Cards Speak
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          py: 3,
        }}
      >
        {loading ? (
          <CircularProgress sx={{ color: "gold.main" }} />
        ) : (
          <Typography
            variant="body1"
            sx={{
              fontStyle: "italic",
              color: "silver.light",
              textAlign: "center",
              lineHeight: 1.7,
              fontFamily: '"Georgia", "Times New Roman", serif',
            }}
          >
            {prophecy}
          </Typography>
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
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
