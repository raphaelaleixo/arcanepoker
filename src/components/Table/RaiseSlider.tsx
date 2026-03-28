/**
 * Raise-amount control: label row showing the current raise value and an MUI Slider.
 * Pure presentational — raiseAmount state lives in ActionBar.
 */
import { Box, Slider } from "@mui/material";

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
      <Slider
        size="small"
        value={value}
        min={minRaise}
        max={maxRaise}
        step={bigBlind}
        disabled={disabled}
        valueLabelDisplay="on"
        onChange={(_e, v) => onChange(v as number)}
        sx={{
          color: "primary.main",
          "& .MuiSlider-thumb": { borderColor: "gold.dark" },
        }}
      />
    </Box>
  );
}
