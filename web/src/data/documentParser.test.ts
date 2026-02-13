import { describe, expect, it } from 'vitest';
import { parseResearchDocument } from './documentParser';

describe('parseResearchDocument', () => {
  it('parses plain text file into explainable structures', async () => {
    const text = [
      'Neural Computation Notes',
      'We define y = Wx + b as a linear mapping.',
      'If x grows while W is fixed, y scales proportionally.'
    ].join('\n');

    const file = {
      name: 'linear-notes.txt',
      type: 'text/plain',
      text: async () => text
    } as File;

    const parsed = await parseResearchDocument(file);

    expect(parsed.title).toBe('Neural Computation Notes');
    expect(parsed.equation).toContain('=');
    expect(parsed.equations.length).toBeGreaterThan(0);
    expect(parsed.equations.some((eq) => eq.includes('y') || eq.includes('W'))).toBe(true);
    expect(parsed.symbols.length).toBeGreaterThan(0);
    expect(parsed.segments.length).toBeGreaterThan(0);
    expect(parsed.contextSnippet.length).toBeGreaterThan(0);
  });

  it('extracts LaTeX-delimited equations', async () => {
    const text = [
      'Title of Paper',
      'The energy is given by $E = mc^2$ and the force by $$F = ma$$.',
      'Also consider \\(p = mv\\) for momentum.'
    ].join('\n');

    const file = {
      name: 'physics.txt',
      type: 'text/plain',
      text: async () => text
    } as File;

    const parsed = await parseResearchDocument(file);

    expect(parsed.equations.length).toBeGreaterThanOrEqual(2);
    expect(parsed.equations.some((eq) => eq.includes('E') && eq.includes('mc'))).toBe(true);
    expect(parsed.equations.some((eq) => eq.includes('F') && eq.includes('ma'))).toBe(true);
  });

  it('extracts Unicode math symbols and Greek letters', async () => {
    const text = [
      'Statistical Analysis',
      'The parameter \u03B1 controls learning rate.',
      'We observe \u03C3 \u2264 \u03BC + \u03B5 for all samples.',
      'The gradient \u2207f(x) converges.'
    ].join('\n');

    const file = {
      name: 'stats.txt',
      type: 'text/plain',
      text: async () => text
    } as File;

    const parsed = await parseResearchDocument(file);

    // Should detect Greek letters as symbols
    const symbolKeys = parsed.symbols.map((s) => s.key);
    expect(symbolKeys.some((k) => k === '\u03B1' || k === '\u03C3' || k === '\u03BC')).toBe(true);
  });

  it('provides fallback equation when no math found', async () => {
    const text = 'This is a simple text with no equations or math content at all.';

    const file = {
      name: 'plain.txt',
      type: 'text/plain',
      text: async () => text
    } as File;

    const parsed = await parseResearchDocument(file);

    expect(parsed.equation).toBe('F = m \u00B7 a');
    expect(parsed.equations).toEqual(['F = m \u00B7 a']);
  });
});
