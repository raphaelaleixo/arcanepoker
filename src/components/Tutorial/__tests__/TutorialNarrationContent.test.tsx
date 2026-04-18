import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { TranslationKey } from '../../../i18n';

const mockDismiss = vi.fn();
const mockUseTutorial = vi.fn();

vi.mock('../../../tutorial/TutorialContext', () => ({
  useTutorial: () => mockUseTutorial(),
}));

import { TutorialNarrationContent } from '../TutorialNarrationContent';
import { SettingsProvider } from '../../../store/SettingsContext';

function makeNarrationMock() {
  return {
    isTutorial: true as const,
    narration: {
      titleKey: 'tutorial.round1.holeCardsPage.title' as TranslationKey,
      bodyKey: 'tutorial.round1.holeCardsPage.body' as TranslationKey,
    },
    dismissNarration: mockDismiss,
    skipTutorial: vi.fn(),
    tutorialAllowedAction: null,
    pendingButtonHighlight: null,
    isComplete: false,
    highlightCards: null,
    currentRound: 1 as const,
  };
}

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

beforeEach(() => {
  mockUseTutorial.mockReturnValue(makeNarrationMock());
  mockDismiss.mockClear();
});

describe('TutorialNarrationContent', () => {
  it('renders the narration title and body', () => {
    const { getByText } = renderWithProviders(<TutorialNarrationContent />);
    expect(getByText(/The Page card/)).not.toBeNull();
    expect(getByText(/You've been dealt the Page of Hearts/)).not.toBeNull();
  });

  it('renders the title without a Tutorial prefix', () => {
    const { getByText, queryByText } = renderWithProviders(<TutorialNarrationContent />);
    expect(getByText(/The Page card/)).not.toBeNull();
    expect(queryByText(/Tutorial · /)).toBeNull();
  });

  it('calls dismissNarration when Next button is clicked', () => {
    const { getByText } = renderWithProviders(<TutorialNarrationContent />);
    fireEvent.click(getByText('Next →'));
    expect(mockDismiss).toHaveBeenCalledOnce();
  });

  it('renders nothing when narration is null', () => {
    mockUseTutorial.mockReturnValue({ ...makeNarrationMock(), narration: null });
    const { container } = renderWithProviders(<TutorialNarrationContent />);
    expect(container.firstChild).toBeNull();
  });
});
