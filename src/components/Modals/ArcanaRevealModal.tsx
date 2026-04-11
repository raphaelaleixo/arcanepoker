import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import type { ArcanaCard, ArcanaValue, ArcanaSuit } from "../../types/types";
import { PlayingCard } from "../Card/PlayingCard";
import tarot from "../../data/tarot";

type TarotEntry = {
  fullName: string;
  tags: string[];
  description: string;
  gameEffect?: string;
};

interface ArcanaRevealModalProps {
  open: boolean;
  arcanaCard: ArcanaCard | null;
  onDismiss: () => void;
}

export function ArcanaRevealModal({
  open,
  arcanaCard,
  onDismiss,
}: ArcanaRevealModalProps) {
  if (!arcanaCard) return null;

  const info = (tarot.arcana as Record<string, TarotEntry>)[
    arcanaCard.value
  ] ?? null;

  return (
    <Dialog
      open={open}
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
        }}
      >
        A Major Arcana Reveals Itself
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack direction="column" alignItems="center" spacing={2}>
          <Box sx={{ display: "inline-block", scale: 0.85 }}>
            <PlayingCard
              rank={arcanaCard.value as ArcanaValue}
              suit={arcanaCard.suit as ArcanaSuit}
              flipped
            />
          </Box>

          {info && (
            <Stack spacing={0.5} alignItems="center" sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                sx={{
                  color: "gold.main",
                  fontFamily: 'Young Serif, "Georgia", serif',
                  fontWeight: "bold",
                }}
              >
                {info.fullName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "silver.main",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {info.tags.join(" · ")}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "white", fontSize: "0.8rem", lineHeight: 1.5, mt: 1 }}
              >
                {info.description}
              </Typography>
              {info.gameEffect && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "gold.light",
                    fontSize: "0.7rem",
                    fontStyle: "italic",
                    mt: 1,
                  }}
                >
                  {info.gameEffect}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button variant="contained" size="small" onClick={onDismiss}>
          Accept Fate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
