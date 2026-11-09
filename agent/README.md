# agent

Stagehand v4 browser agent driving your **local Chrome** (Browserbase cloud browsers can't reach localhost). LLM: OpenAI by default, via `MODEL_NAME` (default `openai/gpt-5.6-sol`, Stagehand's recommended accuracy/cost balance) and `OPENAI_API_KEY`.

It opens **two browsers, one per system** (SITS and Blackboard), each with its own profile directory and cookie jar, so both windows stay on screen during a demo and neither login can disturb the other. Stagehand's browser handle has a single context and no `newContext()`, so isolation means two launches.

```bash
pnpm agent:run                     # all modules
pnpm agent:run --module U24CS101   # one module
pnpm agent:check-extraction        # dev: compare last run's extraction with SITS exactly
```

## Files

| File | What it does |
| --- | --- |
| `src/run.ts` | Control flow: log in to both systems, list modules, read + validate each, then create in BB; summary + log |
| `src/connectors/sits.ts` | SITS reader: login, module list, open module, extract |
| `src/connectors/bb.ts` | Blackboard writer: open the course, create the folder and both documents, skip a course that is already set up |
| `src/connectors/dom.ts` | Finds elements by visible text, aria-label, role and `aria-expanded` — no CSS selectors, no coordinates |
| `src/connectors/common.ts` | `fillField`: find a field by description with `observe()`, type the value locally; `typeIntoEditor`: type lines so Quill formats them |
| `src/browser.ts` | Launch the two Chromes + Stagehand instances; small helpers |
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

- Actions are natural language only: no hardcoded selectors, coordinates or deep-link URLs (only the start page URLs are configured).
- Where the wording itself differs between layouts (add-content menu, save button, confirmation dialog), the step is a natural-language `act()`. Stable navigation and assertions use text/role lookups, which cost no model calls.
- Each step retries up to 2 times after re-observing the page, then the module fails gracefully and the run continues.
- Quill content is typed using its shortcuts (`- ` bullets, `# ` headings, Ctrl/Cmd+B bold). No HTML pasting. (Milestone 5.)
- Before creating content, check the course: if "Module Information" already exists, skip the module and log why. A module that fails partway is left as is (hidden) and marked failed. (Milestone 5.)
- Created content is always Hidden.

## Run log

Each run writes `agent/runs/run-<timestamp>.json` and `agent/runs/latest.json` (gitignored): every step with status, attempts and duration, plus per-module status, flags and extracted data.
