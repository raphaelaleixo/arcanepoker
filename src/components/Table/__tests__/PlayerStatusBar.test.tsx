import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PlayerStatusBar } from '../PlayerStatusBar';

describe('PlayerStatusBar', () => {
  it('renders without crashing with minimal props', () => {
    const { container } = render(
      <PlayerStatusBar
        currentAction={null}
        handResult={undefined}
        isWinner={false}
        showHandResult={false}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('action chip is visible when showHandResult is false', () => {
    const { getByText } = render(
      <PlayerStatusBar
        currentAction="raise"
        handResult={undefined}
        isWinner={false}
        showHandResult={false}
      />
    );
    const actionEl = getByText('raise', { exact: false });
    expect(actionEl).toBeTruthy();
    expect(actionEl.style.visibility).not.toBe('hidden');
  });

  it('action chip text is still in DOM when showHandResult is true (opacity fades via CSS)', () => {
    const { getByText } = render(
      <PlayerStatusBar
        currentAction="raise"
        handResult={undefined}
        isWinner={false}
        showHandResult={true}
      />
    );
    // Element remains in DOM (opacity 0 via CSS), not removed
    const actionEl = getByText('raise', { exact: false });
    expect(actionEl).toBeTruthy();
  });

  it('hand rank is visible at showdown', () => {
    const { getByText } = render(
      <PlayerStatusBar
        currentAction={null}
        handResult={{ rankName: 'two-pair' }}
        isWinner={true}
        showHandResult={true}
      />
    );
    const rankEl = getByText(/two pair/i);
    expect(rankEl).toBeTruthy();
    expect(rankEl.style.visibility).not.toBe('hidden');
  });
});
