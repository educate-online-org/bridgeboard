# fake-bb

Fake Blackboard Ultra. Next.js, port **3002**. Clean, white, modern.

Routes:
- `/login`: `bb_admin` / `demo123`
- `/courses`: one pre-created empty shell per module code
- `/courses/[code]`: content page; "+" → "Create" → "Document" | "Folder"
- `/admin/review`: all hidden items, "Publish" per item (human approval step)

Document panel: Title, Quill body (headings, bold, bullets), Visibility (default **Hidden from students**), Save.
Friction: confirmation modal, 300–800 ms spinner before panels, toast after save.

Layouts (stored server-side in the app; switched via a small admin-corner toggle or `pnpm layout v1|v2`, never via URL): v2 moves "+", "Create" → "Add content", reorders form fields, "Save" → "Done".

Stored item fields: `courseCode, parentFolder, title, bodyHtml, visibility, createdAt`.
