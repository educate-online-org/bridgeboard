# @bridgeboard/shared

Shared TypeScript types, Zod schemas and validation rules.

Two schemas for the `Module` shape (code, title, level, credits, term, leader, description, learningOutcomes, assessments[name, type, weightPercent, dueDate]):

- **Extraction schema (lenient):** every field nullable, so the model can say "not on the page" instead of inventing a value. Used by the agent's `extract()`.
- **Strict schema:** every field required and well-formed. Extracted data must pass this before anything is created in BB.

Validation rules (run after the strict schema):
- assessment weights sum to 100
- every assessment has a due date
- learning outcomes are not empty

Each failure produces a human-readable flag reason.
