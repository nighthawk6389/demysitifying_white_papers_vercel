<<<<<<< codex/create-skeleton-for-math-visualization-web-app
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
=======
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [showNotation, setShowNotation] = useState(false);
  const [showLlm, setShowLlm] = useState(false);
>>>>>>> main

  return (
    <>
      <header className="topbar">
        <h1>Demystifying White Papers</h1>
        <button className="ghost">Upload Whitepaper (soon)</button>
      </header>

      <main className="layout">
        <section className="reader">
          <h2>Interactive Reader Skeleton</h2>
<<<<<<< codex/create-skeleton-for-math-visualization-web-app
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

=======
          <p>
            Goal: Help non-PhD readers understand notation and derivations with
            clickable explanations.
          </p>

          <article className="card">
            <h3>Sample Equation</h3>
            <p className="equation">{'\\( F = m \\cdot a \\)'}</p>
            <p>
              Click on a notation token to see beginner-friendly context:{' '}
              <button className="token" onClick={() => setShowNotation(true)}>
                m
              </button>
            </p>
            <button className="primary" onClick={() => setShowLlm(true)}>
              Explain this equation (LLM stub)
            </button>
          </article>
        </section>

        <aside className="sidebar">
>>>>>>> main
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

<<<<<<< codex/create-skeleton-for-math-visualization-web-app
      {showLlm && (
        <dialog open className="modal">
          <h4>LLM Explain-selection Stub</h4>
          <p className="note">Simulated request payload (M2 API contract draft):</p>
          <pre>{JSON.stringify(llmPayloadPreview, null, 2)}</pre>
          <p className="note">Simulated model output:</p>
          <p>{llmOutput}</p>
=======
      {showNotation && (
        <dialog open className="modal">
          <h4>Notation: m</h4>
          <p>
            <strong>Plain meaning:</strong> mass, or “how much matter is in an
            object.”
          </p>
          <p>
            <strong>Why it matters here:</strong> larger mass means more force
            required for the same acceleration.
          </p>
          <button onClick={() => setShowNotation(false)}>Close</button>
        </dialog>
      )}

      {showLlm && (
        <dialog open className="modal">
          <h4>LLM Explanation (Stub)</h4>
          <p>
            In plain language: this equation says force grows when either mass
            or acceleration grows. For the same acceleration, heavier objects
            need more force.
          </p>
          <p className="note">
            Future M1/M2 behavior: send selected equation + surrounding paper
            context to an LLM service, then return a grounded step-by-step
            explanation.
          </p>
>>>>>>> main
          <button onClick={() => setShowLlm(false)}>Close</button>
        </dialog>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
