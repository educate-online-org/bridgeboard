# fake-sits

Fake SITS student records system. Next.js, port **3001**. Read-only.

Look: old-fashioned institutional system: dense tables, grey/blue, small fonts.

Routes:
- `/login`: `sits_admin` / `demo123`, sets a session cookie
- `/modules`: table (code, title, term, leader), rows link to detail
- `/modules/[code]`: all fields, assessments in a table

Layouts (stored server-side in the app; switched via a small admin-corner toggle or `pnpm layout v1|v2`, never via URL): v2 moves fields, renames labels ("Module Leader" → "Convenor", "Weighting" → "% of Module"), turns tables into cards. Same data.
