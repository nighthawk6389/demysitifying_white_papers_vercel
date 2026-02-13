# Demystifying White Papers

A lightweight web app skeleton for helping non-specialists understand dense math/physics/ML research papers.

## What this project is

The goal is to make research notation and concepts approachable through:
- Interactive notation tooltips
- Visual concept cards and mini-diagrams
- Step-by-step equation walkthroughs
- Integrations to external helpers (e.g., Wolfram Alpha)
- Optional LLM-backed explanation support for difficult passages

This repository currently contains a **framework-based MVP skeleton** so we can iterate quickly on product details.

## Practicality review (updated)

To keep this realistic and useful early, we should optimize for:
- **One-paper-at-a-time workflows** (no complex multi-document indexing yet)
- **Symbol-level and paragraph-level explanations first**, full derivation proof support later
- **Grounded LLM responses** (always include source snippet in prompt and show confidence/caveat text)
- **Minimal infrastructure** (React + Vite front end and a small API service)

## Tech direction

- Front end: **React + Vite + TypeScript** (chosen over raw HTML/CSS/JS)
- Styling: plain CSS for now, with easy migration path to component library later
- Back end (next phase): lightweight API for PDF parsing + LLM orchestration

## Proposed next milestones

1. **M1: Input + annotation layer**
   - PDF ingestion and section extraction
   - Highlight math symbols and references
   - Add an "Explain selection" hook that sends local snippet context to an LLM gateway
2. **M2: Explainability layer**
   - Symbol dictionary + concept definitions
   - Equation decomposition pipeline
   - LLM-generated step-by-step explanations grounded by extracted notation and definitions
3. **M3: Interactive understanding tools**
   - Guided reading mode
   - Knowledge checks and progressive simplification
4. **M4: Integrations + quality hardening**
   - Wolfram Alpha hooks
   - Optional model-backed Q&A assistant
   - Guardrails/evaluation for explanation quality

## Useful additions to evaluate soon

- arXiv metadata fetch (title, abstract, references)
- Paper glossary export (user-saved symbols/definitions)
- "Explain like I'm new to this" depth toggle
- Inline "Was this explanation helpful?" feedback loop

<<<<<<< codex/create-skeleton-for-math-visualization-web-app
## Milestone tracking

Detailed implementation tracking lives in `docs/milestone_execution_log.md` and is updated as milestone work starts/completes.

=======
>>>>>>> main
## Run the skeleton locally

```bash
cd web
npm install
npm run dev
```

Then open the local URL shown by Vite (typically `http://localhost:5173`).
