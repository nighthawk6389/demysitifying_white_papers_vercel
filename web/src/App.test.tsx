import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './main';
import * as parser from './data/documentParser';
import * as llm from './data/llm';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App revamped flow', () => {
  it('loads a paper from URL and lists extracted formulas', async () => {
    vi.spyOn(parser, 'parseResearchDocumentFromUrl').mockResolvedValue({
      title: 'Attention Is All You Need',
      sourceUrl: 'https://example.com/attention.pdf',
      rawText: 'The attention score is softmax(QK^T / sqrt(d_k))V.',
      contextSnippet: 'The attention score is softmax(QK^T / sqrt(d_k))V.',
      formulas: [
        {
          id: 'formula-1',
          expression: 'softmax(QK^T / sqrt(d_k))V',
          source: 'equation-line',
          start: 23,
          end: 49
        }
      ]
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText('Document URL'), {
      target: { value: 'https://example.com/attention.pdf' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Load URL' }));
    });

    expect(screen.getByRole('heading', { name: 'Attention Is All You Need' })).toBeInTheDocument();
    expect(screen.getByText(/Extracted 1 formulas/)).toBeInTheDocument();
    expect(screen.getAllByText('softmax(QK^T / sqrt(d_k))V').length).toBeGreaterThan(0);
  });

  it('opens a floating explanation dialog for a formula using llm response', async () => {
    vi.spyOn(parser, 'parseResearchDocumentFromUrl').mockResolvedValue({
      title: 'Test Paper',
      rawText: 'Model uses y = Wx + b for projection.',
      contextSnippet: 'Model uses y = Wx + b for projection.',
      formulas: [
        {
          id: 'formula-1',
          expression: 'y = Wx + b',
          source: 'equation-line',
          start: 11,
          end: 21
        }
      ]
    });
    vi.spyOn(llm, 'explainFormula').mockResolvedValue({ text: '- This is a linear projection.', source: 'llm' });

    render(<App />);

    fireEvent.change(screen.getByLabelText('Document URL'), {
      target: { value: 'https://example.com/doc' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Load URL' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Explain formula' }));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Formula explanation')).toBeInTheDocument();
    expect(screen.getByText(/LLM response/)).toBeInTheDocument();
    expect(screen.getByText(/linear projection/)).toBeInTheDocument();
  });
});
