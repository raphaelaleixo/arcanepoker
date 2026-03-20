/**
 * Dialog content for The Magician arcana interaction.
 * Before showdown, the hero may discard both hole cards and draw two new ones.
 */
import { Button, Stack, Typography } from "@mui/material";

interface Props {
  onChoice: (redraw: boolean) => void;
}

export function MagicianGuessContent({ onChoice }: Props) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body2" sx={{ color: "silver.light", textAlign: "center" }}>
        Discard both hole cards and draw two new ones — or keep your current hand.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="outlined"
          onClick={() => onChoice(true)}
          sx={{ color: "gold.main", borderColor: "gold.main" }}
        >
          Redraw
        </Button>
        <Button
          variant="outlined"
          onClick={() => onChoice(false)}
          sx={{ color: "silver.light", borderColor: "silver.dark" }}
        >
          Keep Hand
        </Button>
      </Stack>
    </Stack>
  );
}
