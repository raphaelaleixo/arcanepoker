/**
 * Small chip shown in the center column when the tarot modal is minimized.
 * Clicking it restores the full modal.
 */
import { Box, Chip } from "@mui/material";
import { useTranslation } from "../../i18n";

interface TarotMinimizedChipProps {
  onClick: () => void;
}

export function TarotMinimizedChip({ onClick }: TarotMinimizedChipProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        gridRow: "2 / 4",
        gridColumn: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
      }}
    >
      <Chip
        label={t("tooltips.theCardsSpeak")}
        size="small"
        color="primary"
        onClick={onClick}
        sx={{
          fontWeight: 500,
          cursor: "pointer",
        }}
      />
    </Box>
  );
}
