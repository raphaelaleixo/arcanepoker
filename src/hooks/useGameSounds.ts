import { useEffect, useRef } from "react";
import { useGame } from "../store/useGame";
import { useAudioPreferences } from "../store/AudioPreferencesContext";

function playOnce(src: string, volume = 0.7, playbackRate = 1): void {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked — no-op
    });
  }
}

export function useGameSounds(): void {
  const { state } = useGame();
  const { sfxEnabled } = useAudioPreferences();
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
      return;
    }

    if (state.stage === "pre-flop" && prevStageRef.current !== "pre-flop") {
      // Fire one sound per player, staggered 150ms apart
      state.players.forEach((_, i) => {
        setTimeout(() => playOnce("/audio/card-deal.mp3", 0.1, 1.5), i * 150);
      });
    }

    if (state.communityCards.length > prevCommunityLengthRef.current) {
      const newCards =
        state.communityCards.length - prevCommunityLengthRef.current;
      for (let i = 0; i < newCards; i++) {
        setTimeout(() => playOnce("/audio/card-deal.mp3", 0.1, 1.5), i * 150);
      }
    }

    if (isArcanaGlowing && !prevArcanaGlowingRef.current) {
      playOnce("/audio/arcana.mp3", 0.5);
    }

    if (isArcanaActive && !prevArcanaActiveRef.current) {
      playOnce("/audio/card-deal.mp3", 0.1, 1.5);
    }

    // Wheel of Fortune: full redeal → one sound per player
    if (state.wheelRound > prevWheelRoundRef.current) {
      state.players.forEach((_, i) => {
        setTimeout(() => playOnce("/audio/card-deal.mp3", 0.1, 1.5), i * 150);
      });
    }

    // Magician / Star / Chariot / Hanged Man: per-player hole card replacement
    if (holeCardSeedSum > prevHoleCardSeedSumRef.current) {
      const changed = holeCardSeedSum - prevHoleCardSeedSumRef.current;
      for (let i = 0; i < changed; i++) {
        setTimeout(() => playOnce("/audio/card-deal.mp3", 0.1, 1.5), i * 150);
      }
    }

    prevStageRef.current = state.stage;
    prevCommunityLengthRef.current = state.communityCards.length;
    prevArcanaActiveRef.current = isArcanaActive;
    prevArcanaGlowingRef.current = isArcanaGlowing;
    if (state.potSize > prevPotSizeRef.current) {
      playOnce("/audio/bet.mp3", 0.1);
    }

    if (state.potWon > 0 && prevPotWonRef.current === 0) {
      playOnce("/audio/round-end.mp3", 0.5);
    }

    if (isPageChallenge && !prevPageChallengeRef.current) {
      playOnce("/audio/page.mp3", 0.5);
    }

    if (foldCount > prevFoldCountRef.current) {
      playOnce("/audio/fold.mp3", 0.1);
    }

    if (state.checkCount > prevCheckCountRef.current) {
      playOnce("/audio/check.mp3", 0.1, 2);
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
  ]);
}
