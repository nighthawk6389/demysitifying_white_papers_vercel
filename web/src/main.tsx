import { useMemo, useState, type ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { samplePaper, type PaperSymbol } from './data/samplePaper';
import {
  buildStepExplanation,
  equationSteps,
  type EquationStep,
  type ExplanationDepth
} from './data/explainability';
import {
  buildWolframQuery,
  evaluateGrounding,
  knowledgeChecks,
  readingSegments,
  simplifyStepText,
  type SimplificationLevel
} from './data/interactiveTools';
import { parseResearchDocument } from './data/documentParser';

type UploadedPaper = {
  title: string;
  contextSnippet: string;
  equation: string;
  symbols: PaperSymbol[];
  segments: Array<{ id: string; title: string; text: string; focusPrompt: string }>;
};

export function App() {
  const [uploadedPaper, setUploadedPaper] = useState<UploadedPaper | null>(null);
  const [uploadStatus, setUploadStatus] = useState('No document uploaded yet.');
  const [selectedSymbolKey, setSelectedSymbolKey] = useState(samplePaper.symbols[0]?.key ?? '');
  const [selectedStep, setSelectedStep] = useState<EquationStep | null>(null);
  const [explanationDepth, setExplanationDepth] = useState<ExplanationDepth>('beginner');
  const [showLlm, setShowLlm] = useState(false);
  const [llmOutput, setLlmOutput] = useState('');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [knowledgeAnswers, setKnowledgeAnswers] = useState<Record<string, number>>({});
  const [simplificationLevel, setSimplificationLevel] = useState<SimplificationLevel>('plain');
  const [qaPrompt, setQaPrompt] = useState('');
  const [qaResponse, setQaResponse] = useState('');
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const currentPaper = uploadedPaper ?? {
    title: samplePaper.title,
    contextSnippet: samplePaper.contextSnippet,
    equation: samplePaper.equation,
    symbols: samplePaper.symbols,
    segments: readingSegments
  };

  const selectedSymbol = useMemo(() => {
    const fallbackSymbol = currentPaper.symbols[0];
    return currentPaper.symbols.find((symbol) => symbol.key === selectedSymbolKey) ?? fallbackSymbol;
  }, [currentPaper.symbols, selectedSymbolKey]);

  const llmPayloadPreview = useMemo(
    () => ({
      paperTitle: currentPaper.title,
      selectionType: selectedStep ? 'equation_step' : 'symbol',
      selectedSymbol: selectedSymbol?.key ?? null,
      selectedStepId: selectedStep?.id ?? null,
      equation: currentPaper.equation,
      localContext: currentPaper.contextSnippet,
      requestedDepth: explanationDepth
    }),
    [currentPaper, explanationDepth, selectedStep, selectedSymbol]
  );

  const activeSegment = currentPaper.segments[activeSegmentIndex] ?? currentPaper.segments[0];
  const currentStep = selectedStep ?? equationSteps[0];
  const simplificationText = simplifyStepText(currentStep.expression, simplificationLevel);
  const wolframUrl = buildWolframQuery(currentPaper.equation, selectedSymbol?.key ?? null);
  const groundingChecks = evaluateGrounding(llmOutput, currentPaper.contextSnippet);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadStatus(`Parsing ${file.name}...`);
      const parsed = await parseResearchDocument(file);
      setUploadedPaper({
        title: parsed.title,
        contextSnippet: parsed.contextSnippet,
        equation: parsed.equation,
        symbols: parsed.symbols,
        segments: parsed.segments
      });
      setSelectedSymbolKey(parsed.symbols[0]?.key ?? '');
      setActiveSegmentIndex(0);
      setUploadStatus(`Loaded ${file.name}. Parsed ${parsed.segments.length} segments and ${parsed.symbols.length} symbols.`);
    } catch (error) {
      setUploadStatus(`Failed to parse ${file.name}. ${(error as Error).message}`);
    }
  }

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

  function handleKnowledgeChoice(checkId: string, optionIndex: number) {
    setKnowledgeAnswers((previous) => ({ ...previous, [checkId]: optionIndex }));
  }

  function runQaStub() {
    const prompt = qaPrompt.trim();
    if (!prompt) {
      setQaResponse('Ask a question to get a grounded stub response.');
      return;
    }

    setQaResponse(
      `Grounded answer (confidence: medium): Based on “${currentPaper.contextSnippet}”, your question is addressed by ${currentPaper.equation}. Caveat: this is a local explanation stub and not a full derivation proof.`
    );
  }

  return (
    <>
      <header className="topbar">
        <h1>Demystifying White Papers</h1>
        <label className="ghost upload-label" htmlFor="paper-upload-input">
          Upload research document
        </label>
        <input
          id="paper-upload-input"
          type="file"
          accept=".pdf,.txt,.md,text/plain,application/pdf"
          onChange={handleFileUpload}
        />
      </header>

      <main className="layout">
        <section className="reader">
          <h2>Interactive Reader</h2>
          <p>{currentPaper.contextSnippet}</p>
          <p className="note">{uploadStatus}</p>

          <article className="card">
            <h3>{currentPaper.title}</h3>
            <p className="equation">{currentPaper.equation}</p>
            <p>Click on a notation token to inspect it in context:</p>
            <div className="token-row">
              {currentPaper.symbols.map((symbol) => (
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
            <h3>Guided reading mode</h3>
            <p>
              <strong>{activeSegment.title}</strong>
            </p>
            <p>{activeSegment.text}</p>
            <p className="note">Focus prompt: {activeSegment.focusPrompt}</p>
            <div className="token-row">
              <button
                className="token"
                onClick={() => setActiveSegmentIndex((index) => Math.max(index - 1, 0))}
                disabled={activeSegmentIndex === 0}
              >
                Previous segment
              </button>
              <button
                className="token"
                onClick={() => setActiveSegmentIndex((index) => Math.min(index + 1, currentPaper.segments.length - 1))}
                disabled={activeSegmentIndex === currentPaper.segments.length - 1}
              >
                Next segment
              </button>
            </div>
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

          <article className="card">
            <h3>Progressive simplification</h3>
            <div className="depth-row">
              <label htmlFor="simplification-select">Simplification mode</label>
              <select
                id="simplification-select"
                value={simplificationLevel}
                onChange={(event) => setSimplificationLevel(event.target.value as SimplificationLevel)}
              >
                <option value="plain">Plain language</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <p>{simplificationText}</p>
          </article>

          <article className="card">
            <h3>Knowledge checks</h3>
            <ul className="step-list">
              {knowledgeChecks.map((check) => {
                const answer = knowledgeAnswers[check.id];
                const isCorrect = answer === check.correctIndex;
                return (
                  <li key={check.id} className="step-item vertical">
                    <div>
                      <strong>{check.prompt}</strong>
                      <div className="answer-row">
                        {check.options.map((option, optionIndex) => (
                          <button key={option} className="token" onClick={() => handleKnowledgeChoice(check.id, optionIndex)}>
                            {option}
                          </button>
                        ))}
                      </div>
                      {answer !== undefined && (
                        <p className={isCorrect ? 'success' : 'warning'}>
                          {isCorrect ? 'Correct.' : 'Not quite yet.'} {check.rationale}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
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

          <h3>Integrations (M4 stubs)</h3>
          <p>
            <a href={wolframUrl} target="_blank" rel="noreferrer">
              Open in Wolfram Alpha
            </a>
          </p>
          <p className="note">Prefilled query is based on selected notation and equation context.</p>

          <h4>Q&A assistant (stub)</h4>
          <label htmlFor="qa-input">Ask about this passage</label>
          <textarea
            id="qa-input"
            value={qaPrompt}
            onChange={(event) => setQaPrompt(event.target.value)}
            placeholder="Example: Why does force scale linearly with acceleration?"
          />
          <button className="primary" onClick={runQaStub}>
            Ask grounded assistant
          </button>
          {qaResponse && <p>{qaResponse}</p>}
        </aside>
      </main>

      {showLlm && (
        <dialog open className="modal">
          <h4>LLM Explain-selection Stub</h4>
          <p className="note">Simulated request payload (M4 guardrails draft):</p>
          <pre>{JSON.stringify(llmPayloadPreview, null, 2)}</pre>
          <p className="note">Simulated model output:</p>
          <p>{llmOutput}</p>
          <p className="note">Grounding checks:</p>
          <ul>
            {groundingChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <div className="token-row">
            <button className="token" onClick={() => setFeedback('up')}>
              👍 Helpful
            </button>
            <button className="token" onClick={() => setFeedback('down')}>
              👎 Needs work
            </button>
          </div>
          {feedback && <p className="note">Feedback saved (stub): {feedback === 'up' ? 'helpful' : 'needs_work'}.</p>}
          <button onClick={() => setShowLlm(false)}>Close</button>
        </dialog>
      )}
    </>
  );
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
