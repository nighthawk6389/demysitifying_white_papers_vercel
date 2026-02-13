import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './main';

afterEach(() => {
  vi.useRealTimers();
});

describe('App milestone flows', () => {
  it('renders sample paper and default symbol details', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Demystifying White Papers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Newtonian Dynamics Primer' })).toBeInTheDocument();
    expect(screen.getAllByText('F = m · a').length).toBeGreaterThan(0);

    expect(screen.getByText('Selected:').parentElement).toHaveTextContent('Selected: F');
    expect(screen.getByText('Plain meaning:').parentElement).toHaveTextContent('Force applied to an object.');
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

  it('explains a decomposition step and reflects intermediate depth in payload', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Explanation depth'), {
      target: { value: 'intermediate' }
    });

    const stepItem = screen.getByText('Hold mass constant').closest('li');
    expect(stepItem).not.toBeNull();
    fireEvent.click(within(stepItem!).getByRole('button', { name: 'Explain this step' }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText(/Using F ∝ a \(for fixed m\)/)).toBeInTheDocument();
    expect(
      within(dialog).getByText((content, node) => {
        return node?.tagName.toLowerCase() === 'pre' && content.includes('"selectionType": "equation_step"');
      })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText((content, node) => {
        return node?.tagName.toLowerCase() === 'pre' && content.includes('"selectedStepId": "step-2"');
      })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText((content, node) => {
        return node?.tagName.toLowerCase() === 'pre' && content.includes('"requestedDepth": "intermediate"');
      })
    ).toBeInTheDocument();
  });
});
