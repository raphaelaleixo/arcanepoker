import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PlayerStatusBar } from '../PlayerStatusBar';

describe('PlayerStatusBar', () => {
  it('renders without crashing with minimal props', () => {
    const { container } = render(
      <PlayerStatusBar
        currentAction={null}
        currentBet={0}
        isAllIn={false}
        handResult={undefined}
        isWinner={false}
        showHandResult={false}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with an active action', () => {
    const { container } = render(
      <PlayerStatusBar
        currentAction="raise"
        currentBet={100}
        isAllIn={false}
        handResult={undefined}
        isWinner={false}
        showHandResult={false}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders at showdown with a hand result', () => {
    const { container } = render(
      <PlayerStatusBar
        currentAction={null}
        currentBet={0}
        isAllIn={false}
        handResult={{ rankName: 'two-pair' }}
        isWinner={true}
        showHandResult={true}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
