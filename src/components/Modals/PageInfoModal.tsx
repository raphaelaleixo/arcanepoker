/**
 * Modal explaining the Page card — a card unique to Arcane Poker.
 * Triggered from the tooltip shown on Page (0) cards in the hero's hand
 * and the community area.
 */
import { Divider, Stack, Typography } from "@mui/material";
import type { Suit } from "../../types/types";
import { GOLD_DIVIDER_SX } from "../../theme";
import { useTranslation } from "../../i18n";
import { ArcaneDialog, ArcaneDialogCloseButton } from "./ArcaneDialog";
import { CardEntry } from "./CardEntry";
import { getTarotInfo } from "../../data/getTarotInfo";

const SUITS: Suit[] = ["hearts", "clubs", "diamonds", "spades"];

interface PageInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function PageInfoModal({ open, onClose }: PageInfoModalProps) {
  const { t, language } = useTranslation();

  return (
    <ArcaneDialog
      open={open}
      onClose={onClose}
      title={t("pageInfo.title")}
      actions={<ArcaneDialogCloseButton onClick={onClose} />}
    >
      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
      >
        {t("pageInfo.cardValue")}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "white", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: t("pageInfo.cardValueDesc") }}
      />

      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />

      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
      >
        {t("pageInfo.arcanaTrigger")}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "white", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: t("pageInfo.arcanaTriggerDesc") }}
      />

      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />

      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1 }}
      >
        {t("pageInfo.challengeOfThePage")}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "white", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: t("pageInfo.challengeDesc") }}
      />

      <Divider sx={{ my: 2, ...GOLD_DIVIDER_SX }} />

      <Typography
        variant="overline"
        sx={{ color: "gold.dark", display: "block", textAlign: "center", mb: 1.5 }}
      >
        {t("pageInfo.thePages")}
      </Typography>
      <Stack direction="column" gap={1.5}>
        {SUITS.map((suit) => {
          const info = getTarotInfo({ value: "0", suit }, language);
          if (!info) return null;
          return (
            <CardEntry key={suit} card={{ value: "0", suit }} info={info} />
          );
        })}
      </Stack>
    </ArcaneDialog>
  );
}
