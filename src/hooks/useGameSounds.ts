import { useEffect, useRef } from "react";
import { useGame } from "../store/useGame";
import { useSettings } from "../store/SettingsContext";
import { playPooled, preloadSounds } from "../utils/audioPool";

const SFX_PATHS = [
  "/audio/card-deal.mp3",
  "/audio/arcana.mp3",
  "/audio/bet.mp3",
  "/audio/round-end.mp3",
  "/audio/page.mp3",
  "/audio/fold.mp3",
  "/audio/check.mp3",
  "/audio/modal-open.mp3",
];
preloadSounds(SFX_PATHS);

export function useGameSounds(modalOpenStates?: boolean[]): void {
  const { state } = useGame();
  const { sfxEnabled } = useSettings();
  // Initialize refs to current state. Hook mounts before startGame() can set stage to "deal",
  // so this guarantees no spurious sound plays on first mount.
  const prevStageRef = useRef(state.stage);
  const prevCommunityLengthRef = useRef(state.communityCards.length);
  const prevArcanaActiveRef = useRef(state.activeArcana !== null);
  const prevArcanaGlowingRef = useRef(
    state.pendingInteraction?.type === "arcana-reveal"
  );
  const prevWheelRoundRef = useRef(state.wheelRound);
  const holeCardSeedSum = Object.values(state.holeCardChangeSeeds).reduce(
    (a, b) => a + b,
    0
  );
  const prevHoleCardSeedSumRef = useRef(holeCardSeedSum);
  const prevPotSizeRef = useRef(state.potSize);
  const prevPotWonRef = useRef(state.potWon);
  const prevPageChallengeRef = useRef(
    state.pendingInteraction?.type === "page-challenge"
  );
  const foldCount = state.players.filter((p) => p.folded).length;
  const prevFoldCountRef = useRef(foldCount);
  const prevCheckCountRef = useRef(state.checkCount);
  const prevModalStatesRef = useRef(modalOpenStates ?? []);

  const isPageChallenge = state.pendingInteraction?.type === "page-challenge";

  const isArcanaActive = state.activeArcana !== null;
  const isArcanaGlowing = state.pendingInteraction?.type === "arcana-reveal";

  useEffect(() => {
    if (!sfxEnabled) {
      // Update refs to prevent sound from firing when SFX is re-enabled for a transition
      // that already happened while it was off.
      prevStageRef.current = state.stage;
      prevCommunityLengthRef.current = state.communityCards.length;
      prevArcanaActiveRef.current = isArcanaActive;
      prevArcanaGlowingRef.current = isArcanaGlowing;
      prevWheelRoundRef.current = state.wheelRound;
      prevHoleCardSeedSumRef.current = holeCardSeedSum;
      prevPotSizeRef.current = state.potSize;
      prevPotWonRef.current = state.potWon;
      prevPageChallengeRef.current = isPageChallenge;
      prevFoldCountRef.current = foldCount;
      prevCheckCountRef.current = state.checkCount;
      prevModalStatesRef.current = modalOpenStates ?? [];
      return;
    }

    if (state.stage === "pre-flop" && prevStageRef.current !== "pre-flop") {
      // Fire one sound per player, staggered 150ms apart
      state.players.forEach((_, i) => {
        setTimeout(
          () => playPooled("/audio/card-deal.mp3", 0.1, 1.5),
          i * 150,
        );
      });
    }

    if (state.communityCards.length > prevCommunityLengthRef.current) {
      const newCards =
        state.communityCards.length - prevCommunityLengthRef.current;
      for (let i = 0; i < newCards; i++) {
        setTimeout(
          () => playPooled("/audio/card-deal.mp3", 0.1, 1.5),
          i * 150,
        );
      }
    }

    if (isArcanaGlowing && !prevArcanaGlowingRef.current) {
      playPooled("/audio/arcana.mp3", 0.5);
    }

    if (isArcanaActive && !prevArcanaActiveRef.current) {
      playPooled("/audio/card-deal.mp3", 0.1, 1.5);
    }

    // Wheel of Fortune: full redeal → one sound per player
    if (state.wheelRound > prevWheelRoundRef.current) {
      state.players.forEach((_, i) => {
        setTimeout(
          () => playPooled("/audio/card-deal.mp3", 0.1, 1.5),
          i * 150,
        );
      });
    }

    // Magician / Star / Chariot / Hanged Man: per-player hole card replacement
    if (holeCardSeedSum > prevHoleCardSeedSumRef.current) {
      const changed = holeCardSeedSum - prevHoleCardSeedSumRef.current;
      for (let i = 0; i < changed; i++) {
        setTimeout(
          () => playPooled("/audio/card-deal.mp3", 0.1, 1.5),
          i * 150,
        );
      }
    }

    prevStageRef.current = state.stage;
    prevCommunityLengthRef.current = state.communityCards.length;
    prevArcanaActiveRef.current = isArcanaActive;
    prevArcanaGlowingRef.current = isArcanaGlowing;
    if (state.potSize > prevPotSizeRef.current) {
      playPooled("/audio/bet.mp3", 0.1);
    }

    if (state.potWon > 0 && prevPotWonRef.current === 0) {
      playPooled("/audio/round-end.mp3", 0.5);
    }

    if (isPageChallenge && !prevPageChallengeRef.current) {
      playPooled("/audio/page.mp3", 0.5);
    }

    if (foldCount > prevFoldCountRef.current) {
      playPooled("/audio/fold.mp3", 0.1);
    }

    if (state.checkCount > prevCheckCountRef.current) {
      playPooled("/audio/check.mp3", 0.1, 1.5);
    }

    // Modal open / close sounds
    if (modalOpenStates) {
      const prev = prevModalStatesRef.current;
      for (let i = 0; i < modalOpenStates.length; i++) {
        if (modalOpenStates[i] && !prev[i]) {
          playPooled("/audio/modal-open.mp3", 0.5);
          break;
        }
        if (!modalOpenStates[i] && prev[i]) {
          playPooled("/audio/fold.mp3", 0.1);
          break;
        }
      }
      prevModalStatesRef.current = modalOpenStates;
    }

    prevWheelRoundRef.current = state.wheelRound;
    prevHoleCardSeedSumRef.current = holeCardSeedSum;
    prevPotSizeRef.current = state.potSize;
    prevPotWonRef.current = state.potWon;
    prevPageChallengeRef.current = isPageChallenge;
    prevFoldCountRef.current = foldCount;
    prevCheckCountRef.current = state.checkCount;
  }, [
    state.stage,
    state.communityCards.length,
    isArcanaActive,
    isArcanaGlowing,
    state.wheelRound,
    holeCardSeedSum,
    state.potSize,
    state.potWon,
    isPageChallenge,
    foldCount,
    state.checkCount,
    sfxEnabled,
    modalOpenStates,
  ]);
}
