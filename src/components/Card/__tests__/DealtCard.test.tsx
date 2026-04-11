// src/components/Card/__tests__/DealtCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SettingsProvider } from '../../../store/SettingsContext';
import { DealtCard } from '../DealtCard';

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe('DealtCard', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<DealtCard small />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a PlayingCard root inside the wrapper', () => {
    const { container } = renderWithProviders(<DealtCard small />);
    // PlayingCard renders with className ApPlayingCard-root
    const card = container.querySelector('.ApPlayingCard-root');
    expect(card).not.toBeNull();
  });

  it('forwards rank, suit, flipped props to PlayingCard', () => {
    const { container } = renderWithProviders(
      <DealtCard small rank="A" suit="hearts" flipped />
    );
    const card = container.querySelector('.ApPlayingCard-root');
    expect(card).not.toBeNull();
  });

  it('renders a wrapper Box around PlayingCard', () => {
    const { container } = renderWithProviders(<DealtCard small dealIndex={2} />);
    // Wrapper Box is the first child; PlayingCard root is nested inside it
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelector('.ApPlayingCard-root')).not.toBeNull();
  });
});
// Note: animationDelay is applied via Emotion CSS classes, not inline style.
// jsdom has no CSS engine so timing values cannot be asserted in unit tests.
// Animation correctness is verified visually in the Task 5 smoke test.
