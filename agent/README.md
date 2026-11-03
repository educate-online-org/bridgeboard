# agent

Stagehand v4 browser agent driving your **local Chrome** (Browserbase cloud browsers can't reach localhost). LLM: OpenAI by default, via `MODEL_NAME` (default `openai/gpt-5.6-sol`, Stagehand's recommended accuracy/cost balance) and `OPENAI_API_KEY`.

```bash
pnpm agent:run                     # all modules
pnpm agent:run --module U24CS101   # one module
pnpm agent:check-extraction        # dev: compare last run's extraction with SITS exactly
```

## Files

| File | What it does |
| --- | --- |
| `src/run.ts` | Control flow: log in, list modules, read + validate each, (BB in milestone 5), summary, save log |
| `src/connectors/sits.ts` | SITS reader: login, module list, open module, extract |
| `src/connectors/common.ts` | `fillField`: find a field by description with `observe()`, type the value locally |
| `src/browser.ts` | Launch Chrome + Stagehand; small helpers |
| `src/log.ts` | Run log: steps, timing, retries, flags; console output + `agent/runs/latest.json` |
| `src/config.ts` | Reads `.env` |

Connectors keep system-specific wording out of the main flow, so a real SITS/BB connector can replace the fake one later.

## How it reads SITS

1. Open the SITS start page, log in. Username/password fields are found with `observe()` (natural language → selector found at run time); the values are typed locally, so **credentials never go to the LLM**.
2. Open the module list via the menu and `extract()` the module codes.
3. For each module: open the list, open the module, `extract()` with the **lenient** schema and an instruction to return `null` rather than guess, and to convert dates to YYYY-MM-DD.
4. Check the extracted code matches the module we meant to open (wrong page → retry).
5. Validate with the strict rules. If it fails, take a **second look with a screenshot** (the brief's screenshot fallback). Only if the second reading also fails is the module flagged; nothing is created for it.

The agent does not know which layout is active and never sets it.

## Rules

- Actions are natural language only: no hardcoded selectors, coordinates or deep-link URLs (only the start page URL is configured).
- Each step retries up to 2 times after re-observing the page, then the module fails gracefully and the run continues.
- Quill content is typed using its shortcuts (`- ` bullets, `# ` headings, Ctrl/Cmd+B bold). No HTML pasting. (Milestone 5.)
- Before creating content, check the course: if "Module Information" already exists, skip the module and log why. A module that fails partway is left as is (hidden) and marked failed. (Milestone 5.)
- Created content is always Hidden.

## Run log

Each run writes `agent/runs/run-<timestamp>.json` and `agent/runs/latest.json` (gitignored): every step with status, attempts and duration, plus per-module status, flags and extracted data.
