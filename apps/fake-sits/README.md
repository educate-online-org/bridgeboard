# fake-sits

Fake SITS student records system. Next.js, port **3001**. Read-only. Data: `data/sits.json` (run `pnpm seed` first).

Look: old-fashioned institutional system: dense tables, grey/blue, small Verdana. Placeholder styling until real CCCU screenshots arrive.

Routes:
- `/login`: `sits_admin` / `demo123`, sets a `sits_session` cookie
- `/modules`: module list, each links to its detail page
- `/modules/[code]`: all fields, outcomes, assessments

Missing values are shown as blanks / "No records found", never filled in.

## Layouts

Stored server-side in `data/sits.json`; switch with the yellow admin-corner toggle (bottom right) or `pnpm layout v1|v2`. Same data, different presentation:

| | v1 | v2 |
| --- | --- | --- |
| Module list | Table: Module Code, Title, Term, Module Leader | Cards: title, Convenor, Delivery period, Ref |
| Detail order | Facts table → Learning Outcomes → Assessment | Synopsis → facts → Assessment Components → Intended Learning Outcomes |
| Labels | Module Leader, Term, Credits, Level, Description, Weighting, Due Date, Type | Convenor, Delivery Period, Credit Value, FHEQ Level, Synopsis, % of Module, Submission, Method |
| Assessments | Table, weight as `40%` | Cards, weight as `40` |
| Dates | `27/Nov/2026` | `Friday, 27 November 2026` |

Both date formats are unambiguous (no 05/03 vs 03/05 confusion), so the agent has to convert them to ISO itself.
