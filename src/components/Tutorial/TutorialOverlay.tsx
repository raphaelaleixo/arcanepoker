// src/components/Tutorial/TutorialOverlay.tsx
import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

export function TutorialOverlay() {
  const tutorial = useTutorialOptional();
  const navigate = useNavigate();

  const isComplete = tutorial?.isComplete ?? false;
  useEffect(() => {
    if (isComplete) navigate("/game");
  }, [isComplete, navigate]);

  if (!tutorial) return null;
  const { narration, dismissNarration, highlightCards } = tutorial;

  // ── Narration panel ───────────────────────────────────────────────────────
  if (!narration) return null;

  return (
    <>
      {highlightCards && highlightCards.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1290,
            background: "rgba(0,0,0,0.72)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Pointer-events blocker: prevents clicking on the table while narrating */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bottom: 180,
          zIndex: 1400,
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
          zIndex: 1500,
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
