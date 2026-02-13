export type ParsedDocument = {
  title: string;
  rawText: string;
  contextSnippet: string;
  equation: string;
  symbols: Array<{ key: string; meaning: string; whyItMatters: string }>;
  segments: Array<{ id: string; title: string; text: string; focusPrompt: string }>;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractEquation(text: string): string {
  const match = text.match(/[A-Za-z0-9_\s]+=[^\n\.]{1,60}/);
  return normalizeWhitespace(match?.[0] ?? 'F = m · a');
}

function extractSymbols(text: string): ParsedDocument['symbols'] {
  const uniqueTokens = Array.from(new Set(text.match(/\b[A-Za-z]{1,2}\b/g) ?? []))
    .map((token) => token.toLowerCase())
    .filter((token) => !['the', 'of', 'to', 'in', 'is', 'we', 'it', 'as', 'on', 'by', 'an', 'be'].includes(token))
    .slice(0, 6);

  if (uniqueTokens.length === 0) {
    return [
      {
        key: 'F',
        meaning: 'A key variable from the uploaded passage.',
        whyItMatters: 'This symbol appears in the local derivation context and should be interpreted in-place.'
      }
    ];
  }

  return uniqueTokens.map((token) => ({
    key: token,
    meaning: `Likely notation token extracted from the uploaded document: ${token}.`,
    whyItMatters: 'Use this as a draft glossary entry and refine meaning with domain-specific context.'
  }));
}

function buildSegments(text: string): ParsedDocument['segments'] {
  const sentences = text
    .split(/(?<=[\.!?])\s+/)
    .map((entry) => normalizeWhitespace(entry))
    .filter(Boolean)
    .slice(0, 3);

  if (sentences.length === 0) {
    return [
      {
        id: 'segment-1',
        title: 'Uploaded document overview',
        text: 'No readable segments were extracted from this file.',
        focusPrompt: 'Try uploading a digital PDF or a text-based export.'
      }
    ];
  }

  return sentences.map((sentence, index) => ({
    id: `segment-${index + 1}`,
    title: `Document segment ${index + 1}`,
    text: sentence,
    focusPrompt: 'What is the claim or assumption in this segment?'
  }));
}

function deriveTitle(fileName: string, text: string): string {
  const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean);
  if (firstLine && firstLine.length < 120) {
    return firstLine;
  }
  return fileName.replace(/\.[^.]+$/, '') || 'Uploaded research paper';
}


async function readTextFile(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  const bytes = await file.arrayBuffer();
  return new TextDecoder().decode(bytes);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const bytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;

  const pageTexts: string[] = [];
  const maxPages = Math.min(doc.numPages, 5);
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(text);
  }

  return normalizeWhitespace(pageTexts.join('\n'));
}

export async function parseResearchDocument(file: File): Promise<ParsedDocument> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const rawText = isPdf ? await extractPdfText(file) : normalizeWhitespace(await readTextFile(file));

  const normalized = normalizeWhitespace(rawText);
  const contextSnippet = normalized.slice(0, 320) || 'No text could be extracted from the uploaded file.';

  return {
    title: deriveTitle(file.name, normalized),
    rawText: normalized,
    contextSnippet,
    equation: extractEquation(normalized),
    symbols: extractSymbols(normalized),
    segments: buildSegments(normalized)
  };
}
