/**
 * A single settings toggle row: label on the left, switch on the right.
 */
import { Box, Switch, Typography } from "@mui/material";

interface SettingToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export function SettingToggle({ label, checked, onChange }: SettingToggleProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="body2" sx={{ color: "silver.light" }}>
        {label}
      </Typography>
      <Switch checked={checked} onChange={onChange} />
    </Box>
  );
}
