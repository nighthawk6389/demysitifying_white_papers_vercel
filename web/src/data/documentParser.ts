export type FormulaSpan = {
  id: string;
  expression: string;
  source: 'latex' | 'display' | 'equation-line';
  start: number;
  end: number;
};

export type ParsedDocument = {
  title: string;
  sourceUrl?: string;
  rawText: string;
  contextSnippet: string;
  formulas: FormulaSpan[];
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function firstNonEmptyLine(text: string): string | undefined {
  return text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

function deriveTitle(text: string, sourceName: string): string {
  const line = firstNonEmptyLine(text);
  if (line && line.length < 140) {
    return line;
  }

  return sourceName.replace(/\.[^.]+$/, '') || 'Research document';
}

function collectFormulas(text: string): FormulaSpan[] {
  const formulas: FormulaSpan[] = [];

  const pushMatch = (expression: string, start: number, source: FormulaSpan['source']) => {
    const normalizedExpression = normalizeWhitespace(expression);
    if (normalizedExpression.length < 4 || normalizedExpression.length > 220) {
      return;
    }

    formulas.push({
      id: `formula-${formulas.length + 1}`,
      expression: normalizedExpression,
      source,
      start,
      end: start + expression.length
    });
  };

  for (const match of text.matchAll(/\$\$(.*?)\$\$/gs)) {
    if (match.index !== undefined) {
      pushMatch(match[1] ?? '', match.index, 'display');
    }
  }

  for (const match of text.matchAll(/\$(?!\$)([^$\n]+?)\$(?!\$)/g)) {
    if (match.index !== undefined) {
      pushMatch(match[1] ?? '', match.index, 'latex');
    }
  }

  for (const match of text.matchAll(/(?:^|\n)\s*([A-Za-z0-9_\\α-ωΑ-Ω\[\]\(\)\s+\-*/^.,]{3,220}=[^\n]{2,220})/g)) {
    if (match.index !== undefined) {
      pushMatch(match[1] ?? '', match.index, 'equation-line');
    }
  }

  const deduped = new Map<string, FormulaSpan>();
  for (const formula of formulas) {
    const key = formula.expression.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, formula);
    }
  }

  return [...deduped.values()].slice(0, 40);
}

async function readTextFile(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  const bytes = await file.arrayBuffer();
  return new TextDecoder().decode(bytes);
}

async function extractPdfTextFromBuffer(bytes: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;

  const pageTexts: string[] = [];
  const maxPages = Math.min(doc.numPages, 12);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pageTexts.push(text);
  }

  return pageTexts.join('\n');
}

async function fetchDocumentTextFromUrl(url: string): Promise<string> {
  const direct = await fetch(url);
  if (direct.ok) {
    const contentType = direct.headers.get('content-type') ?? '';
    if (contentType.includes('application/pdf')) {
      const bytes = await direct.arrayBuffer();
      return extractPdfTextFromBuffer(bytes);
    }

    return direct.text();
  }

  const cleaned = url.replace(/^https?:\/\//, '');
  const proxy = await fetch(`https://r.jina.ai/http://${cleaned}`);
  if (!proxy.ok) {
    throw new Error(`Failed to fetch URL (${direct.status}) and proxy fallback (${proxy.status}).`);
  }

  return proxy.text();
}

function toParsedDocument(rawText: string, sourceName: string, sourceUrl?: string): ParsedDocument {
  const normalized = normalizeWhitespace(rawText);

  return {
    title: deriveTitle(rawText, sourceName),
    sourceUrl,
    rawText: normalized,
    contextSnippet: normalized.slice(0, 400) || 'No readable text found in the document.',
    formulas: collectFormulas(rawText)
  };
}

export async function parseResearchDocument(file: File): Promise<ParsedDocument> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const rawText = isPdf ? await extractPdfTextFromBuffer(await file.arrayBuffer()) : await readTextFile(file);
  return toParsedDocument(rawText, file.name);
}

export async function parseResearchDocumentFromUrl(url: string): Promise<ParsedDocument> {
  const text = await fetchDocumentTextFromUrl(url);
  const sourceName = new URL(url).hostname;
  return toParsedDocument(text, sourceName, url);
}
