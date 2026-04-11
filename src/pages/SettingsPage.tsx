import { Box, Typography } from "@mui/material";
import { SettingsPanel } from "../components/SettingsPanel";

export function SettingsPage() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 720,
        mx: "auto",
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: "Young Serif, serif",
          color: "gold.light",
          mb: 3,
        }}
      >
        Settings
      </Typography>

      <SettingsPanel />
    </Box>
  );
}
