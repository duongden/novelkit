import { describe, it, expect } from 'vitest';
import { ABANDON_DAYS, abandonRisk, daysSinceUpdate, sameChapterTitle } from './abandon';

const NOW = new Date('2026-10-21T12:00:00Z').getTime();

describe('daysSinceUpdate', () => {
  it('counts whole days', () => {
    expect(daysSinceUpdate('2026-10-21T01:00:00Z', NOW)).toBe(0);
    expect(daysSinceUpdate('2026-10-11T13:00:00Z', NOW)).toBe(9);
    expect(daysSinceUpdate('2026-10-09T12:00:00Z', NOW)).toBe(12);
  });

  it('is null without a readable date', () => {
    expect(daysSinceUpdate(null, NOW)).toBeNull();
    expect(daysSinceUpdate('', NOW)).toBeNull();
    expect(daysSinceUpdate('not a date', NOW)).toBeNull();
  });

  it('never goes negative for a clock ahead of this machine', () => {
    expect(daysSinceUpdate('2026-10-22T12:00:00Z', NOW)).toBe(0);
  });
});

describe('abandonRisk', () => {
  it('flags stories due for a reup and the overdue ones', () => {
    expect(abandonRisk(null, 7)).toBe('unknown');
    expect(abandonRisk(0, 7)).toBe('safe');
    expect(abandonRisk(6, 7)).toBe('safe');
    expect(abandonRisk(7, 7)).toBe('soon');
    expect(abandonRisk(ABANDON_DAYS, 7)).toBe('overdue');
    expect(abandonRisk(ABANDON_DAYS + 30, 7)).toBe('overdue');
  });
});

describe('sameChapterTitle', () => {
  it('ignores spacing and case only', () => {
    expect(sameChapterTitle('Chương 1:  Khởi đầu ', 'chương 1: khởi đầu')).toBe(true);
    expect(sameChapterTitle('Chương 1: Khởi đầu', 'Chương 2: Khởi đầu')).toBe(false);
  });
});
