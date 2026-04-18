// src/components/Tutorial/TutorialNarrationContent.tsx
import { Box, Button, Typography } from "@mui/material";
import { useTutorial } from "../../tutorial/TutorialContext";
import { useTranslation } from "../../i18n";
import { HEADING_FONT } from "../../theme";

/**
 * Two-row narration panel rendered inside the ActionBar's overlayContent slot.
 * Row 1: gold label + title on left, "Next →" button on right.
 * Row 2: body text, full wrap.
 * Reads state directly from TutorialContext — only render inside TutorialProvider.
 */
export function TutorialNarrationContent() {
  const { narration, dismissNarration, skipTutorial } = useTutorial();
  const { t } = useTranslation();

  if (!narration) return null;

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      {/* Row 1: label + title + button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.5,
        }}
      >
        <Typography
          sx={{
            color: "#c9a96e",
            fontSize: "0.68rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            lineHeight: 1,
            fontWeight: "bold",
            fontFamily: HEADING_FONT,
          }}
        >
          {t(narration.titleKey)}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="text"
            size="small"
            onClick={skipTutorial}
            sx={{ opacity: 0.5, fontSize: "0.7rem" }}
          >
            {t("tutorial.skipButton")}
          </Button>
          <Button variant="text" size="small" onClick={dismissNarration}>
            {t("tutorial.nextButton")}
          </Button>
        </Box>
      </Box>

      {/* Row 2: body */}
      <Typography
        sx={{
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.75rem",
          lineHeight: 1.4,
          textWrap: "pretty",
        }}
      >
        {t(narration.bodyKey)}
      </Typography>
    </Box>
  );
}
