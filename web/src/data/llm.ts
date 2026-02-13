import type { FormulaSpan } from './documentParser';

type ExplainFormulaArgs = {
  formula: FormulaSpan;
  context: string;
  title: string;
};

const endpoint = import.meta.env.VITE_LLM_ENDPOINT ?? 'https://api.openai.com/v1/chat/completions';
const model = import.meta.env.VITE_LLM_MODEL ?? 'gpt-4o-mini';
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

function buildFallbackExplanation(args: ExplainFormulaArgs): string {
  return `Formula: ${args.formula.expression}\n\nI could not reach the LLM endpoint, so this is a local fallback. Read the expression as a complete relationship rather than individual symbols: identify the left-hand target variable, then inspect how each term on the right contributes to its value in the paper's context.`;
}

export async function explainFormula(args: ExplainFormulaArgs): Promise<{ text: string; source: 'llm' | 'fallback' }> {
  if (!apiKey) {
    return { text: buildFallbackExplanation(args), source: 'fallback' };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You explain scientific formulas for non-specialists. Always explain the full formula first, then key terms, and keep it grounded to provided context.'
        },
        {
          role: 'user',
          content: `Document title: ${args.title}\nContext snippet: ${args.context}\nFormula: ${args.formula.expression}\n\nExplain this formula in 5-8 concise bullet points.`
        }
      ]
    })
  });

  if (!response.ok) {
    return { text: buildFallbackExplanation(args), source: 'fallback' };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return {
    text: payload.choices?.[0]?.message?.content?.trim() || buildFallbackExplanation(args),
    source: 'llm'
  };
}
