// src/components/Tutorial/TutorialNarrationContent.tsx
import { Box, Button, Typography } from "@mui/material";
import { useTutorial } from "../../tutorial/TutorialContext";

/**
 * Two-row narration panel rendered inside the ActionBar's overlayContent slot.
 * Row 1: gold label + title on left, "Next →" button on right.
 * Row 2: body text, full wrap.
 * Reads state directly from TutorialContext — only render inside TutorialProvider.
 */
export function TutorialNarrationContent() {
  const { narration, dismissNarration } = useTutorial();

  if (!narration) return null;

  return (
    <Box
      sx={{
        width: "100%",
        border: "1px solid rgba(201,169,110,0.3)",
        borderRadius: 1,
        px: 1.25,
        py: 1,
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
          }}
        >
          Tutorial · {narration.title}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={dismissNarration}
          sx={{
            background: "#7b5ea7",
            "&:hover": { background: "#9370cc" },
            flexShrink: 0,
            fontSize: "0.7rem",
            py: 0.25,
          }}
        >
          Next →
        </Button>
      </Box>

      {/* Row 2: body */}
      <Typography
        sx={{
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.75rem",
          lineHeight: 1.4,
        }}
      >
        {narration.body}
      </Typography>
    </Box>
  );
}
