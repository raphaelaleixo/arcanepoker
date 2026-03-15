import { useLayoutEffect, useRef } from "react";
import { Box } from "@mui/material";
import { useGame } from "../../store/useGame";

export function DealerChip() {
  const { state } = useGame();
  const dealer = state.players[state.dealerIndex];
  const chipRef = useRef<HTMLDivElement>(null);
  const prevPos = useRef<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!dealer || !chipRef.current) return;

    const anchor = document.querySelector<HTMLElement>(
      `[data-dealer-anchor="${dealer.id}"]`
    );
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    // Position chip at the bottom-right corner of the cards container
    const newLeft = rect.right - 9;
    const newTop = rect.bottom - 9;

    const chip = chipRef.current;

    if (prevPos.current) {
      // FLIP: instantly jump to old position via inverse transform, then
      // transition transform back to zero — this slides the chip across the table
      const dx = prevPos.current.left - newLeft;
      const dy = prevPos.current.top - newTop;
      chip.style.transition = "none";
      chip.style.transform = `translate(${dx}px, ${dy}px)`;
      chip.offsetHeight; // force reflow so the browser registers the instant jump
      chip.style.transition = "transform 450ms cubic-bezier(0.25, 0.8, 0.25, 1)";
      chip.style.transform = "translate(0, 0)";
    }

    chip.style.left = `${newLeft}px`;
    chip.style.top = `${newTop}px`;
    prevPos.current = { left: newLeft, top: newTop };
  }, [dealer?.id]);

  if (!dealer) return null;

  return (
    <Box
      ref={chipRef}
      sx={{
        position: "fixed",
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FFD700, #B8860B)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.6rem",
        fontWeight: "bold",
        color: "#000",
        border: "1px solid #B8860B",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      D
    </Box>
  );
}
