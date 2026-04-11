import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SettingsProvider } from '../../../store/SettingsContext';
import { PlayerStatusBar } from '../PlayerStatusBar';

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe('PlayerStatusBar', () => {
  it('renders without crashing with minimal props', () => {
    const { container } = renderWithProviders(
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
    const { getByText } = renderWithProviders(
      <PlayerStatusBar
        currentAction="raise"
        handResult={undefined}
        isWinner={false}
        showHandResult={false}
      />
    );
    const actionEl = getByText(/raise/i);
    expect(actionEl).toBeTruthy();
    expect(actionEl.style.visibility).not.toBe('hidden');
  });

  it('action chip text is still in DOM when showHandResult is true (opacity fades via CSS)', () => {
    const { getByText } = renderWithProviders(
      <PlayerStatusBar
        currentAction="raise"
        handResult={undefined}
        isWinner={false}
        showHandResult={true}
      />
    );
    // Element remains in DOM (opacity 0 via CSS), not removed
    const actionEl = getByText(/raise/i);
    expect(actionEl).toBeTruthy();
  });

  it('hand rank is visible at showdown', () => {
    const { getByText } = renderWithProviders(
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
