/**
 * Dialog content for The Judgement arcana interaction.
 * A folded player may pay the current highest bet to rejoin with 2 new hole cards.
 */
import { Button, Stack, Typography } from "@mui/material";

interface JudgementReturnContentProps {
  /** Cost to rejoin (current highest bet, floored to big blind). */
  rejoinCost: number;
  onRejoin: () => void;
  onSitOut: () => void;
}

export function JudgementReturnContent({
  rejoinCost,
  onRejoin,
  onSitOut,
}: JudgementReturnContentProps) {
  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="body1" sx={{ color: "silver.light", textAlign: "center" }}>
        Pay {rejoinCost} chips (the current highest bet) to rejoin the hand with 2 new cards?
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
