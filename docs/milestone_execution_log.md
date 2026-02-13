# Milestone Execution Log

This document is updated as implementation progresses. For each milestone, implementation details are written **before** starting work, then updated with completion notes.

## M1 — Input + Annotation Layer

### Pre-start implementation details
- Scope for this iteration:
  1. Add a sample-paper data model (`title`, `equation`, symbol meanings, and context snippet).
  2. Replace hardcoded UI text with data-driven rendering from the sample model.
  3. Add symbol-click interaction map (`symbol click -> details drawer/modal`).
  4. Add an "Explain selection" LLM hook stub that packages selected symbol + context into a request payload preview.
- Out of scope for this iteration:
  - Real PDF parsing
  - Real LLM API calls
  - Persistent storage

### Execution updates
- ✅ Added a sample data module for one paper and equation symbols.
- ✅ Wired the UI to render from the sample data model.
- ✅ Implemented symbol selection state + contextual explanation panel.
- ✅ Implemented an "Explain selection" stub flow with generated request payload preview and simulated response.
- 🔄 Next follow-up: swap stub logic for real API interface module when backend endpoint exists.

## M2 — Explainability Layer

### Pre-start implementation details
- Scope for this iteration:
  1. Add an equation decomposition model with named steps and learning objectives.
  2. Add per-step "Explain this step" interactions in the UI.
  3. Add explanation depth controls (beginner/intermediate) to support progressive depth.
  4. Keep responses grounded in local symbol definitions and equation context.
- Out of scope for this iteration:
  - Real model API invocation
  - Citation spans from parsed PDFs
  - Personalization memory across sessions

### Execution updates
- ✅ Added explainability data structures for equation steps and depth-specific explanation templates.
- ✅ Added interactive step list with per-step explanation controls.
- ✅ Added explanation depth toggle that changes generated explanation style.
- ✅ Kept output grounded to selected symbol + local equation context in request preview.

## M3 — Interactive Understanding Tools

### Pre-start implementation details
- Scope for this iteration:
  1. Add a guided reading mode with segment-by-segment prompts and reader progression controls.
  2. Add in-app knowledge checks with immediate correctness feedback.
  3. Add progressive simplification controls so a selected equation step can be rewritten in plain vs technical modes.
  4. Extend tests to validate guided reading and knowledge-check behavior.
- Out of scope for this iteration:
  - Adaptive spaced repetition
  - User profile persistence for quiz performance
  - PDF-aware auto-generated learning checks

### Execution updates
- ✅ Added `readingSegments` and navigation UI for guided reading mode.
- ✅ Added `knowledgeChecks` with answer selection and rationale feedback.
- ✅ Added simplification controls (`plain` / `technical`) tied to selected equation step context.
- ✅ Expanded Vitest coverage for guided progression and correctness feedback.

## M4 — Integrations + Quality Hardening

### Pre-start implementation details
- Scope for this iteration:
  1. Add Wolfram Alpha launcher hook with prefilled query from current equation + selected symbol.
  2. Add optional model-backed Q&A assistant stub with explicit confidence + caveat wording.
  3. Add explanation guardrails display to surface grounding checks.
  4. Add explanation helpfulness feedback controls (thumbs up/down stub).
  5. Validate against a sample ACM paper URL in helper workflow notes for future parser handoff.
- Out of scope for this iteration:
  - Real Wolfram/API credentials
  - Real retrieval-backed assistant
  - Automated explanation evaluator service

### Execution updates
- ✅ Added `buildWolframQuery` helper and UI link to Wolfram Alpha with prefilled query text.
- ✅ Added Q&A assistant stub with grounded response text, confidence label, and caveat.
- ✅ Added guardrail checks list (`evaluateGrounding`) in explain-selection modal.
- ✅ Added helpfulness feedback controls and stub persistence message in modal.
- ✅ Added tests validating integration link generation and Q&A caveat/confidence behavior.


## Post-M4 Completion Pass — Upload + Explainability Hardening

### Pre-start implementation details
- Scope for this pass:
  1. Implement real document upload flow so users can load research files directly from the UI.
  2. Parse uploaded `.txt/.md/.pdf` files into explainable structures (title, context, equation, symbols, guided segments).
  3. Keep explanation workflows grounded against uploaded content rather than only static sample data.
  4. Add integration-style tests for upload flow and parser behavior.
- Out of scope for this pass:
  - Full backend retrieval pipeline
  - OCR for scanned-image PDFs
  - Production model-serving endpoint

### Execution updates
- ✅ Added `parseResearchDocument` pipeline with PDF text extraction (`pdfjs-dist`) and text-file parsing fallback.
- ✅ Wired upload control into app header and switched reader state to use uploaded paper context.
- ✅ Kept explanation payloads, guided reading, and tool integrations grounded to the uploaded paper state.
- ✅ Added integration tests for upload flow and parser output shape validation.
