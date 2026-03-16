import { describe, it, expect } from 'vitest';
import { stagePill, stageColor } from '../stageUtils';

describe('stagePill', () => {
  it('returns display labels for all stages', () => {
    expect(stagePill('pre-flop')).toBe('Pre-Flop');
    expect(stagePill('flop')).toBe('Flop');
    expect(stagePill('turn')).toBe('Turn');
    expect(stagePill('river')).toBe('River');
    expect(stagePill('empress')).toBe('Empress');
    expect(stagePill('showdown')).toBe('Showdown');
  });
  it('returns the raw value for unknown stages', () => {
    expect(stagePill('unknown')).toBe('unknown');
  });
});

describe('stageColor', () => {
  it('returns correct MUI chip color for each stage', () => {
    expect(stageColor('pre-flop')).toBe('info');
    expect(stageColor('flop')).toBe('primary');
    expect(stageColor('turn')).toBe('warning');
    expect(stageColor('river')).toBe('secondary');
    expect(stageColor('empress')).toBe('error');
    expect(stageColor('showdown')).toBe('success');
  });
  it('returns default for unknown stages', () => {
    expect(stageColor('unknown')).toBe('default');
  });
});
