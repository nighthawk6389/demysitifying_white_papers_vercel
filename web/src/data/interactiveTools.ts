export type ReadingSegment = {
  id: string;
  title: string;
  text: string;
  focusPrompt: string;
};

export type KnowledgeCheck = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  rationale: string;
};

export type SimplificationLevel = 'plain' | 'technical';

export const readingSegments: ReadingSegment[] = [
  {
    id: 'segment-1',
    title: 'What relationship is introduced?',
    text: 'The passage introduces F = m · a as a local relationship between force, mass, and acceleration.',
    focusPrompt: 'Can you identify which quantity changes when mass is held fixed?'
  },
  {
    id: 'segment-2',
    title: 'How should we read fixed-variable statements?',
    text: 'When the author says “for fixed m”, they isolate acceleration to understand how force scales in that constrained setting.',
    focusPrompt: 'What does fixed m prevent us from confusing in this step?'
  },
  {
    id: 'segment-3',
    title: 'Why does this matter for intuition?',
    text: 'The same law supports two mental models: heavier objects need more force, and sharper acceleration needs more force.',
    focusPrompt: 'Can you map each model to a real-world example?'
  }
];

export const knowledgeChecks: KnowledgeCheck[] = [
  {
    id: 'check-1',
    prompt: 'If mass is constant and acceleration doubles, what happens to force in F = m · a?',
    options: ['Force stays unchanged', 'Force halves', 'Force doubles'],
    correctIndex: 2,
    rationale: 'With fixed mass, force is directly proportional to acceleration.'
  },
  {
    id: 'check-2',
    prompt: 'What does “fixed a” mean in the step F ∝ m (for fixed a)?',
    options: [
      'Acceleration is held constant while mass changes',
      'Force is held constant while acceleration changes',
      'Mass and acceleration are both changing'
    ],
    correctIndex: 0,
    rationale: 'The expression explicitly isolates the mass variable by holding acceleration constant.'
  }
];

export function simplifyStepText(text: string, level: SimplificationLevel): string {
  if (level === 'plain') {
    return `Plain-language rewrite: ${text} This means we vary one quantity at a time to avoid mixing causes.`;
  }

  return `Technical rewrite: ${text} Interpreted as a constrained sensitivity statement with one control variable fixed.`;
}

export function buildWolframQuery(equation: string, selectedSymbol: string | null): string {
  const base = selectedSymbol ? `${equation}, solve for ${selectedSymbol}` : equation;
  return `https://www.wolframalpha.com/input?i=${encodeURIComponent(base)}`;
}

export function evaluateGrounding(output: string, contextSnippet: string): string[] {
  const checks: string[] = [];
  if (output.toLowerCase().includes('means')) {
    checks.push('Defines notation in plain language.');
  }
  if (output.toLowerCase().includes('fixed')) {
    checks.push('References variable control assumptions (fixed-variable reasoning).');
  }
  if (contextSnippet.length > 20) {
    checks.push('Anchored to local context snippet included in request payload.');
  }
  return checks;
}
