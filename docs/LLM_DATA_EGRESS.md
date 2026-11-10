# What the agent sends to the model provider

Technical note for the DPIA (`docs/DATA_FLOW_DPIA.md`). Companion command: `pnpm agent:egress --module U24CS205`, which captures this without making a single model call, so it can be run in a security review at no cost.

## What is actually sent

Not raw HTML and not a screenshot by default. Stagehand renders the page into its **accessibility tree** — a text outline of what a screen reader would see: elements, their roles (`heading`, `cell`, `link`, `button`), their label, and their text content — and sends that, plus the instruction.

Measured on this repo's fake SITS module page (`U24CS205 Database Systems`):

```
Accessibility tree: 3707 characters, roughly 927 tokens
```

A real module page will be bigger, but not by an order of magnitude. Observed prompt sizes in live runs were 1.5k–2.5k tokens per call, of which this tree is one part; the rest is the instruction and, for `extract()`, the output schema.

## A real excerpt

```
[0-169] row
  [0-170] rowheader: Term
  [0-172] cell: 2026/27 Semester 1
  [0-174] rowheader: Module Leader
  [0-176] cell: Prof. Daniel Okafor
[0-179] rowheader: Description
  [0-181] cell: Covers the design and implementation of relational databases…
[0-183] heading: Learning Outcomes
  [0-194] cell: LO1
  [0-197] cell: Design a relational schema from a set of requirements using entity-relationship modelling.
```

That excerpt is the whole issue in one place: the tree carries **staff names and full module content**, because that is what is on the screen.

## What is not sent

- **Markup and styling**: no CSS, no class names, no element attributes beyond role/label/state.
- **Cookies or session tokens**: they live in the browser, not in the tree.
- **Passwords**: the agent never observes or screenshots the login page, and credentials are typed as keystrokes. This invariant must survive code review.
- **Anything not rendered**: hidden tabs, collapsed content, or fields behind another screen are absent until the agent opens them.

## Screenshots

Only on the second-look extraction, when a module fails validation and the agent re-reads it with a screenshot as a fallback. That is a PNG of the page and it goes to the provider as an image. `ALLOW_SCREENSHOTS=false` disables it entirely; the agent then simply flags the module instead of looking twice.

## Where the data goes, per run

| Destination | Content | Retention |
|---|---|---|
| Model provider (per call) | accessibility tree text, instruction, schema; optional screenshot | Provider terms; confirm no-training and abuse-log retention |
| Local `agent/runs/*.json` | extracted module data, flags, timings | 30 days proposed; gitignored |
| `agent/runs/egress-preview.txt` | last captured tree, for inspection only | delete after review |

## Redaction options, cheapest first

1. **Screenshots off.** One env var, already implemented: `ALLOW_SCREENSHOTS=false`.
2. **Keep the agent on module screens.** Navigation is limited to the module list and module detail pages; no student, enrolment or gradebook routes. Enforced by an allowlist in code, plus a read-only SITS role that cannot reach them anyway.
3. **Mask staff names before sending.** Cheapest honest version: replace the module leader cell's text with a placeholder at the DOM level before the call, then fill the real name in when writing to Blackboard. Costs one extra step; removes the only personal data in the flow.
4. **Contract terms.** No-training, zero-retention, UK/EEA residency with the provider.
5. **Self-hosted model.** Removes third-party egress entirely, at the cost of running the model.

## What a review should ask us to prove

- The tree for a given page can be produced on demand with `pnpm agent:egress` and inspected — no model call, no cost.
- The login page is never captured (grep the code: no `snapshot`, `act`, `observe` or `extract` before the login step completes).
- `ALLOW_SCREENSHOTS=false` removes image egress.
- The run log contains no page HTML and no screenshots.

## Residual risk

The accessibility tree is a faithful description of the screen. Anything a person could read on that page — including a module leader's name — is in it. Until option 3 is implemented, the honest statement is: **module data and staff names go to the model provider on every call**, and the DPIA must either accept that under contract terms or require masking.
