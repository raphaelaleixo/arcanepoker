/**
 * Renders all overlay modals used by the poker table:
 * TarotModal, InteractionModal, GameOverModal, PageInfoModal,
 * ArcanaInfoModal, ArcanaRevealModal, and the dev-mode Playground.
 */
import { Button } from "@mui/material";
import type React from "react";
import type { ArcanaCard } from "../../types/types";
import type { GameAction } from "../../store/storeTypes";
import { TarotModal } from "../Modals/TarotModal";
import { InteractionModal } from "../Modals/InteractionModal";
import { GameOverModal } from "../Modals/GameOverModal";
import { PageInfoModal } from "../Modals/PageInfoModal";
import { ArcanaInfoModal } from "../Modals/ArcanaInfoModal";
import { ArcanaRevealModal } from "../Modals/ArcanaRevealModal";
import { PlaygroundDrawer } from "../Dev/PlaygroundDrawer";

interface PokerTableModalsProps {
  showTarot: boolean;
  tarotMinimized: boolean;
  onMinimizeTarot: () => void;
  onRestoreTarot: () => void;
  onCloseTarot: () => void;
  onNextHandTarot: () => void;
  pageInfoOpen: boolean;
  onClosePageInfo: () => void;
  arcanaInfoOpen: boolean;
  onCloseArcanaInfo: () => void;
  arcanaRevealCard: ArcanaCard | null;
  onDismissArcanaReveal: () => void;
  devMode: boolean;
  playgroundOpen: boolean;
  onOpenPlayground: () => void;
  onClosePlayground: () => void;
  onOpenTarotFromPlayground: () => void;
  onOpenGameOverFromPlayground: () => void;
  dispatch: React.Dispatch<GameAction>;
}

export function PokerTableModals({
  showTarot,
  tarotMinimized,
  onMinimizeTarot,
  onRestoreTarot,
  onCloseTarot,
  onNextHandTarot,
  pageInfoOpen,
  onClosePageInfo,
  arcanaInfoOpen,
  onCloseArcanaInfo,
  arcanaRevealCard,
  onDismissArcanaReveal,
  devMode,
  playgroundOpen,
  onOpenPlayground,
  onClosePlayground,
  onOpenTarotFromPlayground,
  onOpenGameOverFromPlayground,
}: PokerTableModalsProps) {
  return (
    <>
      {showTarot && (
        <TarotModal
          minimized={tarotMinimized}
          onMinimize={onMinimizeTarot}
          onRestore={onRestoreTarot}
          onClose={onCloseTarot}
          onNextHand={onNextHandTarot}
        />
      )}
      <InteractionModal />
      <GameOverModal />
      <PageInfoModal open={pageInfoOpen} onClose={onClosePageInfo} />
      <ArcanaInfoModal open={arcanaInfoOpen} onClose={onCloseArcanaInfo} />
      <ArcanaRevealModal
        open={arcanaRevealCard !== null}
        arcanaCard={arcanaRevealCard}
        onDismiss={onDismissArcanaReveal}
      />
      {devMode && (
        <>
          <Button
            size="small"
            variant="outlined"
            onClick={onOpenPlayground}
            sx={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 1200,
              minWidth: 0,
              px: 1.5,
              py: 0.5,
              fontSize: "0.7rem",
              opacity: 0.5,
              color: "secondary.light",
              borderColor: "secondary.dark",
              "&:hover": { opacity: 1 },
            }}
          >
            DEV
          </Button>
          <PlaygroundDrawer
            open={playgroundOpen}
            onClose={onClosePlayground}
            onOpenTarot={onOpenTarotFromPlayground}
            onOpenGameOver={onOpenGameOverFromPlayground}
          />
        </>
      )}
    </>
  );
}
