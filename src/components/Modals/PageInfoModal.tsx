/**
 * Modal explaining the Page card — a card unique to Arcane Poker.
 * Triggered from the tooltip shown on Page (0) cards in the hero's hand
 * and the community area.
 */
import { Divider, Stack, Typography } from "@mui/material";
import type { Suit } from "../../types/types";
import { GOLD_DIVIDER_SX } from "../../theme";
import { ArcaneDialog, ArcaneDialogCloseButton } from "./ArcaneDialog";
import { CardEntry } from "./CardEntry";
import { getTarotInfo } from "../../data/getTarotInfo";

const SUITS: Suit[] = ["hearts", "clubs", "diamonds", "spades"];

interface PageInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function PageInfoModal({ open, onClose }: PageInfoModalProps) {
  return (
    <ArcaneDialog
      open={open}
      onClose={onClose}
      title="The Page"
      actions={<ArcaneDialogCloseButton onClick={onClose} />}
    >
      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
      >
        Card Value
      </Typography>
      <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
        The Page (0) is a card unique to Arcane Poker — one added to each
        suit, bringing the deck to <strong>56 cards</strong> total. It has
        the lowest value when played alone, but connects <em>before</em> the
        Ace in straights: 0 · A · 2 · 3 · 4.
      </Typography>

      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />

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

      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />

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

      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />

      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1.5 }}
      >
        The Pages
      </Typography>
      <Stack direction="column" gap={1.5}>
        {SUITS.map((suit) => {
          const info = getTarotInfo({ value: "0", suit });
          if (!info) return null;
          return (
            <CardEntry key={suit} card={{ value: "0", suit }} info={info} />
          );
        })}
      </Stack>
    </ArcaneDialog>
  );
}
