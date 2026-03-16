/**
 * The central area of the poker table: stage pill, community cards,
 * pot/bet display, and the active Major Arcana card.
 */
import { Box, Chip } from "@mui/material";
import type { SxProps } from "@mui/material";
import { useGame } from "../../store/useGame";
import tarot from "../../data/tarot";
import type { ArcanaCard } from "../../types/types";
import { stagePill, stageColor } from "../../utils/stageUtils";
import { CommunityCards } from "./CommunityCards";
import { PotDisplay } from "./PotDisplay";
import { ArcanaDisplay } from "./ArcanaDisplay";

interface CommunityAreaProps {
  /** Passed from PokerTable as sx={{ flex: 1 }} to fill the middle row. */
  sx?: SxProps;
}

export function CommunityArea({ sx }: CommunityAreaProps) {
  const { state } = useGame();

  const totalSlots =
    state.activeArcana?.effectKey === "empress-sixth-card" ? 6 : 5;

  const pendingArcanaCard =
    state.pendingInteraction?.type === "arcana-reveal"
      ? (state.pendingInteraction as { type: "arcana-reveal"; arcanaCard: ArcanaCard }).arcanaCard
      : null;

  const arcanaData =
    state.activeArcana != null
      ? (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[
          state.activeArcana.card.value
        ]
      : null;

  // Pre-fetch from pending card so the description box has stable dimensions before reveal.
  const displayArcanaData =
    arcanaData ??
    (pendingArcanaCard
      ? (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[
          pendingArcanaCard.value
        ]
      : null);

  const arcanaCardToShow = pendingArcanaCard ?? state.activeArcana?.card ?? null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        p: 2,
        borderRadius: 3,
        minWidth: { xs: "100%", md: 320 },
        ...sx,
      }}
    >
      <Chip
        label={stagePill(state.stage)}
        color={stageColor(state.stage)}
        size="small"
        sx={{ fontWeight: "bold", letterSpacing: "0.05em" }}
      />

      <CommunityCards
        communityCards={state.communityCards}
        totalSlots={totalSlots}
        foolCardIndex={state.foolCardIndex}
        wheelRound={state.wheelRound}
      />

      <PotDisplay
        stage={state.stage}
        potSize={state.potSize}
        currentBet={state.currentBet}
        potWon={state.potWon}
        winnerIds={state.winnerIds}
        players={state.players}
      />

      <ArcanaDisplay
        arcanaCardToShow={arcanaCardToShow}
        pendingArcanaCard={pendingArcanaCard}
        displayArcanaData={displayArcanaData}
      />
    </Box>
  );
}
