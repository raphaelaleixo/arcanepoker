import { describe, it, expect } from 'vitest';
import { actionLabel, actionColor, formatHandRank } from '../cardUtils';

describe('actionLabel', () => {
  it('maps each action to a display label', () => {
    expect(actionLabel('fold')).toBe('Fold');
    expect(actionLabel('check')).toBe('Check');
    expect(actionLabel('call')).toBe('Call');
    expect(actionLabel('raise')).toBe('Raise');
    expect(actionLabel('bet')).toBe('Bet');
    expect(actionLabel('all-in')).toBe('All-In');
    expect(actionLabel('smallBlind')).toBe('SB');
    expect(actionLabel('bigBlind')).toBe('BB');
  });

  it('returns the raw value for unknown actions', () => {
    expect(actionLabel('unknown')).toBe('unknown');
  });
});

describe('actionColor', () => {
  it('returns error for fold', () => expect(actionColor('fold')).toBe('error'));
  it('returns warning for aggressive actions', () => {
    expect(actionColor('raise')).toBe('warning');
    expect(actionColor('bet')).toBe('warning');
    expect(actionColor('all-in')).toBe('warning');
  });
  it('returns info for call', () => expect(actionColor('call')).toBe('info'));
  it('returns success for check', () => expect(actionColor('check')).toBe('success'));
  it('returns default for unknown', () => expect(actionColor('unknown')).toBe('default'));
});

describe('formatHandRank', () => {
  it('converts kebab-case to Title Case', () => {
    expect(formatHandRank('two-pair')).toBe('Two Pair');
    expect(formatHandRank('royal-flush')).toBe('Royal Flush');
    expect(formatHandRank('straight-flush')).toBe('Straight Flush');
  });
  it('handles single-word ranks', () => {
    expect(formatHandRank('pair')).toBe('Pair');
    expect(formatHandRank('flush')).toBe('Flush');
  });
});
