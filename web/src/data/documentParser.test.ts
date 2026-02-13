import { describe, expect, it, vi } from 'vitest';
import { parseResearchDocumentFromUrl } from './documentParser';

describe('parseResearchDocumentFromUrl', () => {
  it('extracts formula spans from equation-style lines and latex delimiters', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/plain' },
        text: async () => 'Test Paper\nWe define $y = Wx + b$ and later show z = y^2 + 1.'
      })
    );

    const parsed = await parseResearchDocumentFromUrl('https://example.com/paper.txt');

    expect(parsed.title).toContain('Test Paper');
    expect(parsed.formulas.length).toBeGreaterThan(0);
    expect(parsed.formulas.some((item) => item.expression.includes('y = Wx + b'))).toBe(true);
  });
});
