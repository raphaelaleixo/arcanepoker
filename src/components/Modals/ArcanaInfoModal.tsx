/**
 * Modal showing all 22 Major Arcana cards with their current game status.
 * Active card gets a gold highlight; played cards are dimmed + grayscale;
 * upcoming cards are shown at full opacity.
 */
import { Button, Chip, Divider, Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useGame } from "../../store/useGame";
import { GOLD_DIVIDER_SX } from "../../theme";
import { ArcaneDialog } from "./ArcaneDialog";
import { CardEntry } from "./CardEntry";
import { getTarotInfo } from "../../data/getTarotInfo";
import type { ArcanaValue } from "../../types/types";

const ALL_ARCANA_VALUES: ArcanaValue[] = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21",
];

type CardStatus = "active" | "played" | "upcoming";

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
    <ArcaneDialog
      open={open}
      onClose={onClose}
      title="Major Arcana"
      actions={
        <Button variant="contained" size="small" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
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

      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />
      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
      >
        Setup
      </Typography>

      <Typography variant="body2" sx={{ color: "white", lineHeight: 1.7 }}>
        The World card (21) is set aside, the remaining 21 cards are split in
        half, The World is shuffled into the second half, and the first half
        is placed on top — ensuring The World only appears late in the game.
      </Typography>
      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />
      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1.5 }}
      >
        The 22 Arcanas
      </Typography>
      <Stack direction="column" gap={1.5}>
        {ALL_ARCANA_VALUES.map((value) => {
          const status = getStatus(value);
          const info = getTarotInfo({ value, suit: "arcana" });
          if (!info) return null;
          return (
            <CardEntry
              key={value}
              card={{ value, suit: "arcana" }}
              info={info}
              showGameEffect
              titleAdornment={
                status === "active" ? (
                  <Chip
                    label="Active"
                    size="small"
                    color="secondary"
                    sx={{ height: 16, fontSize: "0.6rem" }}
                  />
                ) : status === "played" ? (
                  <CheckIcon sx={{ fontSize: "0.85rem", color: "success.main", flexShrink: 0 }} />
                ) : null
              }
              sx={{
                borderRadius: 1,
                p: status === "active" ? 0.5 : 0,
                transition: "opacity 0.3s",
              }}
            />
          );
        })}
      </Stack>
    </ArcaneDialog>
  );
}
