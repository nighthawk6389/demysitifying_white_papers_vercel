# Product Plan: Demystifying White Papers

## Problem

Research papers often assume deep prerequisite knowledge. New readers struggle with:
- Dense notation
- Compressed derivations
- Implicit assumptions
- Jargon-heavy explanations

## Audience

- Curious builders and students
- Engineers crossing into math-heavy domains
- Professionals reading adjacent-field literature

## Core UX Principles

1. **Explain notation in context**: each symbol is clickable and explained where it appears.
2. **Progressive depth**: beginner first, advanced optional.
3. **Visual first**: diagrams and mental models before equations.
4. **Reading continuity**: no context-switching to external tabs unless requested.
5. **Grounded AI**: explanations should tie back to visible source text/snippets.

## Practical scope decisions

To keep the first iterations feasible:
- Start with **single-paper sessions** and explicit user selection.
- Prioritize **symbol and local-step explanation** over full theorem verification.
- Use **assistive explanations**, not authoritative proof-checking claims.
- Treat OCR/math extraction as a progressively improving component.

## Front-end architecture decision

We will use a web framework instead of raw HTML/CSS/JS:
- **Framework**: React with Vite + TypeScript
- **Why**:
  - predictable component-based UI for complex reader interactions
  - easier state management for annotations, selected symbols, and tool panels
  - cleaner scaling path for routing, data fetching, and test tooling
- **Initial UI modules**:
  - `ReaderShell`
  - `EquationCard`
  - `NotationModal`
  - `LlmExplainModal`
  - `ToolsSidebar`

## Skeleton Information Architecture

- **Top Bar**
  - App identity
  - Document selector/upload placeholder
- **Main Reader Area**
  - Future: parsed paper text + equations
  - Current: sample equation card + "Explain this equation" LLM stub
- **Side Panel**
  - Symbol meaning
  - Variable assumptions
  - Links to related concepts
- **Tool Drawer**
  - Wolfram Alpha
  - Unit checker
  - Plot sandbox
  - arXiv/citation lookup shortcuts

## Integration Strategy (future)

- **Wolfram Alpha**: symbolic simplification and plots
- **MathJax/KaTeX**: render equations clearly
- **LLM orchestration**:
  - M1: context-aware snippet explainer endpoint
  - M2: structured derivation explanation with citation to source spans
  - M3: difficulty-level rewriting (beginner/intermediate)

## MVP Success Criteria

- User can upload/select a paper
- User can click an equation symbol and get a plain-language explanation
- User can request “explain this step” on a derivation line
- User can open at least one external math helper with prefilled query
- User can trigger an LLM explanation flow for selected notation/equations
- User can leave quick feedback on explanation usefulness

## Risks and mitigations

- **Poor OCR/math extraction quality from PDFs**
  - Mitigation: start with digital PDFs and fallback manual selection.
- **Hallucinated explanations if model prompts are weak**
  - Mitigation: retrieval-grounded prompts + visible source excerpt + caveat labels.
- **Overwhelming UI if too many features surface at once**
  - Mitigation: staged disclosure and a default beginner mode.
- **API cost creep**
  - Mitigation: caching, token limits, and user-triggered calls only.

## Immediate Build Plan

1. Bootstrap React + Vite + TypeScript front end (done in this skeleton)
2. Add fake data JSON for one sample paper and symbols
3. Add interaction map: symbol click -> details drawer
4. Add API interface stubs for external tools and LLM explainer calls
5. Add a basic explanation feedback signal (thumbs up/down)
6. Layer in real parser + retrieval later

## Non-goals (for now)

- Full formal proof verification
- Real-time collaborative editing
- Broad corpus indexing across thousands of papers
