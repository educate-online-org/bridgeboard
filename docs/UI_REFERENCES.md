# UI references (placeholder until real CCCU screenshots)

Public guides used to make the fake apps roughly realistic. Links only: no images are copied into this repo. Replace with CCCU screenshots when available (put them in `docs/screenshots/`, personal data blurred).

Status: the Ultra notes below marked **[seen]** were read off screenshots in the reviews listed under "Local reviews", not inferred from blog text. SITS is still unverified — see the end of this file. Where the fake deliberately differs from real Ultra, it says **[ours diverges]** and why.

## Blackboard Ultra

Facts from public guides that the fake BB should mirror:

**[seen]** Course page chrome
- Left icon rail (tools) and a top tab strip: **Content · Calendar · Announcements · Discussions · Gradebook · Messages · Analytics · Groups**, plus **Student Preview** on the right and a **Course Settings** (⚙) button with an `OPEN` badge.
- Banner above the tabs: course ID on one line, then `term - title (course id)`, e.g. `PHI1001-SUN-2627-S12` / `26/27 - Introduction to Philosophy (PHI1001-SUN-S12)`.
- Content area heading is **"Course Content"**, with a search icon and a `⋯` overflow menu.

**[seen]** Course ID convention
- Shape observed: `<module code>-<institution>-<academic year>-<session>`, e.g. `PHI1001-SUN-2627-S12` / `PHI1001-SUN-2425-S1`; the term then reads `2025/26 Modules` or `26/27`.
- Not universal: Trinity College Dublin uses `<module code>-<academic year>` with no session, e.g. `BIU11PH1-202526`, and `GJTraining-202526` for a training course. So the shape is an *institution* convention, not a Blackboard one.
- **[ours diverges]** Our fake uses `courseCode` = the SITS module code alone (`U24CS101`), so the agent can find a course by code in one step. Adopting the real format would put the SITS-code → course-ID mapping problem inside the demo for no gain in any demo criterion. Keeping it as a known simplification; the mapping is a real integration question (tracked in [`CCCU_ACCESS.md`](CCCU_ACCESS.md) §1).

**[seen]** Item row anatomy
- Every item (folder or document) renders as: drag handle (`⋮⋮`), type icon, **title**, **visibility pill**, `⋯` menu, and a description/summary line if it has one.
- Folders have an expand chevron (`⌄`); a small `⊕` button sits between items to insert more content.
- **Visibility is an inline pill on the item row**, not a field buried in a create form: `👁 Visible to students ⌄` / `🚫 Hidden from students ⌄`.
- **[ours now matches]** The fake's pill is clickable and offers `Visible to students` / `Hidden from students` (`setVisibility` in `apps/fake-bb/app/actions.ts`), so visibility can be corrected after creation the way a human would — and layout v2 renames the control (`Visibility` → `Student access`).
- **[ours diverges]** The per-row `⋯` menu (Edit / Copy / Move / Delete) is not modelled: a menu whose entries do nothing is worse than no menu. The `⊕` insert-between-items button is modelled as the `+` line.

**[seen]** Structure conventions (Northampton Ultra)
- A module typically opens with an `About this module` folder ("module guide, contact details for your lecturers, module reading list") and an `Assessment and submission` folder.
- Ours is `Module Information` → `Module Overview` + `Assessment Information` (`BB_STRUCTURE` in `packages/shared`). Same shape, different names. **Decision: keep ours.** The names are baked into the agent's create steps, the re-run skip check ("skip a course that already has Module Information") and `verify`, so renaming buys nothing but churn.

**[seen]** Hidden-by-default is institutional policy, not a preference
- "The 'Grading, feedback, and verification' folder is hidden from students and must always remain hidden, as should all items stored within this area… if items are made available to students, it may constitute a data breach." Nothing created for staff should be visible until a human publishes it.
- **[ours diverges]** In real Ultra a new item is *Visible to students* by default, so hiding is a deliberate act; our create panel defaults to Hidden (per the brief). We keep the safe default for the live demo, but the row pill means the agent could also fix a wrong state instead of recreating the item. `verify` should therefore check visibility rather than assume it.

**[seen]** Add-content flow
- Content is added from a **"+" button** on the Course Content page (also inside folders/modules) → **Create** → item type. Done is used to confirm; a right-hand panel is the usual editor surface (panels open on the right, with `Cancel` / `Save` at the bottom).
- The **Create Item** panel is grouped into two sections:
  - *Course Content Items*: Folder, Document, Link, Teaching tools with LTI connection, SCORM package
  - *Assessment*: Test, Assignment
- **[ours diverges]** We offer Folder and Document only. Every extra menu entry is a chance for the agent to pick wrong, and nothing in the demo creates links, tests or assignments. The section headings are worth adding if the menu ever needs to look richer.
- Assignments use the same right-hand panel with a settings cog, **Due date** (+ a "No due date" checkbox), and options such as "Collect submissions offline". "Post assessment marks automatically" is deliberately off for offline submissions.

From guides (still unverified visually):
- Ultra Documents are built from **blocks** (text blocks, files, etc.), not one big editor. Our fake keeps one editor per document for simplicity; worth revisiting with real screenshots.
- Folders nest at most **2 levels deep**. Our structure (course → "Module Information" → documents) fits.

## What already exists between Ultra and SITS (context for the demo)

Public guides describe marks going BB → SITS through an LTI called **Send Marks to SITS** / Grade Approval and Transfer: only a **Grades Journey Approver** role can run it, marks must be mapped first, then the approver selects columns and approves, and the marks are extracted on a **scheduled run (Mon–Fri, hourly, 08:00–18:00, 10-minute cut-off)**, with an approval history / transfer audit per module.

Useful framing for the demo: the institution has automated the **marks** path. Module *content* setup is still done by hand — that is the gap this project targets.

## Local reviews (on the machine, not in this repo)

Source PDFs: `~/Desktop/bridgeboard_figs/` (kept outside the repo on purpose). Note `sits 2.pdf` and `sits 2 (1).pdf` are duplicates.

- *Grading, feedback and verification processes in NILE* (Northampton, 11pp) — policy; the hidden-folder / data-breach quote above.
- *Transferring marks from NILE to SITS* (Northampton, 15pp) — the most detailed screenshots of real Ultra.
- *Transfer from Blackboard to SITS* (Trinity College Dublin, 4pp) — same workflow, shorter revision.
- *Using Blackboard Ultra assignments … not submitted to NILE* (Northampton, 5pp) — assignment settings panel.
- *sits 2.pdf* / *sits 2 (1).pdf* — a marks-transfer guide; **contains Ultra screenshots only, no SITS UI**.

## SITS / e:Vision

Still the weak spot: **no SITS screenshots anywhere in the local set.** SITS is Tribal's student records system; e:Vision is its web front end. Module screens are typically dense forms and tables. The fake SITS keeps the brief's "old-fashioned institutional" look until we have real screenshots.

What the marks-transfer guides do tell us about the SITS side (from prose, not screenshots) — useful if the extraction schema ever grows:
- Assessment points are identified by an **assessment code + sequence**: `ES1` (essay), `PJ1` (project), `AS1`; sequences `001`, `002`, `003`. Different sequences of the same code are treated as *different assessments by SITS* (resit / PSRB regulations), which is why Ultra's marks-transfer columns are named `ES1 - Essay - PHI1001-SUN-2627-S12 - 001 - Marks Transfer`.
- A marks-transfer column carries metadata linking it to SITS; deleting one means IT has to re-provision it. Columns copied from a previous course keep the old course ID, and marks only transfer when that ID matches the current course — a real-world cause of silent failure.
- Mark checking lives at *Assessment, Progression and Awards* → *Report* → *Mark Checking Report*.

Our schema has `name / type / weightPercent / dueDate` and no assessment code or sequence. Adding them would ripple through the extraction schema, the agent prompt, seed data and `verify`, so it is deliberately out of scope — noted here as the realistic next field.

Sources:
- [LSE: SITS / e:Vision training](https://info.lse.ac.uk/staff/divisions/academic-registrars-division/systems/training)
- [University of Sheffield: recorded SITS training sessions](https://digitalmedia.shef.ac.uk/tag?tagid=slp)
