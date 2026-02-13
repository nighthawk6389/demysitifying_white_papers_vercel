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

    expect(parsed.title).toContain('linear-notes');
    expect(parsed.equation).toContain('y = Wx + b');
    expect(parsed.symbols.length).toBeGreaterThan(0);
    expect(parsed.segments.length).toBeGreaterThan(0);
    expect(parsed.contextSnippet.length).toBeGreaterThan(0);
  });
});
