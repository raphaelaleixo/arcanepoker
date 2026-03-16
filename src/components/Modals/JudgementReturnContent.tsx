/**
 * Dialog content for The Judgement arcana interaction.
 * A folded player may pay one big blind to rejoin the hand with new cards.
 */
import { Button, Stack, Typography } from "@mui/material";

interface JudgementReturnContentProps {
  /** Cost to rejoin, shown in the prompt text. */
  bigBlind: number;
  onRejoin: () => void;
  onSitOut: () => void;
}

export function JudgementReturnContent({
  bigBlind,
  onRejoin,
  onSitOut,
}: JudgementReturnContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Pay 1 big blind ({bigBlind} chips) to rejoin the hand with new cards?
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" color="success" onClick={onRejoin}>
          Rejoin
        </Button>
        <Button variant="outlined" color="error" onClick={onSitOut}>
          Sit Out
        </Button>
      </Stack>
    </Stack>
  );
}
