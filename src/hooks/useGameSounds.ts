import { useEffect, useRef } from 'react';
import { useGame } from '../store/useGame';
import { useAudioPreferences } from '../store/AudioPreferencesContext';

function playOnce(src: string): void {
  const audio = new Audio(src);
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

  useEffect(() => {
    if (!sfxEnabled) {
      // Update refs to prevent sound from firing when SFX is re-enabled for a transition
      // that already happened while it was off.
      prevStageRef.current = state.stage;
      prevCommunityLengthRef.current = state.communityCards.length;
      return;
    }

    if (state.stage === "deal" && prevStageRef.current !== "deal") {
      playOnce("/audio/card-deal.mp3");
    }

    if (state.communityCards.length > prevCommunityLengthRef.current) {
      playOnce("/audio/card-deal.mp3");
    }

    prevStageRef.current = state.stage;
    prevCommunityLengthRef.current = state.communityCards.length;
  }, [state.stage, state.communityCards.length, sfxEnabled]);
}
