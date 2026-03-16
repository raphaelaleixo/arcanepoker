/**
 * Dialog content for The Star arcana interaction.
 * The hero may discard their lowest card and draw a replacement.
 */
import { Button, Stack, Typography } from "@mui/material";

interface StarDiscardContentProps {
  onDiscard: () => void;
  onKeep: () => void;
}

export function StarDiscardContent({ onDiscard, onKeep }: StarDiscardContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Discard your lowest card and draw a new one?
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" color="warning" onClick={onDiscard}>
          Discard
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
