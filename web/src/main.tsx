import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [showNotation, setShowNotation] = useState(false);
  const [showLlm, setShowLlm] = useState(false);

  return (
    <>
      <header className="topbar">
        <h1>Demystifying White Papers</h1>
        <button className="ghost">Upload Whitepaper (soon)</button>
      </header>

      <main className="layout">
        <section className="reader">
          <h2>Interactive Reader Skeleton</h2>
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
          <button onClick={() => setShowLlm(false)}>Close</button>
        </dialog>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
