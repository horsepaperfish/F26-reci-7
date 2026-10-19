import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
const wordFrom = (letters: string) => 
  fc.array(fc.constantFrom(...letters), {minLength: 5, maxLength: 5}).map(cs => cs.join(''));
const word = wordFrom(ALPHABET);

describe('matchGuess', () => {
  // Step 2: two invariants
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Every result color is G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const color of matchGuess(secret, guess)) {
          expect(['G', 'Y', 'B']).toContain(color);
        }
      }),
    );
  });

  // Pattern: conditional. Guessing the secret makes every position green.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, (secret) => {
        expect(matchGuess(secret, secret)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: conditional. Rotating five distinct letters gives all yellows.
  it('rotating a secret with distinct letters gives all yellows', () => {
    const distinctWord = fc.shuffledSubarray([...ALPHABET], {
      minLength: 5,
      maxLength: 5,
    }).map(letters => letters.join(''));

    fc.assert(
      fc.property(distinctWord, (secret) => {
        const guess = secret.slice(1) + secret[0];
        expect(matchGuess(secret, guess)).toEqual(['Y', 'Y', 'Y', 'Y', 'Y']);
      }),
    );
  });

  // Pattern: invariant. Green and yellow credits cannot exceed secret counts.
  it('never credits a letter more times than the secret contains it', () => {
    // A small alphabet makes repeated letters common.
    const repeatedWord = wordFrom('ABC');
    fc.assert(
      fc.property(repeatedWord, repeatedWord, (secret, guess) => {
        const colors = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const available = [...secret].filter(c => c === letter).length;
          const credited = [...guess].filter((c, i) =>
            c === letter && (colors[i] === 'G' || colors[i] === 'Y'),
          ).length;
          expect(credited).toBeLessThanOrEqual(available);
        }
      }),
    );
  });
});
