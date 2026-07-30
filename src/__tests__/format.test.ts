import { dayLabel, quoteWithAttribution } from '@/src/format';

describe('quoteWithAttribution', () => {
  it('renders a quote with straight quotes so it survives plain-text destinations', () => {
    expect(quoteWithAttribution({ text: 'Keep moving', authorName: 'Albert Einstein' }))
      .toBe('"Keep moving" -- Albert Einstein');
  });
});

describe('dayLabel', () => {
  it('names today and yesterday rather than dating them', () => {
    expect(dayLabel('2026-07-29', '2026-07-29')).toBe('Today');
    expect(dayLabel('2026-07-28', '2026-07-29')).toBe('Yesterday');
  });

  it('dates anything older', () => {
    expect(dayLabel('2026-07-27', '2026-07-29')).toBe('Jul 27');
  });

  it('crosses a month boundary', () => {
    // Naive string arithmetic on the day component would call this 'Jun 30'.
    expect(dayLabel('2026-06-30', '2026-07-01')).toBe('Yesterday');
  });

  it('crosses a year boundary', () => {
    expect(dayLabel('2025-12-31', '2026-01-01')).toBe('Yesterday');
  });

  it('reads the key in local time, not UTC', () => {
    // `new Date('2026-01-01')` is midnight UTC, which renders as 'Dec 31' for
    // anyone west of Greenwich — the same trap dateKey exists to avoid.
    expect(dayLabel('2026-01-01', '2026-01-05')).toBe('Jan 1');
  });
});
