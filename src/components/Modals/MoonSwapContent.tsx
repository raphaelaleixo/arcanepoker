/**
 * Dialog content for The Moon arcana interaction.
 * The hero may swap one hole card for a 3rd card dealt to them.
 */
import { Button, Stack, Typography } from "@mui/material";

interface MoonSwapContentProps {
  onSwap: () => void;
  onKeep: () => void;
}

export function MoonSwapContent({ onSwap, onKeep }: MoonSwapContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Swap one of your hole cards for a 3rd card dealt to you?
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" color="secondary" onClick={onSwap}>
          Swap
        </Button>
        <Button
          variant="outlined"
          onClick={onKeep}
          sx={{ color: "silver.light", borderColor: "silver.dark" }}
        >
          Keep
        </Button>
      </Stack>
    </Stack>
  );
}
