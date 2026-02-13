import { useMemo, useState, type ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { parseResearchDocument, parseResearchDocumentFromUrl, type ParsedDocument } from './data/documentParser';
import { explainFormula } from './data/llm';

type ModalState = {
  formulaId: string;
  expression: string;
  explanation: string;
  source: 'llm' | 'fallback';
} | null;

const initialDoc: ParsedDocument = {
  title: 'Paste a document URL to begin',
  rawText:
    'Enter a URL above. The app extracts full text and formulas, highlights formulas inline, and generates formula-level explanations.',
  contextSnippet: 'No document loaded yet.',
  formulas: []
};

function renderWithFormulaButtons(text: string, formulas: ParsedDocument['formulas'], onSelect: (id: string) => void) {
  if (formulas.length === 0) {
    return <p>{text}</p>;
  }

  const sorted = [...formulas].sort((a, b) => a.start - b.start);
  const nodes: Array<JSX.Element> = [];
  let cursor = 0;

  sorted.forEach((formula) => {
    const start = Math.max(formula.start, cursor);
    if (start > cursor) {
      nodes.push(
        <span key={`text-${cursor}`}>{text.slice(cursor, start)}</span>
      );
    }

    const expression = text.slice(formula.start, formula.end) || formula.expression;
    nodes.push(
      <button key={formula.id} className="formula-highlight" onClick={() => onSelect(formula.id)}>
        {expression}
      </button>
    );

    cursor = Math.max(cursor, formula.end);
  });

  if (cursor < text.length) {
    nodes.push(<span key={`tail-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return <p className="document-text">{nodes}</p>;
}

export function App() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [status, setStatus] = useState('Ready. Provide a URL to a paper, web page, or direct PDF link.');
  const [doc, setDoc] = useState<ParsedDocument>(initialDoc);
  const [modal, setModal] = useState<ModalState>(null);

  const formulaMap = useMemo(() => new Map(doc.formulas.map((formula) => [formula.id, formula])), [doc.formulas]);

  async function handleUrlLoad() {
    const url = documentUrl.trim();
    if (!url) {
      setStatus('Please enter a valid URL.');
      return;
    }

    try {
      setStatus('Fetching and extracting document text...');
      const parsed = await parseResearchDocumentFromUrl(url);
      setDoc(parsed);
      setModal(null);
      setStatus(`Loaded ${parsed.title}. Extracted ${parsed.formulas.length} formulas.`);
    } catch (error) {
      setStatus(`Could not parse URL: ${(error as Error).message}`);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus(`Parsing ${file.name}...`);
    const parsed = await parseResearchDocument(file);
    setDoc(parsed);
    setModal(null);
    setStatus(`Loaded ${file.name}. Extracted ${parsed.formulas.length} formulas.`);
  }

  async function handleFormulaClick(formulaId: string) {
    const formula = formulaMap.get(formulaId);
    if (!formula) {
      return;
    }

    setModal({ formulaId, expression: formula.expression, explanation: 'Generating explanation...', source: 'fallback' });
    const result = await explainFormula({ formula, context: doc.contextSnippet, title: doc.title });
    setModal({ formulaId, expression: formula.expression, explanation: result.text, source: result.source });
  }

  return (
    <>
      <header className="topbar">
        <h1>Demystifying White Papers</h1>
        <div className="url-row">
          <input
            aria-label="Document URL"
            value={documentUrl}
            onChange={(event) => setDocumentUrl(event.target.value)}
            placeholder="https://example.com/paper.pdf"
          />
          <button className="primary" onClick={handleUrlLoad}>Load URL</button>
          <label className="ghost upload-label" htmlFor="paper-upload-input">
            Upload fallback
          </label>
          <input id="paper-upload-input" type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" onChange={handleFileUpload} />
        </div>
      </header>

      <main className="layout single-column">
        <section className="reader card">
          <h2>{doc.title}</h2>
          <p className="note">{status}</p>
          <h3>Document text</h3>
          {renderWithFormulaButtons(doc.rawText, doc.formulas, handleFormulaClick)}
        </section>

        <aside className="sidebar card">
          <h3>Formula extraction diagnostics</h3>
          <p className="note">Extraction strategy: LaTeX delimiters + equation-line patterns + display math blocks.</p>
          <ul className="step-list">
            {doc.formulas.map((formula) => (
              <li key={formula.id} className="step-item">
                <div>
                  <strong>{formula.expression}</strong>
                  <p className="note">Type: {formula.source}</p>
                </div>
                <button className="token" onClick={() => handleFormulaClick(formula.id)}>
                  Explain formula
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      {modal && (
        <dialog open className="modal floating">
          <h4>Formula explanation</h4>
          <p className="equation">{modal.expression}</p>
          <p className="note">Source: {modal.source === 'llm' ? 'LLM response' : 'Fallback explanation'}</p>
          <pre>{modal.explanation}</pre>
          <button className="token" onClick={() => setModal(null)}>
            Close
          </button>
        </dialog>
      )}
    </>
  );
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
