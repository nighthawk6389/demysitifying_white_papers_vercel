import { describe, expect, it } from 'vitest';
import { documentParserInternals } from './documentParser';

describe('documentParserInternals', () => {
  it('extracts equation-like lines while deduplicating exact matches', () => {
    const text = [
      'Intro text',
      'y = Wx + b',
      'y = Wx + b',
      `$$
L = -\\sum_i y_i log(p_i)
$$`
    ].join('\n');

    const formulas = documentParserInternals.collectFormulas(text);

    expect(formulas.map((formula) => formula.expression)).toEqual([
      'L = -\\sum_i y_i log(p_i)',
      'y = Wx + b'
    ]);
  });

  it('reconstructs text with line breaks using y positions', () => {
    const pageText = documentParserInternals.toLayoutAwarePageText([
      { str: 'y', transform: [1, 0, 0, 1, 10, 100] },
      { str: '=', transform: [1, 0, 0, 1, 20, 100] },
      { str: 'Wx', transform: [1, 0, 0, 1, 30, 100] },
      { str: '+', transform: [1, 0, 0, 1, 45, 100] },
      { str: 'b', transform: [1, 0, 0, 1, 55, 100] },
      { str: 'L', transform: [1, 0, 0, 1, 10, 90] },
      { str: '=', transform: [1, 0, 0, 1, 20, 90] },
      { str: '0', transform: [1, 0, 0, 1, 30, 90] }
    ]);

    expect(pageText).toBe('y = Wx + b\nL = 0');
  });
});
