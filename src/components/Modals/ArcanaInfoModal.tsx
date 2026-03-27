/**
 * Modal showing all 22 Major Arcana cards with their current game status.
 * Active card gets a gold highlight; played cards are dimmed + grayscale;
 * upcoming cards are shown at full opacity.
 */
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { PlayingCard } from "../Card/PlayingCard";
import tarot from "../../data/tarot";
import { useGame } from "../../store/useGame";
import type { ArcanaValue } from "../../types/types";

const ALL_ARCANA_VALUES: ArcanaValue[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
];

type ArcanaEntry = {
  fullName: string;
  tags: string[];
  description: string;
  gameEffect?: string;
};

type CardStatus = "active" | "played" | "upcoming";

function ArcanaCardEntry({
  value,
  status,
}: {
  value: ArcanaValue;
  status: CardStatus;
}) {
  const info = (tarot.arcana as Record<string, ArcanaEntry>)[value];
  if (!info) return null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        borderRadius: 1,
        p: status === "active" ? 0.5 : 0,
        transition: "opacity 0.3s",
      }}
    >
      <Box sx={{ display: "inline-block", scale: 0.7, flexShrink: 0 }}>
        <PlayingCard rank={value} suit="arcana" flipped />
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
        {info.gameEffect && (
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

interface ArcanaInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function ArcanaInfoModal({ open, onClose }: ArcanaInfoModalProps) {
  const { state } = useGame();

  const activeValue = state.activeArcana?.card.value ?? null;
  const deckValues = new Set(state.arcanaDeck.map((c) => c.value));

  function getStatus(value: ArcanaValue): CardStatus {
    if (value === activeValue) return "active";
    if (!deckValues.has(value)) return "played";
    return "upcoming";
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        Major Arcana
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: "gold.dark",
            display: "block",
            textAlign: "center",
            mb: 1,
          }}
        >
          About
        </Typography>
        <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
          The Major Arcana is a 22-card deck that modifies the rules of the
          game. When the first Page is dealt to the community cards each round,
          the top Arcana card is drawn and its effect takes hold for that hand.
          Once a card is drawn, it's removed from the deck from the rest of the
          game.
        </Typography>

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
          Setup
        </Typography>

        <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
          The World card (21) is set aside, the remaining 21 cards are split in
          half, The World is shuffled into the second half, and the first half
          is placed on top — ensuring The World only appears late in the game.
        </Typography>
        <Divider sx={{ my: 2, borderColor: "rgba(255,215,0,0.2)" }} />
        <Typography
          variant="overline"
          sx={{
            color: "gold.dark",
            display: "block",
            textAlign: "center",
            mb: 1.5,
          }}
        >
          The 22 Arcanas
        </Typography>
        <Stack direction="column" gap={1.5}>
          {ALL_ARCANA_VALUES.map((value) => (
            <ArcanaCardEntry
              key={value}
              value={value}
              status={getStatus(value)}
            />
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button variant="contained" size="small" onClick={onClose}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
