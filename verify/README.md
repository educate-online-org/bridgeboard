# verify

Compares the fake SITS database (ground truth) directly against the fake BB database, never the agent's extracted data — otherwise an extraction mistake would go unnoticed.

```bash
pnpm verify          # console table + verify/reports/report.html
pnpm --filter @bridgeboard/verify test   # the rules themselves
```

Output:

- Per module, every check with ✅/❌: course shell, folder, both documents, "everything hidden from students", description, module details, learning outcomes, assessments.
- A summary line such as `3/3 modules matched, 1 flagged and skipped`.
- `verify/reports/report.html` — the same thing as a page, for the demo screen. Gitignored, regenerate any time.

## Rules

- **Ground truth only.** Expected content is derived from `data/sits.json`, using the same builders the agent types from (`packages/shared/src/content.ts`), so "what should be there" and "what the agent wrote" can't drift apart.
- **Shape before substance.** If the folder or a document is missing, only that is reported — field-by-field checks on a missing document say nothing useful.
- **A flagged module must be absent.** A module that fails validation should have nothing in BB; if content exists for it, that is a mismatch, not a skip.
- **Values, not just presence.** Wrong level, wrong date, wrong wording in a bullet is caught, because each expected line must appear in the document's text.
- Exit code is 1 if any module mismatches.

## Not covered

- Content BB should *not* have (e.g. a duplicate folder created by a retry).
- Actual Quill formatting (headings vs bullets) — the text is compared, not the markup.
