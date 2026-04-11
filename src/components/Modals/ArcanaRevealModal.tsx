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

const ROMAN = [
  "0",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
];

const toRoman = (value: string) => ROMAN[Number(value)] ?? value;

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

  const info =
    (tarot.arcana as Record<string, TarotEntry>)[arcanaCard.value] ?? null;

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
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={2}
          useFlexGap
          sx={{ pt: 3 }}
        >
          <Box
            sx={{
              display: "inline-block",
              scale: 0.9,
              flexShrink: 0,
              transformOrigin: "top center",
            }}
          >
            <PlayingCard
              rank={arcanaCard.value as ArcanaValue}
              suit={arcanaCard.suit as ArcanaSuit}
              flipped
            />
          </Box>

          {info && (
            <Stack spacing={0}>
              <Typography
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontWeight: "bold",
                  fontSize: "1.125rem",
                  fontFamily: 'Young Serif, "Georgia", serif',
                }}
              >
                {toRoman(arcanaCard.value)} - {info.fullName}
              </Typography>
              <Typography
                component="div"
                variant="caption"
                sx={{
                  my: 0.5,
                  color: "silver.main",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {info.tags.join(" · ")}
              </Typography>
              {info.gameEffect && (
                <Typography
                  variant="caption"
                  sx={{ color: "white", fontSize: "1rem", lineHeight: 1.5 }}
                >
                  {info.gameEffect}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{
                  color: "gold.light",
                  fontSize: "0.875rem",
                  lineHeight: 1.3,
                  fontStyle: "italic",
                  mt: 0.5,
                }}
              >
                {info.description}
              </Typography>
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
