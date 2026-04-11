/**
 * Renders the row of community cards on the poker table.
 * Handles the Fool substitution (a community card secretly replaced by the
 * Fool arcana) and the Empress sixth-card slot.
 */
import { useEffect, useRef, useState } from "react";
import { Stack } from "@mui/material";
import { keyframes } from "@mui/system";
import type { StandardCard, ArcanaCard } from "../../types/types";
import { useTutorialOptional } from "../../tutorial/TutorialContext";
import { CommunitySlot } from "./CommunitySlot";

const dealOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

interface CommunityCardsProps {
  communityCards: StandardCard[];
  /**
   * 5 normally; 6 when the Empress arcana (effectKey "empress-sixth-card") is active.
   * The 6th slot renders as an empty placeholder until the card is dealt.
   */
  totalSlots: number;
  /** True when the Empress arcana (empress-sixth-card) is active — triggers grow-in animation on the 6th slot. */
  empressActive: boolean;
  /**
   * Index of the community card secretly replaced by the Fool arcana.
   * That position renders as a Major Arcana face instead of the card's true value.
   * Null when no Fool substitution is active.
   */
  foolCardIndex: number | null;
  /**
   * Index of the community card hidden face-down by the Moon arcana.
   * Null when no card is hidden.
   */
  moonHiddenCommunityIndex: number | null;
  /**
   * Same slot as moonHiddenCommunityIndex but persists through showdown so the
   * React key stays stable when the card flips face-up, preventing a second animation.
   */
  moonAffectedIndex: number | null;
  /** React key seed — incremented each hand to replay deal animations. */
  wheelRound: number;
  /** Incremented when any community card changes mid-hand (Fool, Moon); triggers remount → dealIn animation. */
  communityChangeKey: number;
  /** Opens the Page card info modal when a Page (Ø) card is hovered. */
  onOpenPageInfo?: () => void;
}

export function CommunityCards({
  communityCards,
  totalSlots,
  empressActive,
  foolCardIndex,
  moonHiddenCommunityIndex,
  moonAffectedIndex,
  wheelRound,
  communityChangeKey,
  onOpenPageInfo,
}: CommunityCardsProps) {
  const highlights = useTutorialOptional()?.highlightCards ?? null;

  const [displayCommunityCards, setDisplayCommunityCards] =
    useState(communityCards);
  const [renderedRound, setRenderedRound] = useState(wheelRound);
  const [isExiting, setIsExiting] = useState(false);
  const prevRoundRef = useRef(wheelRound);
  const [openPageTooltipIndex, setOpenPageTooltipIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (wheelRound !== prevRoundRef.current) {
      // Round reset: animate out the old cards (still in displayCommunityCards),
      // then swap in the new state.
      setIsExiting(true);
      const t = setTimeout(() => {
        prevRoundRef.current = wheelRound;
        setRenderedRound(wheelRound);
        setDisplayCommunityCards(communityCards);
        setIsExiting(false);
      }, 300);
      return () => clearTimeout(t);
    }
    // Mid-hand update (new card dealt) — sync immediately.
    setDisplayCommunityCards(communityCards);
  }, [communityCards, wheelRound]);

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      useFlexGap
      sx={
        isExiting
          ? {
              animation: `${dealOut} 280ms ease-in both`,
              pointerEvents: "none",
            }
          : undefined
      }
    >
      {Array.from({ length: totalSlots }).map((_, i) => {
        const card = displayCommunityCards[i];
        const isHighlighted =
          highlights != null &&
          highlights.some(
            (h) => h.type === "community" && h.communityIndex === i,
          );

        // Turn/river cards are dealt individually, so each resets stagger to 0.
        const di = card && i < 3 ? i : 0;

        // Fool substitution: render this slot as The Fool arcana face.
        if (i === foolCardIndex) {
          return (
            <CommunitySlot
              key={`${renderedRound}-fool-${communityChangeKey}-${i}`}
              slotKey={`${renderedRound}-fool-${communityChangeKey}-${i}`}
              card={card}
              overrideRank={"0" as ArcanaCard["value"]}
              overrideSuit="arcana"
              flipped
              dealIndex={di}
              isHighlighted={isHighlighted}
              onOpenPageInfo={onOpenPageInfo}
              openPageTooltipIndex={openPageTooltipIndex}
              slotIndex={i}
              onSetPageTooltipIndex={setOpenPageTooltipIndex}
            />
          );
        }

        // Moon: use a stable key so the card doesn't remount when revealed.
        if (i === moonAffectedIndex) {
          const moonFaceUp = i !== moonHiddenCommunityIndex;
          return (
            <CommunitySlot
              key={`${renderedRound}-moon-${communityChangeKey}-${i}`}
              slotKey={`${renderedRound}-moon-${communityChangeKey}-${i}`}
              card={card}
              flipped={moonFaceUp}
              dealIndex={di}
              isHighlighted={isHighlighted}
              onOpenPageInfo={onOpenPageInfo}
              openPageTooltipIndex={openPageTooltipIndex}
              slotIndex={i}
              onSetPageTooltipIndex={setOpenPageTooltipIndex}
            />
          );
        }

        // Normal slot (+ Empress 6th slot grow-in).
        const isEmpressSlot = empressActive && i === 5;
        const slotKey = card ? `${renderedRound}-${i}` : String(i);
        return (
          <CommunitySlot
            key={slotKey}
            slotKey={slotKey}
            card={card}
            flipped
            dealIndex={di}
            isHighlighted={isHighlighted}
            empressGrowIn={isEmpressSlot && !card}
            onOpenPageInfo={onOpenPageInfo}
            openPageTooltipIndex={openPageTooltipIndex}
            slotIndex={i}
            onSetPageTooltipIndex={setOpenPageTooltipIndex}
          />
        );
      })}
    </Stack>
  );
}
