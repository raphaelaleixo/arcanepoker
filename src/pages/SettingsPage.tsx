import { Box, Typography } from "@mui/material";
import { SettingsPanel } from "../components/SettingsPanel";
import { useTranslation } from "../i18n";
import { HEADING_FONT } from "../theme";

export function SettingsPage() {
  const { t } = useTranslation();

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
          fontFamily: HEADING_FONT,
          color: "gold.light",
          mb: 3,
        }}
      >
        {t("settings.title")}
      </Typography>

      <SettingsPanel />
    </Box>
  );
}
