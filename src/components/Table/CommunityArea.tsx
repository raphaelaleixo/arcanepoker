/**
 * The central area of the poker table: stage pill, community cards,
 * pot/bet display, and the active Major Arcana card.
 */
import { Box } from "@mui/material";
import type { SxProps } from "@mui/material";
import { useGame } from "../../store/useGame";
import getTarotData from "../../data/tarot";
import { useTranslation } from "../../i18n";
import type { ArcanaCard } from "../../types/types";
import { CommunityCards } from "./CommunityCards";
import { PotDisplay } from "./PotDisplay";
import { ArcanaDisplay } from "./ArcanaDisplay";
import { useDemo3Optional } from "../../demo/Demo3Context";

interface CommunityAreaProps {
  /** Passed from PokerTable as sx={{ flex: 1 }} to fill the middle row. */
  sx?: SxProps;
  /** Opens the Page card info modal when a Page (Ø) card is hovered. */
  onOpenPageInfo?: () => void;
}

export function CommunityArea({ sx, onOpenPageInfo }: CommunityAreaProps) {
  const { state } = useGame();
  const { language } = useTranslation();
  const demo3 = useDemo3Optional();

  const totalSlots =
    state.activeArcana?.effectKey === "empress-sixth-card" ? 6 : 5;

  const gamePendingArcana =
    state.pendingInteraction?.type === "arcana-reveal"
      ? (
          state.pendingInteraction as {
            type: "arcana-reveal";
            arcanaCard: ArcanaCard;
          }
        ).arcanaCard
      : null;

  const pendingArcanaCard = demo3?.pendingCycleArcana ?? gamePendingArcana;

  const arcanaCardToShow =
    pendingArcanaCard ?? demo3?.displayArcana ?? state.activeArcana?.card ?? null;

  const tarotLookup = getTarotData(language).arcana as Record<
    string,
    { fullName: string; gameEffect?: string }
  >;

  const arcanaData = arcanaCardToShow
    ? tarotLookup[arcanaCardToShow.value]
    : null;

  // Pre-fetch from pending card so the description box has stable dimensions before reveal.
  const displayArcanaData = arcanaData ?? null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        borderRadius: 3,
        //minWidth: { xs: "100%", md: 320 },
        ...sx,
      }}
    >
      <ArcanaDisplay
        arcanaCardToShow={arcanaCardToShow}
        pendingArcanaCard={pendingArcanaCard}
        displayArcanaData={displayArcanaData}
      />
      <CommunityCards
        communityCards={state.communityCards}
        totalSlots={totalSlots}
        empressActive={state.activeArcana?.effectKey === "empress-sixth-card"}
        foolCardIndex={state.foolCardIndex}
        moonHiddenCommunityIndex={state.moonHiddenCommunityIndex}
        moonAffectedIndex={state.moonAffectedIndex}
        wheelRound={state.wheelRound}
        communityChangeKey={state.communityChangeKey}
        onOpenPageInfo={onOpenPageInfo}
      />

      <PotDisplay
        stage={state.stage}
        potSize={state.potSize}
        currentBet={state.currentBet}
        potWon={state.potWon}
        winnerIds={state.winnerIds}
        players={state.players}
        ruinsPot={state.ruinsPot}
      />
    </Box>
  );
}
