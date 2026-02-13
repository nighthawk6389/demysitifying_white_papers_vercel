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
_To be filled in immediately before implementation starts._

### Execution updates
_Not started._

## M4 — Integrations + Quality Hardening

### Pre-start implementation details
_To be filled in immediately before implementation starts._

### Execution updates
_Not started._
