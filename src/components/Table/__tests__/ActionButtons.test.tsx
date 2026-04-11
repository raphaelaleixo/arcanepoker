import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SettingsProvider } from '../../../store/SettingsContext';
import { ActionButtons } from '../ActionButtons';

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe('ActionButtons', () => {
  it('renders check button when canCheck is true', () => {
    const { getByText } = renderWithProviders(
      <ActionButtons
        canCheck={true}
        callExceedsStack={false}
        heroStack={500}
        toCall={0}
        isAllIn={false}
        clampedRaise={40}
        onFold={() => {}}
        onCheckOrCall={() => {}}
        onRaiseOrAllIn={() => {}}
      />
    );
    expect(getByText('Check')).not.toBeNull();
  });

  it('renders call button with amount when there is a bet to call', () => {
    const { getByText } = renderWithProviders(
      <ActionButtons
        canCheck={false}
        callExceedsStack={false}
        heroStack={500}
        toCall={50}
        isAllIn={false}
        clampedRaise={100}
        onFold={() => {}}
        onCheckOrCall={() => {}}
        onRaiseOrAllIn={() => {}}
      />
    );
    expect(getByText('Call 50')).not.toBeNull();
  });

  it('renders all-in button when callExceedsStack', () => {
    const { getByText } = renderWithProviders(
      <ActionButtons
        canCheck={false}
        callExceedsStack={true}
        heroStack={30}
        toCall={200}
        isAllIn={false}
        clampedRaise={200}
        onFold={() => {}}
        onCheckOrCall={() => {}}
        onRaiseOrAllIn={() => {}}
      />
    );
    expect(getByText('All-In 30')).not.toBeNull();
  });
});
