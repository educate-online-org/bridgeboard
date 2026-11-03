# Bridgeboard: notes for Claude

Full spec: `docs/BRIEF.md`. Read it before starting a milestone.

- pnpm workspaces monorepo, TypeScript everywhere.
- fake-sits on 3001, fake-bb on 3002. Keep them separate apps.
- Agent uses Stagehand (check current docs for the API); control flow in code, one natural-language instruction per step.
- LLM: OpenAI by default (`OPENAI_API_KEY`, `MODEL_NAME=openai/...`). Never hardcode the provider or model in code; read `MODEL_NAME`.
- Agent actions must never use hardcoded CSS selectors or coordinates.
- `verify/` compares the SITS DB with the BB DB directly, never the agent's extracted data.
- Extraction schema: fields nullable; prompt says return null if not shown, never infer. Validate strictly afterwards (strict schema in packages/shared).
- Layout (v1/v2) is stored server-side in each fake app (admin toggle / `pnpm layout`). The agent must not know or set it; no `?layout=` param.
- Quill content is entered by typing with shortcuts (e.g. `- ` for bullets). No HTML pasting.
- Agent-created BB content is always Hidden by default.
- Invalid modules are flagged and skipped, never guessed or partially created.
- Storage: one JSON file per fake app. No SQLite.
- Branding: name "CCCU" as text only; no real logos/assets.
- Partial module failure: leave created content, mark failed. Re-run: skip a course that already has "Module Information".
- Live demo: keep runs short and robust; `pnpm preflight` checks setup.
- Eventually runs on CCCU's real SITS/BB: keep fake-specific details (URLs, step wording, editor input) in per-system config/connectors, not the main flow. Verify source must be swappable (fake JSON now, BB REST API later). See docs/CCCU_ACCESS.md.
- Work milestone by milestone (see README); keep things simple.
