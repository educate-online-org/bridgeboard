# Bridgeboard

A demo showing an AI browser agent doing university admin setup by hand-off: it **reads module data from a (fake) SITS** records system and **builds the matching module pages in a (fake) Blackboard Ultra**, entirely through the UI, the way a staff member would.

No real systems, APIs, or student data are involved. Both systems are minimal fake web apps in this repo.

> Status: **milestone 1 done** (workspace, shared schemas, seed data). Fake apps and agent not built yet. See [Milestones](#milestones).

Full specification: [`docs/BRIEF.md`](docs/BRIEF.md)

## What the demo proves

1. The agent reads module data from fake SITS (page HTML, screenshots as fallback).
2. The agent sets up the module in fake Blackboard through the UI: clicking, typing, using a rich text editor.
3. It keeps working after the UI layout is switched live (moved buttons, renamed labels, reordered fields).
4. A verification report proves Blackboard matches SITS.
5. Bad or missing data is **flagged, not guessed**.
6. Everything the agent creates is **hidden** until a human publishes it.

## Repo layout

| Path | What it is | Port |
| --- | --- | --- |
| `apps/fake-sits` | Fake SITS: old-school, read-only records system (Next.js, JSON storage) | 3001 |
| `apps/fake-bb` | Fake Blackboard Ultra: course shells, Quill editor, review page (Next.js, JSON storage) | 3002 |
| `agent/` | Stagehand + Playwright browser agent, OpenAI as the LLM (configurable) | — |
| `packages/shared` | Shared TypeScript types + Zod `Module` schema | — |
| `verify/` | Compares SITS DB (ground truth) against BB DB; console + HTML report | — |
| `seed/` | Seed data for both systems (incl. one deliberately broken module) | — |
| `docs/` | Project brief and notes | — |

## Prerequisites

- Node.js 20+ (developed on 26, see `.nvmrc`)
- pnpm 9+
- An OpenAI API key

## Setup

```bash
pnpm install
cp .env.example .env   # then add your OPENAI_API_KEY and MODEL_NAME
pnpm seed              # seed both systems
```

## Commands

| Command | Does |
| --- | --- |
| `pnpm seed` | Create `data/` with fresh SITS + BB data (layout v1) ✅ |
| `pnpm test` / `pnpm typecheck` | Run tests / type checks ✅ |
| `pnpm dev` | Start fake SITS (3001) and fake BB (3002) |
| `pnpm agent:run` | Transfer all valid modules SITS → BB |
| `pnpm agent:run --module U24CS101` | Transfer a single module |
| `pnpm verify` | Compare databases; write console + HTML report |
| `pnpm preflight` | Check both apps are up, logins work, API key set (run before a live demo) |
| `pnpm layout v1` / `pnpm layout v2` | Switch the UI layout of both fake systems ✅ |
| `pnpm reset` | Wipe BB content and reseed both systems, keeping the current layout ✅ |

## Configuration

Set in `.env` (see `.env.example`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `MODEL_NAME` | LLM for Stagehand, as `provider/model` | `openai/<model>` |
| `OPENAI_API_KEY` | OpenAI API key used by Stagehand | — |
| `SITS_URL` | Fake SITS base URL | `http://localhost:3001` |
| `BB_URL` | Fake BB base URL | `http://localhost:3002` |
| `HEADLESS` | `false` to watch the browser (demos) | `false` |

Demo logins (fake, hardcoded):

- SITS: `sits_admin` / `demo123`
- Blackboard: `bb_admin` / `demo123`

## Demo script

1. Show fake SITS with module data.
2. Run `pnpm agent:run` with the browser visible.
3. Show the created BB pages (all hidden).
4. Run `pnpm verify` and show the HTML report.
5. `pnpm layout v2` (or the admin-corner toggle), `pnpm reset`, run again: it still works.
6. Show the flagged broken module in the run log.
7. Publish one item via BB's `/admin/review`.

## Decisions

| Topic | Decision |
| --- | --- |
| LLM | OpenAI via Stagehand, model from Stagehand's recommended list (set in `MODEL_NAME`) |
| Storage | JSON files, one per fake app (no SQLite) |
| Seed data | Computer Science: 3 valid modules + 1 broken |
| Branding | Both fake systems carry the name **CCCU** (text only, no real logos or assets) |
| Audience | Live demo, so runs must be robust and short; add a pre-flight check |
| Partial failure | Leave what was created (it's hidden), mark the module failed in log and report |
| Re-runs | If the course already has "Module Information", skip the module and log it; `pnpm reset` to redo |
| Quill | Typing with shortcuts, no HTML pasting; kept as one swappable "enter formatted content" step |
| Real systems (later) | Agent built so the fake systems can be swapped for CCCU's real ones; real BB verification via REST API. Login/SSO out of scope for now. Access needed: [`docs/CCCU_ACCESS.md`](docs/CCCU_ACCESS.md) |

## How the pieces run

Nothing here is purely browser-side:

- **Fake SITS / fake BB** are Next.js apps with a server part (pages, login sessions, their own SQLite/JSON data, the stored layout setting) and a browser part (the UI, Quill editor in BB).
- **Agent** is a Node process. It opens a real (local) browser via Stagehand/Playwright and only interacts with the fake systems through that browser, like a human would. It never touches their databases.
- **Verify** is a Node script that reads both apps' databases directly. No browser involved.

## Key design rules

- **Step-by-step agent:** control flow lives in code; each step is a small natural-language instruction. No single big autonomous prompt.
- **No hardcoded selectors or coordinates** for agent actions. Elements are described in natural language so layout changes don't break it.
- **Extract, don't guess:** the extraction schema makes fields nullable and the agent is told to return `null` for anything not shown on the page, never to infer or fill in a value. Strict validation runs afterwards on the extracted data.
- **Layout lives server-side:** each fake app stores its current layout (`v1`/`v2`) itself and renders accordingly. The agent never knows or sets the layout; no `?layout=` in URLs, no `LAYOUT` in the agent's config.
- **Quill via typing shortcuts:** the agent formats content by typing, using Quill's shortcuts (e.g. `- ` for bullets) rather than pasting HTML or clicking every toolbar button.
- **Validate before writing:** weights sum to 100, every assessment has a due date, learning outcomes non-empty. Fail → nothing is created for that module; a flag is logged.
- **Retries:** on step failure, re-observe and retry up to 2 times, then fail that module gracefully.
- **Verification uses ground truth:** `verify/` reads the SITS DB directly, never the agent's extracted data.
- **Swappable LLM:** OpenAI by default; the model is set by `MODEL_NAME` only, so another provider can be swapped in without code changes.
- **Hidden by default:** all agent-created content is "Hidden from students".

## Milestones

- [x] 1. Monorepo + shared schema + seed data
- [ ] 2. Fake SITS (v1, then v2)
- [ ] 3. Fake BB (v1, then v2, incl. Quill and review page)
- [ ] 4. Agent reads SITS correctly for all modules
- [ ] 5. Agent creates BB content for one module, then all
- [ ] 6. Validation and flagging
- [ ] 7. Verification script + HTML report
- [ ] 8. Layout v2 runs end to end
- [ ] 9. Reset script, README, polish

## Non-goals

No real SITS/Blackboard, no real APIs, no real student data, no real auth/security, no grades/enrolments/attendance.
