/**
 * Modal explaining the Page card — a card unique to Arcane Poker.
 * Triggered from the tooltip shown on Page (Ø) cards in the hero's hand
 * and the community area.
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
import type { Suit } from "../../types/types";

const SUITS: Suit[] = ["hearts", "clubs", "diamonds", "spades"];

type TarotEntry = {
  fullName: string;
  tags: string[];
  description: string;
};

function PageCardEntry({ suit }: { suit: Suit }) {
  const info = (tarot[suit] as Record<string, TarotEntry>)["0"];
  if (!info) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box sx={{ display: "inline-block", scale: 0.7, flexShrink: 0 }}>
        <PlayingCard rank="0" suit={suit} flipped />
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
      </Stack>
    </Stack>
  );
}

interface PageInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function PageInfoModal({ open, onClose }: PageInfoModalProps) {
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
        The Page
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
        >
          Card Value
        </Typography>
        <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
          The Page (Ø) is a card unique to Arcane Poker — one added to each
          suit, bringing the deck to <strong>56 cards</strong> total. It has
          the lowest value when played alone, but connects <em>before</em> the
          Ace in straights: Ø · A · 2 · 3 · 4.
        </Typography>

        <Divider sx={{ my: 2, borderColor: "rgba(255,215,0,0.2)" }} />

        <Typography
          variant="overline"
          sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
        >
          Arcana Trigger
        </Typography>
        <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
          The <strong>first</strong> Page dealt to the community cards draws a
          Major Arcana card, which changes the rules of that hand. This can
          only happen <em>once per round</em>.
        </Typography>

        <Divider sx={{ my: 2, borderColor: "rgba(255,215,0,0.2)" }} />

        <Typography
          variant="overline"
          sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
        >
          Challenge of the Page
        </Typography>
        <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
          Win a hand while holding a Page in your hole cards and every other
          player must pay you <strong>1 big blind</strong>. The bounty is
          collected before the next hand begins.
        </Typography>

        <Divider sx={{ my: 2, borderColor: "rgba(255,215,0,0.2)" }} />

        <Typography
          variant="overline"
          sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1.5 }}
        >
          The Pages
        </Typography>
        <Stack direction="column" gap={1.5}>
          {SUITS.map((suit) => (
            <PageCardEntry key={suit} suit={suit} />
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
