import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TutorialNarrationContent } from '../TutorialNarrationContent';

const mockDismiss = vi.fn();

vi.mock('../../../tutorial/TutorialContext', () => ({
  useTutorial: () => ({
    isTutorial: true as const,
    narration: { title: 'The Page Card', body: 'Lowest card in isolation.' },
    dismissNarration: mockDismiss,
    tutorialAllowedAction: null,
    isComplete: false,
    highlightCards: null,
    currentRound: 1 as const,
  }),
}));

describe('TutorialNarrationContent', () => {
  it('renders the narration title and body', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    expect(getByText(/The Page Card/)).not.toBeNull();
    expect(getByText(/Lowest card in isolation/)).not.toBeNull();
  });

  it('renders TUTORIAL label in uppercase', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    expect(getByText(/TUTORIAL/i)).not.toBeNull();
  });

  it('calls dismissNarration when Next button is clicked', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    fireEvent.click(getByText('Next →'));
    expect(mockDismiss).toHaveBeenCalledOnce();
  });
});
