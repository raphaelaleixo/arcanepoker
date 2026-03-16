import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PlayerCards } from '../PlayerCards';

const ACE_HEARTS = { value: 'A' as const, suit: 'hearts' as const };
const KING_SPADES = { value: 'K' as const, suit: 'spades' as const };

describe('PlayerCards', () => {
  it('renders placeholder cards when holeCards is empty', () => {
    const { container } = render(
      <PlayerCards
        holeCards={[]}
        showFaceUp={false}
        priestessCard={null}
        playerIndex={0}
        wheelRound={1}
        dealerAnchorId="player-1"
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders hole cards when provided', () => {
    const { container } = render(
      <PlayerCards
        holeCards={[ACE_HEARTS, KING_SPADES]}
        showFaceUp={true}
        priestessCard={null}
        playerIndex={0}
        wheelRound={1}
        dealerAnchorId="player-1"
        isHero
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with a selected card without crashing', () => {
    const { container } = render(
      <PlayerCards
        holeCards={[ACE_HEARTS, KING_SPADES]}
        showFaceUp={true}
        priestessCard={null}
        playerIndex={0}
        wheelRound={1}
        dealerAnchorId="player-1"
        isHero
        selectedCard={ACE_HEARTS}
        onCardClick={() => {}}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
