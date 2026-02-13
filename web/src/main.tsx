import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { samplePaper } from './data/samplePaper';
import { buildStepExplanation, equationSteps, type EquationStep, type ExplanationDepth } from './data/explainability';

function App() {
  const [selectedSymbolKey, setSelectedSymbolKey] = useState(samplePaper.symbols[0]?.key ?? '');
  const [selectedStep, setSelectedStep] = useState<EquationStep | null>(null);
  const [explanationDepth, setExplanationDepth] = useState<ExplanationDepth>('beginner');
  const [showLlm, setShowLlm] = useState(false);
  const [llmOutput, setLlmOutput] = useState('');

  const selectedSymbol = useMemo(() => {
    const fallbackSymbol = samplePaper.symbols[0];
    return samplePaper.symbols.find((symbol) => symbol.key === selectedSymbolKey) ?? fallbackSymbol;
  }, [selectedSymbolKey]);

  const llmPayloadPreview = useMemo(
    () => ({
      paperTitle: samplePaper.title,
      selectionType: selectedStep ? 'equation_step' : 'symbol',
      selectedSymbol: selectedSymbol?.key ?? null,
      selectedStepId: selectedStep?.id ?? null,
      equation: samplePaper.equation,
      localContext: samplePaper.contextSnippet,
      requestedDepth: explanationDepth
    }),
    [explanationDepth, selectedStep, selectedSymbol]
  );

  function runSelectionStub() {
    if (!selectedSymbol) {
      setLlmOutput('No symbol is available to explain.');
      setShowLlm(true);
      return;
    }

    setLlmOutput('Generating explanation...');
    setShowLlm(true);

    window.setTimeout(() => {
      const symbolSentence = `${selectedSymbol.key} means ${selectedSymbol.meaning.toLowerCase()}`;
      const stepSentence = selectedStep
        ? buildStepExplanation(selectedStep, explanationDepth)
        : `In this equation, ${selectedSymbol.whyItMatters.toLowerCase()}`;
      setLlmOutput(`${symbolSentence}. ${stepSentence}`);
    }, 350);
  }

  function runStepStub(step: EquationStep) {
    setSelectedStep(step);
    setLlmOutput(buildStepExplanation(step, explanationDepth));
    setShowLlm(true);
  }

  function handleSymbolClick(symbolKey: string) {
    setSelectedStep(null);
    setSelectedSymbolKey(symbolKey);
  }

  return (
    <>
      <header className="topbar">
        <h1>Demystifying White Papers</h1>
        <button className="ghost">Upload Whitepaper (soon)</button>
      </header>

      <main className="layout">
        <section className="reader">
          <h2>Interactive Reader Skeleton</h2>
          <p>{samplePaper.contextSnippet}</p>

          <article className="card">
            <h3>{samplePaper.title}</h3>
            <p className="equation">{samplePaper.equation}</p>
            <p>Click on a notation token to inspect it in context:</p>
            <div className="token-row">
              {samplePaper.symbols.map((symbol) => (
                <button key={symbol.key} className="token" onClick={() => handleSymbolClick(symbol.key)}>
                  {symbol.key}
                </button>
              ))}
            </div>

            <div className="depth-row">
              <label htmlFor="depth-select">Explanation depth</label>
              <select
                id="depth-select"
                value={explanationDepth}
                onChange={(event) => setExplanationDepth(event.target.value as ExplanationDepth)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>

            <button className="primary" onClick={runSelectionStub}>
              Explain selection (LLM hook stub)
            </button>
          </article>

          <article className="card">
            <h3>Equation decomposition</h3>
            <p>Ask for a grounded explanation of a specific reasoning step:</p>
            <ul className="step-list">
              {equationSteps.map((step) => (
                <li key={step.id} className="step-item">
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.expression}</p>
                  </div>
                  <button className="token" onClick={() => runStepStub(step)}>
                    Explain this step
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <aside className="sidebar">
          <h3>Symbol details</h3>
          {selectedSymbol ? (
            <>
              <p>
                <strong>Selected:</strong> {selectedSymbol.key}
              </p>
              <p>
                <strong>Plain meaning:</strong> {selectedSymbol.meaning}
              </p>
              <p>
                <strong>Why it matters:</strong> {selectedSymbol.whyItMatters}
              </p>
            </>
          ) : (
            <p>No symbols available in this paper.</p>
          )}

          <h3>Connected Tools (Planned)</h3>
          <ul>
            <li>Wolfram Alpha query launcher</li>
            <li>Equation simplifier</li>
            <li>Concept graph visualizer</li>
            <li>arXiv metadata + citation lookup</li>
            <li>Glossary export for saved symbols</li>
          </ul>
        </aside>
      </main>

      {showLlm && (
        <dialog open className="modal">
          <h4>LLM Explain-selection Stub</h4>
          <p className="note">Simulated request payload (M2 API contract draft):</p>
          <pre>{JSON.stringify(llmPayloadPreview, null, 2)}</pre>
          <p className="note">Simulated model output:</p>
          <p>{llmOutput}</p>
          <button onClick={() => setShowLlm(false)}>Close</button>
        </dialog>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
