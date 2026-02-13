export type ExplanationDepth = 'beginner' | 'intermediate';

export type EquationStep = {
  id: string;
  title: string;
  expression: string;
  learningObjective: string;
};

export const equationSteps: EquationStep[] = [
  {
    id: 'step-1',
    title: 'Identify the relationship',
    expression: 'F = m · a',
    learningObjective: 'Understand that force depends on both mass and acceleration.'
  },
  {
    id: 'step-2',
    title: 'Hold mass constant',
    expression: 'F ∝ a (for fixed m)',
    learningObjective: 'See that increasing acceleration raises required force when mass is unchanged.'
  },
  {
    id: 'step-3',
    title: 'Hold acceleration constant',
    expression: 'F ∝ m (for fixed a)',
    learningObjective: 'See that heavier objects require more force for the same acceleration.'
  }
];

export function buildStepExplanation(step: EquationStep, depth: ExplanationDepth): string {
  if (depth === 'beginner') {
    return `${step.title}: ${step.learningObjective} In simple terms, ${step.expression} tells us how one quantity changes when another changes.`;
  }

  return `${step.title}: Using ${step.expression}, we analyze local sensitivity while holding the other variable fixed. Objective: ${step.learningObjective}`;
}
