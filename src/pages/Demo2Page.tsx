// src/pages/Demo2Page.tsx
// Hidden route (/demo2) — opens the Major Arcana modal and slowly auto-scrolls
// through all 22 arcanas for recording purposes.
import { useEffect } from "react";
import { GameProvider } from "../store/GameContext";
import { ArcanaInfoModal } from "../components/Modals/ArcanaInfoModal";

// px per animation frame (≈ 60 fps → ~18 px/s)
const SCROLL_SPEED = 3;
// Wait for the dialog entrance animation to finish before scrolling.
const START_DELAY_MS = 1800;

function AutoScrollArcanaModal() {
  useEffect(() => {
    let rafId: number;

    const startTimer = setTimeout(() => {
      const el = document.querySelector(
        ".MuiDialogContent-root"
      ) as HTMLElement | null;
      if (!el) return;

      function step() {
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        if (el.scrollTop < max) {
          el.scrollTop += SCROLL_SPEED;
          rafId = requestAnimationFrame(step);
        }
      }

      rafId = requestAnimationFrame(step);
    }, START_DELAY_MS);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Always open, onClose is a no-op (demo never closes it).
  return <ArcanaInfoModal open onClose={() => {}} />;
}

export function Demo2Page() {
  return (
    // GameProvider is required because ArcanaInfoModal reads useGame() for
    // arcana deck / active-arcana status. No game is started — all 22 arcanas
    // appear as "upcoming" (full deck, no active card).
    <GameProvider>
      <AutoScrollArcanaModal />
    </GameProvider>
  );
}
