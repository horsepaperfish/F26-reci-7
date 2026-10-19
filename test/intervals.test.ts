import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// Construct integer endpoints in order so every interval has start <= end.
const interval: fc.Arbitrary<Interval> = fc.tuple(fc.integer(), fc.integer())
  .map(([a, b]): Interval => [Math.min(a, b), Math.max(a, b)]);
const intervalList = fc.array(interval);
// A small range makes shared endpoints and small gaps common.
const smallInterval: fc.Arbitrary<Interval> = fc.tuple(
  fc.integer({ min: -20, max: 20 }),
  fc.integer({ min: -20, max: 20 }),
).map(([a, b]): Interval => [Math.min(a, b), Math.max(a, b)]);
const smallIntervalList = fc.array(smallInterval, { maxLength: 20 });

describe('mergeIntervals', () => {
  // Pattern: invariant. The input array and its interval endpoints remain unchanged.
  it('does not modify the input array or its intervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = xs.map(([start, end]): Interval => [start, end]);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });

  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. Output intervals are valid, sorted, and neither overlap nor touch.
  it('returns valid intervals sorted with strict gaps', () => {
    fc.assert(
      fc.property(smallIntervalList, xs => {
        const out = mergeIntervals(xs);
        for (const [start, end] of out) {
          expect(Number.isInteger(start)).toBe(true);
          expect(Number.isInteger(end)).toBe(true);
          expect(start).toBeLessThanOrEqual(end);
        }
        for (let i = 1; i < out.length; i++) {
          expect(out[i - 1][1]).toBeLessThan(out[i][0]);
        }
      }),
    );
  });
  // Pattern: differential. Input and output cover exactly the same points, including fractional points.
  it('preserves point coverage', () => {
    const covers = (xs: readonly Interval[], p: number) =>
      xs.some(([start, end]) => start <= p && p <= end);

    fc.assert(
      fc.property(smallIntervalList, fc.integer({ min: -42, max: 42 }), (xs, twiceP) => {
        const input = xs.map(([start, end]): Interval => [start, end]);
        const out = mergeIntervals(xs);
        // Check every endpoint and a midpoint between each adjacent pair.
        // Coverage can only change at endpoints, so these also expose real-number gaps.
        const endpoints = [...new Set([...input, ...out].flat())].sort((a, b) => a - b);
        const points = [twiceP / 2, ...endpoints];
        for (let i = 1; i < endpoints.length; i++) {
          points.push((endpoints[i - 1] + endpoints[i]) / 2);
        }
        for (const p of points) {
          expect(covers(out, p)).toBe(covers(input, p));
        }
      }),
    );
  });
  // Pattern: metamorphic. Reversing the input order does not change the merged result.
  it('ignores input order', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const reversed = xs.map(([start, end]): Interval => [start, end]).reverse();
        expect(mergeIntervals(xs)).toEqual(mergeIntervals(reversed));
      }),
    );
  });
  // Pattern: algebraic. Merging an already merged result leaves it unchanged.
  it('is idempotent', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        const expected = once.map(([start, end]): Interval => [start, end]);
        expect(mergeIntervals(once)).toEqual(expected);
      }),
    );
  });
  // Pattern: conditional. Sorted intervals with strict gaps are returned unchanged.
  it('preserves already separated intervals', () => {
    const separatedIntervals = fc.tuple(
      fc.integer({ min: -20, max: 20 }),
      fc.array(fc.integer({ min: 0, max: 5 }), { maxLength: 12 }),
    ).map(([firstStart, widths]) => {
      let start = firstStart;
      return widths.map((width): Interval => {
        const end = start + width;
        const next: Interval = [start, end];
        // A gap of one still contains real points and must stay open.
        start = end + 1;
        return next;
      });
    });

    fc.assert(
      fc.property(separatedIntervals, xs => {
        const expected = xs.map(([start, end]): Interval => [start, end]);
        expect(mergeIntervals(xs)).toEqual(expected);
      }),
    );
  });
});
