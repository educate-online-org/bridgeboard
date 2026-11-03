# Project brief: SITS → Blackboard setup agent (demo)

> **Amendments to the original brief**
> - 2026-11-03: LLM changed from Claude to **OpenAI** (via Stagehand). Model set by `MODEL_NAME`, key by `OPENAI_API_KEY`; this replaces `ANTHROPIC_API_KEY` in the config list below.
> - 2026-11-03: Extraction uses a lenient (nullable) schema and the model is told to return null rather than infer; a strict schema + rules validate afterwards.
> - 2026-11-03: Layout is stored server-side in each fake app (admin toggle / `pnpm layout v1|v2`), not via `?layout=`. `LAYOUT` is removed from the agent's .env; the agent never knows the layout.
> - 2026-11-03: Quill content is entered by typing with shortcuts (e.g. `- ` for bullets), not pasted HTML.
> - 2026-11-03: Storage is JSON files (one per fake app). Seed data is Computer Science (3 valid + 1 broken). Branding: "CCCU", text only. Live audience, so add `pnpm preflight`. Partial failure: leave content, mark failed. Re-run: skip courses that already have "Module Information".

## Goal
Build a demo showing that an AI browser agent can do the admin setup university staff currently do by hand: reading module data from SITS (student records system) and setting up module pages in Blackboard Ultra (the learning platform).

We will NOT use the real systems. We'll build two minimal FAKE web apps that mimic SITS and Blackboard, then build an agent that logs into both like a human and transfers the data through the UI.

Assume the agent has all the access it needs. The demo must show:
1. The agent reads module data from fake SITS (from the page HTML, with screenshots as a fallback).
2. The agent sets up the matching module page in fake Blackboard through the UI (clicking, typing, using a rich text editor).
3. It still works after we switch the UI layout live (moved buttons, renamed labels, reordered fields).
4. A verification report proves BB matches SITS.
5. Bad or missing data gets flagged, not guessed.
6. Everything the agent creates is hidden until a human publishes it.

## Tech stack
- Monorepo, TypeScript everywhere, pnpm workspaces
- `apps/fake-sits`: Next.js, runs on port 3001
- `apps/fake-bb`: Next.js, runs on port 3002
- Separate apps on purpose: the agent must log into two different systems
- `agent/`: Node + TypeScript using Stagehand (Browserbase) on top of Playwright, with Claude as the LLM. Check Stagehand's current docs for exact API usage.
- `packages/shared`: shared types plus a Zod schema for module data
- Storage: SQLite (better-sqlite3 or Prisma) or JSON files. Keep it simple.
- Rich text editor in fake BB: Quill
- `verify/`: a script that compares the databases directly

## Repo structure
/apps/fake-sits
/apps/fake-bb
/agent
/packages/shared
/verify
/seed          (seed data for both systems)
README.md      (how to run everything with one command)

## Shared data schema (packages/shared)
Module {
  code: string            // e.g. "U24CS101"
  title: string
  level: number           // 4, 5, 6, 7
  credits: number
  term: string            // e.g. "2026/27 Semester 1"
  leader: string          // module leader name
  description: string
  learningOutcomes: string[]
  assessments: {
    name: string
    type: "Coursework" | "Exam" | "Presentation" | "Portfolio"
    weightPercent: number
    dueDate: string        // ISO date
  }[]
}

Seed 3–5 modules. Include ONE deliberately broken module: assessment weights that don't sum to 100, a missing due date, and an empty learning outcomes list. It tests flagging.

## Fake SITS (port 3001)
Should look like an old-fashioned institutional records system: dense tables, grey and blue colours, small fonts.
- /login: username and password form (hardcoded: sits_admin / demo123), stores a session cookie
- /modules: table of modules (code, title, term, leader), each row links to a detail page
- /modules/[code]: detail page showing all fields, with assessments in a table
- Read-only. No editing needed.
- Layout variants via `?layout=v1|v2` (or a toggle in a small admin corner):
  - v2 moves fields around, renames labels (e.g. "Module Leader" → "Convenor", "Weighting" → "% of Module"), and turns the table into cards
  - The data stays identical; only the presentation changes

## Fake Blackboard Ultra (port 3002)
Should feel like Blackboard Ultra: clean, white, modern.
- /login: hardcoded bb_admin / demo123
- /courses: list of courses (one shell per module code, pre-created empty)
- /courses/[code]: the course content page, with a "+" button that opens a menu: "Create" → "Document" or "Folder"
- Creating a Document opens a modal or side panel with:
  - Title field
  - Quill rich text editor for the body (supports headings, bold, bullet lists)
  - Visibility dropdown: "Visible to students" / "Hidden from students" (default: Hidden)
  - Save button
- The agent should create, per course:
  - A folder "Module Information"
  - Inside it, a document "Module Overview" containing: description, level, credits, term, leader, and learning outcomes as a bullet list
  - Inside it, a document "Assessment Information" containing the assessments as a list with weights and due dates
- Include realistic friction: a confirmation modal, a short loading spinner (300–800 ms) before panels appear, a toast notification after saving
- /admin/review: list of all hidden items, with a "Publish" button per item (this is the human approval step)
- Layout variants via `?layout=v1|v2`:
  - v2 moves the "+" button to a different place, renames "Create" to "Add content", reorders form fields, and changes button text (e.g. "Save" → "Done")
- Store created content in BB's own DB with fields: courseCode, parentFolder, title, bodyHtml, visibility, createdAt

## Agent (agent/)
Use Stagehand's step-by-step approach: control flow in code, natural language per step. Avoid one big autonomous prompt; we want predictability.

Flow:
1. Open fake SITS, log in, go to the module list
2. For each module, open its detail page and use extract() with the Zod Module schema to get structured data
3. Validate the extracted data:
   - weights sum to 100
   - every assessment has a due date
   - learning outcomes are not empty
   If validation fails: DO NOT create anything for that module. Log a clear flag with the reason and move on.
4. Open fake BB and log in
5. For each valid module: open its course, create the "Module Information" folder, then create both documents inside it with formatted content via the Quill editor. Set visibility to Hidden.
6. Write a run log (JSON + readable console output): every step, its timing, success or failure, and any flags
7. Never use hardcoded CSS selectors or coordinates for actions. Always describe elements in natural language, so layout changes don't break the agent.
8. Retries: if a step fails, re-observe the page and retry up to 2 times, then fail that module gracefully

Config via .env: ANTHROPIC_API_KEY, SITS_URL, BB_URL, LAYOUT (v1|v2), HEADLESS (false for demos)

Commands:
- `pnpm agent:run`: run the full transfer
- `pnpm agent:run --module U24CS101`: run a single module

## Verification (verify/)
- Compares the fake SITS database (ground truth) directly against the fake BB database. Must NOT compare against the agent's own extracted data, otherwise extraction errors would go unnoticed.
- For each module: checks that the folder and both documents exist, all fields are present and correct, outcomes and assessments all appear, and visibility is Hidden
- Output: a per-module table (✅/❌ per check) and a summary like "3/3 modules matched, 1 flagged and skipped"
- Also write the report as a simple HTML page that can be shown on screen in the demo

## Demo script (to support)
1. Show fake SITS with module data
2. Run the agent with the browser visible
3. Show the BB pages created (hidden)
4. Show the verification report
5. Switch both systems to layout v2, reset BB, and run again: it still works
6. Show the flagged broken module
7. Publish one item via /admin/review

Add `pnpm reset` to wipe BB content and reseed both systems.

## Non-goals
- No real SITS or Blackboard, no real APIs, no real student data
- No real authentication or security
- No grades, enrolments, or attendance (yet)

## Milestones
1. Monorepo plus shared schema plus seed data
2. Fake SITS (v1, then v2)
3. Fake BB (v1, then v2, including Quill and review page)
4. Agent reads SITS correctly for all modules
5. Agent creates BB content for one module, then all
6. Validation and flagging
7. Verification script plus HTML report
8. Layout v2 runs end to end
9. Reset script, README, polish

## Acceptance criteria
- `pnpm dev` starts both fake systems
- `pnpm agent:run` transfers all valid modules with no manual help, on both layouts
- The verification report shows all valid modules matched
- The broken module is flagged and skipped, with a clear reason
- Everything is created hidden by default
