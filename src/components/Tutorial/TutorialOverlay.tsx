// src/components/Tutorial/TutorialOverlay.tsx
import { Box, Button, Typography } from "@mui/material";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

export function TutorialOverlay() {
  const tutorial = useTutorialOptional();

  if (!tutorial || !tutorial.narration) return null;

  const { narration, dismissNarration } = tutorial;

  return (
    <>
      {/* Pointer-events blocker: prevents clicking on the table while narrating */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bottom: 180,
          zIndex: 10,
          pointerEvents: "all",
        }}
      />

      {/* Narration panel */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 11,
          background: "rgba(10, 10, 20, 0.92)",
          borderTop: "2px solid #c9a96e",
          px: 3,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          maxHeight: 180,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(201, 169, 110, 0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "0.65rem",
          }}
        >
          Tutorial
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{ color: "#c9a96e", fontWeight: 600, lineHeight: 1.2 }}
        >
          {narration.title}
        </Typography>

        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
          {narration.body}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            onClick={dismissNarration}
            sx={{ background: "#7b5ea7", "&:hover": { background: "#9370cc" } }}
          >
            Continue →
          </Button>
        </Box>
      </Box>
    </>
  );
}
