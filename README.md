# Bridgeboard

A demo showing an AI browser agent doing university admin setup: it reads module data from a (fake) **SITS** records system, then builds the matching module pages in a (fake) **Blackboard Ultra** — entirely through the UI, the way a staff member would.

No real systems, APIs or student data are involved. Both systems are minimal fake web apps in this repo.

Status: all milestones done. Live runs read all four modules from SITS, set up the three valid ones in Blackboard, flagged and skipped the broken one, and repeated it under layout v2 in a second browser. `verify` reports 3/3 matched.

Full specification: [`docs/BRIEF.md`](docs/BRIEF.md)

## What the demo proves

1. The agent reads module data from fake SITS (page HTML, screenshots as fallback).
2. The agent sets up the module in fake Blackboard through the UI: clicking, typing, using a rich text editor.
3. It keeps working after the UI layout is switched live (moved buttons, renamed labels, reordered fields).
4. A verification report proves Blackboard matches SITS.
5. Bad or missing data is flagged, not guessed.
6. Everything the agent creates is hidden until a human publishes it.

## Repo layout

| Path | What it is | Port |
| --- | --- | --- |
| `apps/fake-sits` | Fake SITS: old-school, read-only records system (Next.js, JSON storage) | 3001 |
| `apps/fake-bb` | Fake Blackboard Ultra: course shells, Quill editor, review page (Next.js, JSON storage) | 3002 |
| `agent/` | Stagehand + Playwright browser agent, OpenAI as the LLM (configurable) | — |
| `packages/shared` | Shared TypeScript types, Zod schemas, the document text builders | — |
| `verify/` | Compares the SITS database against the BB database; console + HTML report | — |
| `seed/` | Seed data for both systems (including one deliberately broken module) | — |
| `docs/` | Project brief and reference notes | — |

## Setup

Needs Node.js 20+, Google Chrome (Stagehand drives your local Chrome), pnpm 9+ and an OpenAI API key.

```bash
pnpm install
cp .env.example .env   # then add your OPENAI_API_KEY and MODEL_NAME
pnpm seed              # seed both systems
pnpm preflight         # check the setup before a run
```

## Commands

| Command | Does |
| --- | --- |
| `pnpm dev` | Start fake SITS (3001) and fake Blackboard (3002) |
| `pnpm seed` | Create `data/` with fresh SITS + Blackboard data (layout v1) |
| `pnpm reset` | Wipe Blackboard content and reseed both systems, keeping the current layout |
| `pnpm preflight` | Check apps are up, config is set, data is seeded (run before a demo) |
| `pnpm agent:run` | Transfer all valid modules: read and validate SITS, then create in Blackboard |
| `pnpm agent:run --module U24CS101` | Transfer a single module |
| `pnpm agent:check-extraction` | Dev check: compare the last run's extracted data with SITS exactly |
| `pnpm verify` | Compare the two databases; write the console table and HTML report |
| `pnpm layout v1` / `pnpm layout v2` | Switch the UI layout of both fake systems |
| `pnpm test` / `pnpm typecheck` | Run tests / type checks |

## Configuration

Set in `.env` (see `.env.example`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `MODEL_NAME` | LLM for Stagehand, as `provider/model` | `openai/gpt-5.6-sol` |
| `OPENAI_API_KEY` | OpenAI API key used by Stagehand | — |
| `SITS_URL` | Fake SITS base URL | `http://localhost:3001` |
| `BB_URL` | Fake Blackboard base URL | `http://localhost:3002` |
| `HEADLESS` | `false` to watch the browsers (demos) | `false` |

Fake logins: SITS `sits_admin` / `demo123`, Blackboard `bb_admin` / `demo123`.

## Demo script

1. Show fake SITS with the module data.
2. Run `pnpm agent:run` with the browsers visible.
3. Show the created Blackboard pages (all hidden).
4. Run `pnpm verify` and show the HTML report.
5. `pnpm layout v2`, `pnpm reset`, run again: it still works.
6. Show the flagged broken module in the run log.
7. Publish one item via Blackboard's `/admin/review`.

## How the pieces run

- **Fake SITS / fake Blackboard** are Next.js apps: a server part (pages, login sessions, JSON storage, the stored layout) and a browser part (the UI, the Quill editor).
- **Agent** is a Node process. It opens two local browsers, one per system, each with its own profile and cookies, and drives them like a person with both windows open. It never touches either database.
- **Verify** is a Node script that reads both databases directly. No browser involved.

## Design rules

- **Step-by-step agent:** control flow lives in code; each step is a small natural-language instruction. No single big autonomous prompt.
- **No hardcoded selectors or coordinates.** Elements are found by description, visible text or role, so layout changes don't break it.
- **Extract, don't guess:** the extraction schema makes fields nullable and the agent must return `null` for anything not shown. Strict validation runs afterwards.
- **Validate before writing:** weights sum to 100, every assessment has a due date, learning outcomes non-empty. Fail, and nothing is created for that module.
- **Retries:** on step failure, re-observe and retry up to 2 times, then fail that module gracefully and continue.
- **Layout lives server-side:** each fake app stores and renders its own layout. The agent never knows or sets it.
- **Typing, not pasting:** content is entered by typing, using Quill's shortcuts (e.g. `- ` for bullets), never pasted HTML.
- **Verification uses ground truth:** `verify/` reads the SITS database, never the agent's extracted data.
- **Swappable LLM:** the model comes from `MODEL_NAME` only, so another provider needs no code changes.
- **Hidden by default:** agent-created content is "Hidden from students" until a human publishes it from `/admin/review`; visibility can also be flipped per item, as in Ultra. Universities work this way for a reason: a public Blackboard Ultra guide warns that making internal folders and items visible "may constitute a data breach" ([Northampton, NILE](docs/UI_REFERENCES.md)).

## Decisions

| Topic | Decision |
| --- | --- |
| Storage | One JSON file per fake app (no SQLite) |
| Seed data | Computer Science: 3 valid modules + 1 broken |
| Branding | Both fake systems carry the name CCCU (text only, no real logos or assets) |
| Partial failure | Leave what was created (it is hidden), mark the module failed in the log and report |
| Re-runs | If the course already has "Module Information", skip the module and log it |
| Real systems (later) | Agent built so the fake systems can be swapped for CCCU's real ones; verification via the Blackboard REST API. Access needed: [`docs/CCCU_ACCESS.md`](docs/CCCU_ACCESS.md) |
| UI fidelity | Fake Blackboard copies real Ultra where it costs nothing; deliberate differences are listed as [ours diverges] in [`docs/UI_REFERENCES.md`](docs/UI_REFERENCES.md) |

## Milestones

- [x] 1. Monorepo + shared schema + seed data
- [x] 2. Fake SITS (v1, then v2)
- [x] 3. Fake Blackboard (v1, then v2, incl. Quill and review page)
- [x] 4. Agent reads SITS correctly for all modules
- [x] 5. Agent creates Blackboard content (folder + both documents, hidden)
- [x] 6. Validation and flagging
- [x] 7. Verification script + HTML report
- [x] 8. Layout v2 runs end to end
- [x] 9. Reset script, README, preflight

## Non-goals

No real SITS or Blackboard, no real APIs, no real student data, no real auth or security, no grades, enrolments or attendance.
