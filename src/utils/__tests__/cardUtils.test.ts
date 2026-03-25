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
    expect(actionLabel('smallBlind')).toBe('Small Blind');
    expect(actionLabel('bigBlind')).toBe('Big Blind');
  });

  it('returns the raw value for unknown actions', () => {
    expect(actionLabel('unknown')).toBe('unknown');
  });
});

describe('actionColor', () => {
  it('returns error for fold', () => expect(actionColor('fold')).toBe('rgb(239, 68, 68)'));
  it('returns warning for aggressive actions', () => {
    expect(actionColor('raise')).toBe('rgb(245, 158, 11)');
    expect(actionColor('bet')).toBe('rgb(245, 158, 11)');
    expect(actionColor('all-in')).toBe('rgb(245, 158, 11)');
  });
  it('returns info for call', () => expect(actionColor('call')).toBe('rgb(34, 197, 94)'));
  it('returns success for check', () => expect(actionColor('check')).toBe('rgb(34, 197, 94)'));
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
