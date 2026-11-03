# agent

Stagehand (on Playwright) browser agent. LLM: OpenAI by default, set via `MODEL_NAME` (`provider/model`) and `OPENAI_API_KEY`.

Flow: log into SITS → extract each module with the Zod schema → validate → log into BB → per valid module create folder "Module Information" with documents "Module Overview" and "Assessment Information" (Hidden) → write run log (JSON + console).

Extraction: uses the **lenient** schema from `packages/shared` (missing values are `null`). The instruction tells the model to return `null` for anything not on the page and never infer, guess or fill in. The result is then checked against the **strict** schema + rules; any failure → module flagged and skipped.

The agent does not know which layout is active and never sets it.

Quill: content is typed using Quill's shortcuts (e.g. `- ` starts a bullet). No HTML pasting.

Before creating content, the agent checks the course: if "Module Information" already exists, it skips the module and logs why. If a module fails partway, created content is left (hidden) and the module is marked failed.

Rules: natural-language actions only (no selectors/coordinates); retry a failed step up to 2× after re-observing; invalid modules are flagged and skipped.

```bash
pnpm agent:run
pnpm agent:run --module U24CS101
```
