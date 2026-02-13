import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './main';
import * as parser from './data/documentParser';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('App milestone flows', () => {
  it('renders sample paper and default symbol details', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Demystifying White Papers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Newtonian Dynamics Primer' })).toBeInTheDocument();
    // Equation text may be rendered by KaTeX or as raw text fallback
    expect(screen.getByText(/F\s*=\s*m/)).toBeInTheDocument();

    expect(screen.getByText('Selected:').parentElement).toHaveTextContent('Selected: F');
    expect(screen.getByText('Plain meaning:').parentElement).toHaveTextContent('Force applied to an object.');
  });

  it('uploads a document and renders parsed content', async () => {
    vi.spyOn(parser, 'parseResearchDocument').mockResolvedValue({
      title: 'Attention Is All You Need',
      rawText: 'Q = XWq, K = XWk, V = XWv',
      contextSnippet: 'Q = XWq, K = XWk, V = XWv',
      equation: 'Q = XWq',
      equations: ['Q = XWq', 'K = XWk', 'V = XWv'],
      symbols: [
        {
          key: 'Q',
          meaning: 'Query projection.',
          whyItMatters: 'Defines attention compatibility.'
        }
      ],
      segments: [
        {
          id: 'segment-1',
          title: 'Document segment 1',
          text: 'Q = XWq, K = XWk, V = XWv',
          focusPrompt: 'What mapping is introduced?'
        }
      ]
    });

    render(<App />);

    const input = screen.getByLabelText('Upload research document') as HTMLInputElement;
    const file = new File(['fake-content'], 'attention.pdf', { type: 'application/pdf' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(screen.getByRole('heading', { name: 'Attention Is All You Need' })).toBeInTheDocument();
    // Equation may be rendered by KaTeX or shown as raw text
    expect(screen.getByText(/Q\s*=\s*XWq/)).toBeInTheDocument();
    expect(screen.getByText(/Loaded attention.pdf/)).toBeInTheDocument();
  });

  it('updates symbol details when a notation token is clicked', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'm' }));

    expect(screen.getByText('Selected:').parentElement).toHaveTextContent('Selected: m');
    expect(screen.getByText('Plain meaning:').parentElement).toHaveTextContent(
      'Mass, or how much matter is in the object.'
    );
  });

  it('shows grounded payload and output for explain-selection at symbol level', () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Explain selection (LLM hook stub)' }));

    const dialog = screen.getByRole('dialog');
    const payload = within(dialog).getByText((content, node) => {
      return node?.tagName.toLowerCase() === 'pre' && content.includes('"selectionType": "symbol"');
    });

    expect(payload).toBeInTheDocument();
    expect(payload).toHaveTextContent('"selectedSymbol": "a"');
    expect(payload).toHaveTextContent('"requestedDepth": "beginner"');

    act(() => {
      vi.runAllTimers();
    });

    expect(within(dialog).getByText(/a means acceleration/)).toBeInTheDocument();
  });

  it('supports guided reading progression and knowledge checks', () => {
    render(<App />);

    expect(screen.getByText('What relationship is introduced?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next segment' }));
    expect(screen.getByText('How should we read fixed-variable statements?')).toBeInTheDocument();

    const checkCard = screen.getByText(/If mass is constant and acceleration doubles/).closest('li');
    expect(checkCard).not.toBeNull();
    fireEvent.click(within(checkCard!).getByRole('button', { name: 'Force doubles' }));
    expect(within(checkCard!).getByText(/Correct./)).toBeInTheDocument();
  });

  it('renders wolfram integration link and answers qa with confidence caveat', () => {
    render(<App />);

    const wolframLink = screen.getByRole('link', { name: 'Open in Wolfram Alpha' });
    expect(wolframLink).toHaveAttribute('href', expect.stringContaining('wolframalpha.com/input'));

    fireEvent.change(screen.getByLabelText('Ask about this passage'), {
      target: { value: 'Can this relation be nonlinear?' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask grounded assistant' }));

    expect(screen.getByText(/confidence: medium/)).toBeInTheDocument();
    expect(screen.getByText(/not a full derivation proof/)).toBeInTheDocument();
  });
});
