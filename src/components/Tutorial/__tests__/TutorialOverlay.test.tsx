import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TutorialOverlay } from '../TutorialOverlay';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Shared mock factory
function makeTutorialMock(overrides = {}) {
  return {
    isTutorial: true as const,
    narration: null,
    dismissNarration: vi.fn(),
    tutorialAllowedAction: null,
    pendingButtonHighlight: null,
    isComplete: false,
    highlightCards: null,
    currentRound: 1 as const,
    ...overrides,
  };
}

vi.mock('../../../tutorial/TutorialContext', () => ({
  useTutorialOptional: vi.fn(),
}));

import { useTutorialOptional } from '../../../tutorial/TutorialContext';

describe('TutorialOverlay (stripped)', () => {
  it('renders nothing when there is no tutorial context', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(null);
    const { container } = render(<TutorialOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the backdrop when highlightCards is non-empty', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(
      makeTutorialMock({
        highlightCards: [{ suit: 'hearts', value: 'A' }],
      })
    );
    const { container } = render(<TutorialOverlay />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders nothing when highlightCards is empty', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(
      makeTutorialMock({ highlightCards: [] })
    );
    const { container } = render(<TutorialOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('does NOT render a narration panel', () => {
    vi.mocked(useTutorialOptional).mockReturnValue(
      makeTutorialMock({
        narration: { title: 'Test', body: 'Should not appear' },
        highlightCards: [{ suit: 'hearts', value: 'A' }],
      })
    );
    const { queryByText } = render(<TutorialOverlay />);
    expect(queryByText('Should not appear')).toBeNull();
    expect(queryByText('Continue →')).toBeNull();
    expect(queryByText('Next →')).toBeNull();
  });
});
