# fake-bb

Fake Blackboard Ultra ("CCCU Learn"). Next.js, port **3002**. Clean, white, modern. Data: `data/bb.json` (run `pnpm seed` first).

Routes:
- `/login`: `bb_admin` / `demo123`
- `/courses`: one pre-created empty shell per module code
- `/courses/[code]`: course content page with folders and documents
- `/admin/review`: all hidden items with a preview and a **Publish** button (human approval step)

Creating content: **+** → **Create** → **Document** / **Folder** → (spinner 300–800 ms) → side panel → **Save** → confirmation modal → toast. Folders expand on click; their own **+** creates content inside them. Clicking a document opens it read-only.

Document panel: Title, Quill editor, Visibility (default **Hidden from students**).

Quill typing shortcuts (what the agent uses):
- `- ` or `* ` at line start → bullet list; `1. ` → numbered list
- `# `, `## `, `### ` → heading 1/2/3 (added by us; check whether the real editor has an equivalent)
- Ctrl/Cmd+B → bold
- Enter on an empty bullet, or after a heading, returns to normal text

Stored item fields: `id, courseCode, parentFolder, type, title, bodyHtml, visibility, createdAt`.

## Layouts

Stored server-side in `data/bb.json`; switch with the yellow admin-corner toggle or `pnpm layout v1|v2`.

| | v1 | v2 |
| --- | --- | --- |
| Top-level **+** | On a dashed line above the content list | Top right of the course header |
| Folder **+** | On a line inside the expanded folder | At the right end of the folder row |
| Menu | Create › Document / Folder | Add content › Document / Folder |
| Panel field order | Title, Content, Visibility | Student access, Name, Document text |
| Panel buttons | Cancel · Save | Done · Discard |
| Confirm modal | "Save changes?" Cancel / Confirm | "Ready to add this content?" Go back / Yes, add it |
| Toast | "Document created" / "Folder created" | "Content added" |
