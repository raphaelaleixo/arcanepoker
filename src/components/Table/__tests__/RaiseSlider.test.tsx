import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RaiseSlider } from '../RaiseSlider';

describe('RaiseSlider', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <RaiseSlider
        value={20}
        minRaise={20}
        maxRaise={200}
        bigBlind={10}
        disabled={false}
        onChange={() => {}}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it('renders in disabled state', () => {
    const { container } = render(
      <RaiseSlider
        value={20}
        minRaise={20}
        maxRaise={20}
        bigBlind={10}
        disabled={true}
        onChange={() => {}}
      />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
