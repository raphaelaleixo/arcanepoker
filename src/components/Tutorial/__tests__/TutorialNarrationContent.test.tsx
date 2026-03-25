import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const mockDismiss = vi.fn();
const mockUseTutorial = vi.fn();

vi.mock('../../../tutorial/TutorialContext', () => ({
  useTutorial: () => mockUseTutorial(),
}));

import { TutorialNarrationContent } from '../TutorialNarrationContent';

function makeNarrationMock() {
  return {
    isTutorial: true as const,
    narration: { title: 'The Page Card', body: 'Lowest card in isolation.' },
    dismissNarration: mockDismiss,
    tutorialAllowedAction: null,
    isComplete: false,
    highlightCards: null,
    currentRound: 1 as const,
  };
}

beforeEach(() => {
  mockUseTutorial.mockReturnValue(makeNarrationMock());
  mockDismiss.mockClear();
});

describe('TutorialNarrationContent', () => {
  it('renders the narration title and body', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    expect(getByText(/The Page Card/)).not.toBeNull();
    expect(getByText(/Lowest card in isolation/)).not.toBeNull();
  });

  it('renders the label with title', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    expect(getByText(/Tutorial · The Page Card/)).not.toBeNull();
  });

  it('calls dismissNarration when Next button is clicked', () => {
    const { getByText } = render(<TutorialNarrationContent />);
    fireEvent.click(getByText('Next →'));
    expect(mockDismiss).toHaveBeenCalledOnce();
  });

  it('renders nothing when narration is null', () => {
    mockUseTutorial.mockReturnValue({ ...makeNarrationMock(), narration: null });
    const { container } = render(<TutorialNarrationContent />);
    expect(container.firstChild).toBeNull();
  });
});
