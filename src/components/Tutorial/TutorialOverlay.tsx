// src/components/Tutorial/TutorialOverlay.tsx
import { useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTutorialOptional } from "../../tutorial/TutorialContext";

/**
 * Visual-effects-only layer for the tutorial.
 * Renders the darkening backdrop when cards are highlighted.
 * Narration text is handled by TutorialNarrationContent inside ActionBar.
 */
export function TutorialOverlay() {
  const tutorial = useTutorialOptional();
  const navigate = useNavigate();

  const isComplete = tutorial?.isComplete ?? false;
  useEffect(() => {
    if (isComplete) navigate("/game");
  }, [isComplete, navigate]);

  if (!tutorial) return null;

  const { highlightCards } = tutorial;

  if (!highlightCards || highlightCards.length === 0) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1290,
        background: "rgba(0,0,0,0.72)",
        pointerEvents: "none",
      }}
    />
  );
}
