export type ParsedDocument = {
  title: string;
  rawText: string;
  contextSnippet: string;
  /** Primary equation (first found, backward compatible) */
  equation: string;
  /** All extracted equations / formulas */
  equations: string[];
  symbols: Array<{ key: string; meaning: string; whyItMatters: string }>;
  segments: Array<{ id: string; title: string; text: string; focusPrompt: string }>;
};

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Deduplicate equations while preserving order */
function uniqueEquations(equations: string[]): string[] {
  const seen = new Set<string>();
  return equations.filter((eq) => {
    const key = eq.replace(/\s+/g, '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Math-related character / pattern definitions                       */
/* ------------------------------------------------------------------ */

/** Unicode ranges for mathematical symbols, operators, Greek letters */
const MATH_UNICODE_RE =
  /[\u0391-\u03C9\u2200-\u22FF\u2190-\u21FF\u2A00-\u2AFF\u00B1\u00D7\u00F7\u2260\u2264\u2265\u221A\u221E\u222B\u2211\u220F\u2202\u2207\u2208\u2209\u2282\u2283\u2286\u2287\u2229\u222A\u00B2\u00B3\u207F\u2070-\u209F]/;

/** Regex that detects a "run" of text likely to be an equation.
 *  Looks for sequences containing math operators/symbols near letters/digits. */
const MATH_RUN_RE =
  /(?:[A-Za-z0-9_]+\s*[=<>≤≥≠≈∝±×÷→←⇒⇔∈∉⊂⊃∀∃]\s*[A-Za-z0-9_().^{}+\-*/·∙⋅]+)/;

/** Common LaTeX-style delimiters */
const LATEX_INLINE_RE = /\$([^$]+)\$/g;
const LATEX_DISPLAY_RE = /\$\$([^$]+)\$\$/g;
const LATEX_PAREN_RE = /\\\((.+?)\\\)/g;
const LATEX_BRACKET_RE = /\\\[(.+?)\\\]/g;

/** LaTeX command names for known math symbols (maps command -> display name) */
const LATEX_SYMBOL_MAP: Record<string, string> = {
  '\\alpha': '\u03B1', '\\beta': '\u03B2', '\\gamma': '\u03B3', '\\delta': '\u03B4',
  '\\epsilon': '\u03B5', '\\zeta': '\u03B6', '\\eta': '\u03B7', '\\theta': '\u03B8',
  '\\iota': '\u03B9', '\\kappa': '\u03BA', '\\lambda': '\u03BB', '\\mu': '\u03BC',
  '\\nu': '\u03BD', '\\xi': '\u03BE', '\\pi': '\u03C0', '\\rho': '\u03C1',
  '\\sigma': '\u03C3', '\\tau': '\u03C4', '\\phi': '\u03C6', '\\chi': '\u03C7',
  '\\psi': '\u03C8', '\\omega': '\u03C9',
  '\\Alpha': '\u0391', '\\Beta': '\u0392', '\\Gamma': '\u0393', '\\Delta': '\u0394',
  '\\Theta': '\u0398', '\\Lambda': '\u039B', '\\Pi': '\u03A0', '\\Sigma': '\u03A3',
  '\\Phi': '\u03A6', '\\Psi': '\u03A8', '\\Omega': '\u03A9',
  '\\nabla': '\u2207', '\\partial': '\u2202', '\\infty': '\u221E',
  '\\sum': '\u2211', '\\prod': '\u220F', '\\int': '\u222B',
  '\\sqrt': '\u221A', '\\pm': '\u00B1', '\\times': '\u00D7', '\\div': '\u00F7',
  '\\leq': '\u2264', '\\geq': '\u2265', '\\neq': '\u2260', '\\approx': '\u2248',
  '\\propto': '\u221D', '\\in': '\u2208', '\\notin': '\u2209',
  '\\subset': '\u2282', '\\supset': '\u2283', '\\cup': '\u222A', '\\cap': '\u2229',
  '\\forall': '\u2200', '\\exists': '\u2203',
  '\\rightarrow': '\u2192', '\\leftarrow': '\u2190', '\\Rightarrow': '\u21D2',
  '\\Leftrightarrow': '\u21D4', '\\cdot': '\u00B7',
};

/** Known math font name fragments used in PDFs (Computer Modern, etc.) */
const MATH_FONT_PATTERNS = [
  'CMMI', 'CMSY', 'CMEX', 'CMBX', // Computer Modern
  'Math', 'Symbol', 'Italic',      // Common math font keywords
  'MTMI', 'MTSY',                   // MathTime
  'STIX', 'Cambria Math',           // STIX & Microsoft Math
  'MathJax',                         // Web-rendered PDFs
];

/** Unicode Greek letter detection */
const GREEK_RE = /[\u0391-\u03C9]/g;

/** Map of Unicode Greek letters to their names */
const GREEK_NAMES: Record<string, string> = {
  '\u03B1': 'alpha', '\u03B2': 'beta', '\u03B3': 'gamma', '\u03B4': 'delta',
  '\u03B5': 'epsilon', '\u03B6': 'zeta', '\u03B7': 'eta', '\u03B8': 'theta',
  '\u03B9': 'iota', '\u03BA': 'kappa', '\u03BB': 'lambda', '\u03BC': 'mu',
  '\u03BD': 'nu', '\u03BE': 'xi', '\u03C0': 'pi', '\u03C1': 'rho',
  '\u03C3': 'sigma', '\u03C4': 'tau', '\u03C6': 'phi', '\u03C7': 'chi',
  '\u03C8': 'psi', '\u03C9': 'omega',
  '\u0391': 'Alpha', '\u0392': 'Beta', '\u0393': 'Gamma', '\u0394': 'Delta',
  '\u0398': 'Theta', '\u039B': 'Lambda', '\u03A0': 'Pi', '\u03A3': 'Sigma',
  '\u03A6': 'Phi', '\u03A8': 'Psi', '\u03A9': 'Omega',
};

/** Common meanings for single-letter math variables */
const VARIABLE_MEANINGS: Record<string, string> = {
  x: 'Independent variable or spatial coordinate',
  y: 'Dependent variable or spatial coordinate',
  z: 'Third spatial coordinate or complex variable',
  t: 'Time variable',
  n: 'Integer count or sample size',
  i: 'Index variable or imaginary unit',
  j: 'Index variable or imaginary unit',
  k: 'Index variable or constant',
  f: 'Function',
  g: 'Function or gravitational acceleration',
  p: 'Probability or momentum',
  q: 'Charge or generalized coordinate',
  r: 'Radius or distance',
  v: 'Velocity',
  a: 'Acceleration',
  F: 'Force',
  E: 'Energy or expectation',
  P: 'Probability or pressure',
  T: 'Temperature or period',
  V: 'Volume or potential',
  W: 'Work or weight',
  H: 'Hamiltonian or enthalpy',
  L: 'Length or Lagrangian',
  S: 'Entropy or action',
  R: 'Resistance or radius',
  C: 'Capacitance or constant',
  I: 'Current or moment of inertia',
  M: 'Mass or moment',
  N: 'Number or normal force',
};

const GREEK_MEANINGS: Record<string, string> = {
  alpha: 'Learning rate, significance level, or angle',
  beta: 'Coefficient, exponent, or inverse temperature',
  gamma: 'Discount factor, Lorentz factor, or Euler-Mascheroni constant',
  delta: 'Change in a quantity or Dirac delta function',
  epsilon: 'Small positive quantity or error term',
  zeta: 'Riemann zeta function argument',
  eta: 'Learning rate or efficiency',
  theta: 'Angle parameter or model parameter',
  lambda: 'Eigenvalue, wavelength, or rate parameter',
  mu: 'Mean, coefficient of friction, or chemical potential',
  nu: 'Frequency or degrees of freedom',
  xi: 'Random variable or damping ratio',
  pi: 'Ratio of circumference to diameter (3.14159...)',
  rho: 'Density or correlation coefficient',
  sigma: 'Standard deviation or summation',
  tau: 'Time constant or torque',
  phi: 'Angle, phase, or golden ratio',
  chi: 'Chi-squared test statistic',
  psi: 'Wave function or angle',
  omega: 'Angular frequency or sample space',
  Gamma: 'Gamma function',
  Delta: 'Finite difference or discriminant',
  Theta: 'Big-Theta notation (computational complexity)',
  Lambda: 'Diagonal eigenvalue matrix or cosmological constant',
  Pi: 'Product operator',
  Sigma: 'Summation operator or covariance matrix',
  Phi: 'Cumulative distribution function or flux',
  Psi: 'Wave function',
  Omega: 'Sample space or ohm',
};

/* ------------------------------------------------------------------ */
/*  Equation extraction strategies                                     */
/* ------------------------------------------------------------------ */

/** Strategy 1: Extract LaTeX-delimited equations */
function extractLatexDelimited(text: string): string[] {
  const results: string[] = [];

  // Display math first ($$...$$) - must be checked before inline ($...$)
  let match: RegExpExecArray | null;
  const displayRe = new RegExp(LATEX_DISPLAY_RE.source, 'g');
  while ((match = displayRe.exec(text)) !== null) {
    const inner = match[1].trim();
    if (inner.length > 1) results.push(inner);
  }

  // \[...\] display math
  const bracketRe = new RegExp(LATEX_BRACKET_RE.source, 'g');
  while ((match = bracketRe.exec(text)) !== null) {
    const inner = match[1].trim();
    if (inner.length > 1) results.push(inner);
  }

  // Inline math ($...$)
  const inlineRe = new RegExp(LATEX_INLINE_RE.source, 'g');
  while ((match = inlineRe.exec(text)) !== null) {
    const inner = match[1].trim();
    // Filter out currency-like patterns: $5, $100, etc.
    if (inner.length > 1 && !/^\d+([.,]\d+)?$/.test(inner)) {
      results.push(inner);
    }
  }

  // \(...\) inline math
  const parenRe = new RegExp(LATEX_PAREN_RE.source, 'g');
  while ((match = parenRe.exec(text)) !== null) {
    const inner = match[1].trim();
    if (inner.length > 1) results.push(inner);
  }

  return results;
}

/** Strategy 2: Extract equations containing mathematical operators */
function extractOperatorEquations(text: string): string[] {
  const results: string[] = [];

  // Equations with = sign (improved pattern)
  // Matches patterns like "E = mc^2", "F = m * a", "y = f(x)", "P(A|B) = ..."
  const equalsRe =
    /(?:^|(?<=\s))([A-Za-z\u0391-\u03C9_][A-Za-z0-9\u0391-\u03C9_()|\s]{0,30})\s*=\s*([A-Za-z0-9\u0391-\u03C9_.^{}()+\-*/·∙⋅×÷√∫∑∏∂∇±≈∝\s]{1,80})/gm;
  let match: RegExpExecArray | null;
  while ((match = equalsRe.exec(text)) !== null) {
    const full = match[0].trim();
    // Filter out common English patterns like "that is", "there is"
    if (
      full.length >= 3 &&
      !/^(it|he|she|this|that|there|here|what|which|who|how)\s*=/i.test(full) &&
      // Must contain at least one letter or math symbol on both sides of =
      /[A-Za-z\u0391-\u03C9]/.test(match[1]) &&
      /[A-Za-z0-9\u0391-\u03C9(^]/.test(match[2])
    ) {
      results.push(full);
    }
  }

  // Inequalities and relational equations
  const relRe =
    /(?:^|(?<=\s))([A-Za-z\u0391-\u03C9_][A-Za-z0-9\u0391-\u03C9_()|\s]{0,20})\s*[<>≤≥≠≈∝]\s*([A-Za-z0-9\u0391-\u03C9_.^{}()+\-*/·\s]{1,60})/gm;
  while ((match = relRe.exec(text)) !== null) {
    const full = match[0].trim();
    if (full.length >= 3) {
      results.push(full);
    }
  }

  return results;
}

/** Strategy 3: Detect runs of text with heavy Unicode math content */
function extractUnicodeMathRuns(text: string): string[] {
  const results: string[] = [];
  const lines = text.split(/\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 200) continue;

    // Count math-like characters
    const mathChars = (trimmed.match(MATH_UNICODE_RE) || []).length;
    const totalChars = trimmed.replace(/\s/g, '').length;

    // If more than 20% of the non-space characters are mathematical symbols
    // or the line contains >= 3 math symbols, consider it an equation
    if (totalChars > 0 && (mathChars / totalChars > 0.2 || mathChars >= 3)) {
      // Additional check: should also contain some alphanumeric characters
      if (/[A-Za-z0-9]/.test(trimmed)) {
        results.push(trimmed);
      }
    }
  }

  return results;
}

/** Strategy 4: Detect common equation patterns from PDF text */
function extractCommonPatterns(text: string): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;

  // Function notation: f(x), g(x,y), P(A|B), etc.
  const funcRe = /([A-Za-z]\([A-Za-z0-9,|; ]+\)\s*=\s*[^\n.]{2,60})/g;
  while ((match = funcRe.exec(text)) !== null) {
    results.push(match[1].trim());
  }

  // Summation/integral patterns in text: "sum from", "integral of", etc.
  const sumIntRe =
    /((?:sum|∑|Σ|integral|∫|product|∏|lim)\s*(?:from|of|over)?\s*[A-Za-z0-9\u0391-\u03C9_=\s+\-*/^(){}]{2,80})/gi;
  while ((match = sumIntRe.exec(text)) !== null) {
    results.push(match[1].trim());
  }

  // Fraction-like patterns: a/b, dx/dt, etc. (only near other math indicators)
  const fracRe = /\b(d[A-Za-z]\s*\/\s*d[A-Za-z][^\n.]{0,40})/g;
  while ((match = fracRe.exec(text)) !== null) {
    results.push(match[1].trim());
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Main equation extraction pipeline                                  */
/* ------------------------------------------------------------------ */

function extractEquations(text: string): string[] {
  const allEquations: string[] = [];

  // Apply all strategies
  allEquations.push(...extractLatexDelimited(text));
  allEquations.push(...extractOperatorEquations(text));
  allEquations.push(...extractUnicodeMathRuns(text));
  allEquations.push(...extractCommonPatterns(text));

  // Deduplicate and clean
  const cleaned = allEquations
    .map((eq) => normalizeWhitespace(eq))
    .filter((eq) => eq.length >= 3 && eq.length <= 200);

  return uniqueEquations(cleaned);
}

/** Backward-compatible single equation extraction */
function extractEquation(text: string): string {
  const equations = extractEquations(text);
  return equations[0] ?? 'F = m \u00B7 a';
}

/* ------------------------------------------------------------------ */
/*  Symbol extraction (overhauled)                                     */
/* ------------------------------------------------------------------ */

/** Expanded stopword list to filter out common English words */
const STOPWORDS = new Set([
  'the', 'of', 'to', 'in', 'is', 'we', 'it', 'as', 'on', 'by', 'an', 'be',
  'or', 'if', 'at', 'do', 'no', 'so', 'up', 'he', 'me', 'my', 'am', 'us',
  'go', 'vs', 'ok', 'oh', 'hi', 'ha', 'and', 'the', 'for', 'are', 'but',
  'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out',
  'has', 'its', 'let', 'say', 'she', 'too', 'use', 'way', 'who', 'may',
  'did', 'get', 'how', 'him', 'his', 'new', 'now', 'old', 'see', 'two',
  'any', 'few', 'per', 'set', 'top', 'end', 'far', 'own', 'run', 'put',
  'did', 'also', 'than', 'them', 'then', 'when', 'what', 'this', 'that',
  'with', 'from', 'have', 'been', 'will', 'each', 'make', 'like', 'into',
  'some', 'such', 'more', 'over', 'very', 'just', 'only', 'much', 'most',
  'here', 'both', 'well', 'back', 'same', 'even', 'give', 'many', 'they',
  'were', 'which', 'their', 'about', 'would', 'these', 'other', 'could',
  'after', 'where', 'those', 'there', 'should', 'because', 'through',
  'between', 'under', 'above', 'while', 'during', 'before', 'paper',
  'section', 'figure', 'table', 'equation', 'chapter', 'result', 'method',
]);

function extractSymbols(text: string, equations: string[]): ParsedDocument['symbols'] {
  const symbolMap = new Map<string, { meaning: string; whyItMatters: string }>();

  // 1. Extract LaTeX commands (e.g., \alpha, \nabla)
  const latexCmdRe = /\\([a-zA-Z]+)/g;
  let match: RegExpExecArray | null;
  while ((match = latexCmdRe.exec(text)) !== null) {
    const cmd = `\\${match[1]}`;
    if (cmd in LATEX_SYMBOL_MAP) {
      const displayChar = LATEX_SYMBOL_MAP[cmd];
      const name = match[1].toLowerCase();
      const meaning = GREEK_MEANINGS[name] ?? `Mathematical symbol (${name})`;
      symbolMap.set(displayChar, {
        meaning,
        whyItMatters: `Appears in the notation as ${cmd}; used in mathematical expressions in this document.`,
      });
    }
  }

  // 2. Extract Unicode Greek letters
  const greekMatches = text.match(GREEK_RE) ?? [];
  for (const char of greekMatches) {
    if (symbolMap.has(char)) continue;
    const name = GREEK_NAMES[char] ?? 'Greek letter';
    const meaning = GREEK_MEANINGS[name.toLowerCase()] ?? GREEK_MEANINGS[name] ?? `Greek letter (${name})`;
    symbolMap.set(char, {
      meaning,
      whyItMatters: `This Greek letter appears in the mathematical content and likely represents a key quantity or parameter.`,
    });
  }

  // 3. Extract single-letter variables that appear near math context
  // Combine equation text for context
  const mathContext = equations.join(' ');
  const allMathText = mathContext + ' ' + text;

  // Find single uppercase letters that appear in equations
  const singleVarRe = /\b([A-Z])\b/g;
  while ((match = singleVarRe.exec(mathContext)) !== null) {
    const letter = match[1];
    if (symbolMap.has(letter)) continue;
    if (STOPWORDS.has(letter.toLowerCase())) continue;
    const meaning = VARIABLE_MEANINGS[letter] ?? `Variable or constant used in this document`;
    symbolMap.set(letter, {
      meaning,
      whyItMatters: `This symbol appears in extracted equations and likely represents a physical quantity or mathematical variable.`,
    });
  }

  // Find single lowercase letters in equations (only near operators)
  const lowerVarRe = /(?<=[=+\-*/^(,\s])([a-z])(?=[=+\-*/^),\s])/g;
  while ((match = lowerVarRe.exec(mathContext)) !== null) {
    const letter = match[1];
    if (symbolMap.has(letter)) continue;
    if (STOPWORDS.has(letter)) continue;
    const meaning = VARIABLE_MEANINGS[letter] ?? `Variable used in mathematical expressions`;
    symbolMap.set(letter, {
      meaning,
      whyItMatters: `This variable appears within equations extracted from this document.`,
    });
  }

  // 4. Extract Unicode math operators that appear in the text
  const mathOps: Array<{ char: string; name: string; meaning: string }> = [
    { char: '\u2211', name: '\u2211 (Summation)', meaning: 'Sum over a range of values' },
    { char: '\u220F', name: '\u220F (Product)', meaning: 'Product over a range of values' },
    { char: '\u222B', name: '\u222B (Integral)', meaning: 'Integration operator' },
    { char: '\u2202', name: '\u2202 (Partial)', meaning: 'Partial derivative' },
    { char: '\u2207', name: '\u2207 (Nabla)', meaning: 'Gradient, divergence, or curl operator' },
    { char: '\u221E', name: '\u221E (Infinity)', meaning: 'Unbounded limit' },
    { char: '\u221A', name: '\u221A (Square root)', meaning: 'Square root function' },
  ];

  for (const op of mathOps) {
    if (allMathText.includes(op.char) && !symbolMap.has(op.name)) {
      symbolMap.set(op.name, {
        meaning: op.meaning,
        whyItMatters: 'This mathematical operator appears in the extracted content.',
      });
    }
  }

  // Convert to array and limit results
  const symbols = Array.from(symbolMap.entries())
    .slice(0, 12)
    .map(([key, value]) => ({
      key,
      meaning: value.meaning,
      whyItMatters: value.whyItMatters,
    }));

  // Fallback
  if (symbols.length === 0) {
    return [
      {
        key: 'F',
        meaning: 'A key variable from the uploaded passage.',
        whyItMatters: 'This symbol appears in the local derivation context and should be interpreted in-place.',
      },
    ];
  }

  return symbols;
}

/* ------------------------------------------------------------------ */
/*  Segment building (improved: preserve line structure)               */
/* ------------------------------------------------------------------ */

function buildSegments(text: string): ParsedDocument['segments'] {
  // Split on sentence-ending punctuation, but preserve paragraph breaks
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((entry) => normalizeWhitespace(entry))
    .filter((s) => s.length > 10) // Filter out very short fragments
    .slice(0, 5); // Up to 5 segments for richer content

  if (sentences.length === 0) {
    return [
      {
        id: 'segment-1',
        title: 'Uploaded document overview',
        text: 'No readable segments were extracted from this file.',
        focusPrompt: 'Try uploading a digital PDF or a text-based export.',
      },
    ];
  }

  return sentences.map((sentence, index) => ({
    id: `segment-${index + 1}`,
    title: `Document segment ${index + 1}`,
    text: sentence,
    focusPrompt: 'What is the claim or assumption in this segment?',
  }));
}

/* ------------------------------------------------------------------ */
/*  Title derivation                                                   */
/* ------------------------------------------------------------------ */

function deriveTitle(fileName: string, text: string): string {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  if (firstLine && firstLine.length < 120) {
    return firstLine;
  }
  return fileName.replace(/\.[^.]+$/, '') || 'Uploaded research paper';
}

/* ------------------------------------------------------------------ */
/*  File reading                                                       */
/* ------------------------------------------------------------------ */

async function readTextFile(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }
  const bytes = await file.arrayBuffer();
  return new TextDecoder().decode(bytes);
}

/* ------------------------------------------------------------------ */
/*  PDF text extraction (enhanced with font-based math detection)      */
/* ------------------------------------------------------------------ */

type PdfTextItem = {
  str: string;
  fontName?: string;
  transform?: number[];
};

function isMathFont(fontName: string): boolean {
  const upper = fontName.toUpperCase();
  return MATH_FONT_PATTERNS.some((pattern) => upper.includes(pattern.toUpperCase()));
}

async function extractPdfText(file: File): Promise<{ text: string; mathSegments: string[] }> {
  const pdfjs = await import('pdfjs-dist');

  // Use CDN worker for reliable cross-environment compatibility
  const pdfjsVersion = pdfjs.version ?? '5.4.624';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

  const bytes = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;

  const pageTexts: string[] = [];
  const mathSegments: string[] = [];
  const maxPages = Math.min(doc.numPages, 10);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    let currentMathRun = '';
    const pageLines: string[] = [];

    for (const item of content.items) {
      if (!('str' in item)) continue;
      const textItem = item as PdfTextItem;
      const str = textItem.str;

      if (!str) continue;

      // Check if this text item uses a math font
      const fontName = textItem.fontName ?? '';
      const isFromMathFont = fontName ? isMathFont(fontName) : false;

      // Check if the string itself contains Unicode math
      const hasMathUnicode = MATH_UNICODE_RE.test(str);

      if (isFromMathFont || hasMathUnicode) {
        currentMathRun += str;
      } else {
        if (currentMathRun.trim()) {
          mathSegments.push(currentMathRun.trim());
          currentMathRun = '';
        }
      }

      pageLines.push(str);
    }

    // Flush any remaining math run
    if (currentMathRun.trim()) {
      mathSegments.push(currentMathRun.trim());
    }

    pageTexts.push(pageLines.join(' '));
  }

  // Join pages with newlines to preserve document structure
  const fullText = pageTexts.join('\n');
  return { text: fullText, mathSegments };
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

export async function parseResearchDocument(file: File): Promise<ParsedDocument> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  let rawText: string;
  let pdfMathSegments: string[] = [];

  if (isPdf) {
    const result = await extractPdfText(file);
    rawText = result.text;
    pdfMathSegments = result.mathSegments;
  } else {
    rawText = await readTextFile(file);
  }

  const normalized = normalizeWhitespace(rawText);
  const contextSnippet = normalized.slice(0, 320) || 'No text could be extracted from the uploaded file.';

  // Extract equations from the full text and any font-detected math segments
  const textEquations = extractEquations(rawText);
  const mathFontEquations = pdfMathSegments.filter((seg) => seg.length >= 3 && seg.length <= 200);
  const allEquations = uniqueEquations([...textEquations, ...mathFontEquations]);

  return {
    title: deriveTitle(file.name, rawText),
    rawText: normalized,
    contextSnippet,
    equation: allEquations[0] ?? 'F = m \u00B7 a',
    equations: allEquations.length > 0 ? allEquations : ['F = m \u00B7 a'],
    symbols: extractSymbols(rawText, allEquations),
    segments: buildSegments(normalized),
  };
}
