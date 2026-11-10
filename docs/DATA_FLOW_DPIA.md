# Data flow and DPIA draft

Draft for CCCU's Data Protection Officer and IT Security. Not legal advice, and not a completed DPIA — it is the technical input a DPIA needs: what the agent touches, what leaves the machine, and what controls exist.

Scope: the Bridgeboard agent, pointed at CCCU's real SITS and Blackboard Ultra. The demo in this repo runs against fake systems and touches no real data.

## 1. Roles

| Party | Role |
|---|---|
| CCCU | Data controller |
| Bridgeboard (us) | Processor / supplier |
| OpenAI | Sub-processor — receives page snapshots and returns model output |
| Anthology (Blackboard), Tribal (SITS) | Their own processors for their systems; unchanged by this project |

Purpose limitation: read module records from SITS, create corresponding **hidden** content in Blackboard. A human publishes. No other use.

Data subjects: **staff only** (module leaders are named in SITS module records). **No students.**

## 2. What the agent touches

| Data | Source | Goes to the LLM? | Stored locally? |
|---|---|---|---|
| Module leader name (staff personal data) | SITS page | **Yes** — part of the page snapshot | Yes, in the run log |
| Module title, code, level, credits, term, description | SITS page | **Yes** | Yes, in the run log |
| Learning outcomes, assessment names/types/weights/due dates | SITS page | **Yes** | Yes, in the run log |
| Screenshot of the module page | SITS page | **Yes, when the fallback is used** | No |
| SITS / Blackboard credentials | `.env` or secret manager | **No** — typed locally as keystrokes | No |
| Session cookies | Local browser profile | **No** — not part of a DOM snapshot | Browser profile only |
| Student records, enrolments, marks, submissions | — | **Never accessed** | — |

## 3. Data flow

```
 fake/real SITS page ──┐
                       ├── local Chrome (agent's machine)
 Blackboard Ultra page ┘        │
                                │  per act() / observe() / extract():
                                │  accessibility snapshot or DOM text
                                │  (+ page screenshot on the second-look extract)
                                ▼
                        OpenAI API (sub-processor)
                                │  returns: element selector / extracted JSON
                                ▼
                        agent process ──► drives Blackboard UI (clicks, typing)
                                │
                                ├──► agent/runs/run-<timestamp>.json  (extracted module data, flags)
                                └──► data/sits.json + data/bb.json    (fake demo only)
```

Model calls per run, for scale: 2 `observe()` per login, 1 `act()` per navigation/menu/save/confirm step, 1 `extract()` per module. Roughly 20 calls and ~33k tokens per module at the time of writing.

## 4. What is and is not redacted

The mechanics are measured, not assumed: see [`LLM_DATA_EGRESS.md`](LLM_DATA_EGRESS.md). A module page renders to a **3.7k-character accessibility tree (~930 tokens)** containing the module leader's name and the full module content; `pnpm agent:egress` reproduces it with no model call so a reviewer can inspect the exact payload.

- **Nothing is redacted today.** Whatever is on the page inside the snapshot goes to the model, including module leader names.
- Credentials are not sent because they are typed by keyboard into the login form and the agent never observes or screenshots the login page. **This invariant must be preserved**: adding a screenshot "for debugging" inside the login step would leak a password.
- No filtering, masking or field-level allowlist exists in the current code. That is the main gap this document exposes.

## 5. Retention and locations

| Store | Content | Retention proposal |
|---|---|---|
| OpenAI API | Page snapshots, screenshots, prompts | Per contract: default API data is not used for training; abuse-monitoring retention applies unless zero-retention is contracted. **Confirm the current term and whether UK/EU residency endpoints are required** |
| `agent/runs/*.json` (local) | Extracted module data, flags, timings, screenshot-free | 30 days, then deleted; filesystem encryption; gitignored |
| Browser profile (`userDataDir`) | Session cookies | Ephemeral (temp dir) for the demo; a dedicated managed profile for a pilot |
| Console output | Step names, timings, module codes, flag reasons | Not persisted |

## 6. Risks and controls

| # | Risk | Control | Residual |
|---|---|---|---|
| R1 | Staff names and unpublished module content sent to a third-party LLM | DPA with OpenAI; no-training/zero-retention terms; residency; **or** mask names before sending (breaks nothing except the leader field, which could be typed by a human later) | Medium |
| R2 | Agent navigates somewhere it should not (student records) | Domain allowlist (Stagehand exposes `setDomainPolicy`) restricted to the SITS and Blackboard hosts; dedicated read-only SITS role; pilot course allowlist | Low |
| R3 | Credential exposure | No stored credentials: human signs in, agent attaches to the authenticated session; otherwise OS keychain/secret manager, never a file in the repo | Low |
| R4 | Prompt injection from page content | Model output only selects elements or fills a schema; strict validation before any write; no model-supplied URLs or code executed | Low |
| R5 | Unauthorised automated activity on institutional systems | Named service/session account, change approval, pilot scope, audit trail; vendor terms checked (Anthology, Tribal) | Medium |
| R6 | Personal data lingering in logs | 30-day retention, deletion job, option to scrub the leader field | Low |
| R7 | Screenshots leaving the machine | `ALLOW_SCREENSHOTS=false` for any pilot unless the DPO approves images | Low |
| R8 | **Breach of vendor acceptable-use terms** | Written consent from Tribal and Anthology, or use only sanctioned integration paths; the agent reads pages and automates sign-in, which both vendors' terms restrict | **High until consent is in writing** |

## 6a. Contractual position (blocking)

- **Tribal:** Admissions Acceptable Use Policy prohibits access "by automated means", and scraping, crawling or harvesting content or personal data, **without prior written consent**.
- **Anthology:** Platform Policies prohibit unauthorised data harvesting, web scraping and password engineering, and bar using electronic means to avoid use limitations or to overload resources with automated scripts.

So consent, not engineering, is the gate. Two consequences for the DPIA: the processing is only lawful *and* contractually permitted once written consent exists (or a sanctioned integration path is used), and the institution — not the supplier — carries the platform-agreement risk. Both must be resolved before any pilot touches real data.

## 7. Controls to put in place before a pilot

1. `ALLOW_SCREENSHOTS=false` — the screenshot fallback is a demo affordance, not a necessity.
2. Domain allowlist for navigation (`setDomainPolicy`), so only SITS and Blackboard hosts are reachable.
3. Keep the "never observe or screenshot the login page" invariant, and assert it in code review.
4. Least privilege: read-only SITS account; Blackboard role limited to the pilot courses (editing a Document needs `Course/Organization (Content Areas) > Edit Materials`).
5. Human publishes; the agent never changes visibility after creation.
6. Retain the verification report as evidence of what was created.
7. Signed DPA with the model provider, plus the sub-processor entry in CCCU's ROPA.
8. Log retention/deletion job, and a named owner for it.

## 8. Decisions needed from CCCU

- Lawful basis for processing staff names in module records for this purpose.
- May staff names be sent to the model, or must they be masked?
- Which provider and model, under which contract terms, and in which region?
- Are page screenshots permitted at all?
- Who owns the account the agent drives, and is an unattended session permitted?
- Is the New Content Editor (beta) acceptable, given it changes again in December 2026?
- Has written consent been obtained from Tribal and Anthology, or are we restricted to sanctioned integrations?

## 9. Known gaps in this draft

- No DPIA screening questions completed (ICO template), no ROPA entry drafted.
- No formal model-inventory or vendor assessment attached.
- Retention figures assume current provider defaults and must be checked at signature.
- The pilot will process real institutional data; the demo in this repo does not.
