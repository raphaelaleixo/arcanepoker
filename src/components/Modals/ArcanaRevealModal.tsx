import { Button } from "@mui/material";
import type { ArcanaCard } from "../../types/types";
import { useTranslation } from "../../i18n";
import { ArcaneDialog } from "./ArcaneDialog";
import { getTarotInfo } from "../../data/getTarotInfo";
import { CardEntry } from "./CardEntry";

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
  const { t, language } = useTranslation();

  if (!arcanaCard) return null;

  const info = getTarotInfo(arcanaCard, language);

  return (
    <ArcaneDialog
      open={open}
      title={t("table.arcanaRevealsItself")}
      actions={
        <Button variant="contained" size="small" onClick={onDismiss}>
          {t("table.acceptFate")}
        </Button>
      }
    >
      {info ? (
        <CardEntry
          card={arcanaCard}
          info={info}
          showGameEffect
          sx={{ fontSize: "1.125em", mt: 2 }}
        />
      ) : null}
    </ArcaneDialog>
  );
}
