export type PaperSymbol = {
  key: string;
  meaning: string;
  whyItMatters: string;
};

export type SamplePaper = {
  title: string;
  equation: string;
  contextSnippet: string;
  symbols: PaperSymbol[];
};

export const samplePaper: SamplePaper = {
  title: 'Newtonian Dynamics Primer',
  equation: 'F = m · a',
  contextSnippet:
    'In this section, the author derives how force changes with mass and acceleration for a rigid body.',
  symbols: [
    {
      key: 'F',
      meaning: 'Force applied to an object.',
      whyItMatters:
        'This is the outcome variable; the paper later predicts how it changes across different conditions.'
    },
    {
      key: 'm',
      meaning: 'Mass, or how much matter is in the object.',
      whyItMatters:
        'At equal acceleration, objects with larger mass require larger force.'
    },
    {
      key: 'a',
      meaning: 'Acceleration, or how quickly velocity changes.',
      whyItMatters:
        'Acceleration captures motion change; higher acceleration implies higher required force for fixed mass.'
    }
  ]
};
