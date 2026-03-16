/**
 * Raise-amount control: label row showing the current raise value and an MUI Slider.
 * Pure presentational — raiseAmount state lives in ActionBar.
 */
import { Box, Slider, Stack, Typography } from "@mui/material";

interface RaiseSliderProps {
  /** Current slider value (controlled). */
  value: number;
  minRaise: number;
  maxRaise: number;
  /** Slider step size — one big blind. */
  bigBlind: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

export function RaiseSlider({
  value,
  minRaise,
  maxRaise,
  bigBlind,
  disabled,
  onChange,
}: RaiseSliderProps) {
  return (
    <Box sx={{ px: 1, mb: 1 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "silver.light" }}>
          Raise amount
        </Typography>
        <Typography variant="caption" sx={{ color: "gold.main", fontWeight: "bold" }}>
          {value}
        </Typography>
      </Stack>
      <Slider
        value={value}
        min={minRaise}
        max={maxRaise}
        step={bigBlind}
        disabled={disabled}
        onChange={(_e, v) => onChange(v as number)}
        sx={{
          color: "gold.main",
          "& .MuiSlider-thumb": { borderColor: "gold.dark" },
        }}
      />
    </Box>
  );
}
