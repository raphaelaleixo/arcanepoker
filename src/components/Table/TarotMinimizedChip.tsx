/**
 * Small chip shown in the center column when the tarot modal is minimized.
 * Clicking it restores the full modal.
 */
import { Box, Chip } from "@mui/material";

interface TarotMinimizedChipProps {
  onClick: () => void;
}

export function TarotMinimizedChip({ onClick }: TarotMinimizedChipProps) {
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
        label="The Cards Speak"
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
