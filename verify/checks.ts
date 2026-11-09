import {
  BB_STRUCTURE,
  ModuleSchema,
  assessmentItemLines,
  missingLines,
  overviewFieldLines,
  overviewOutcomeLines,
  plainText,
  type BbDb,
  type BbItem,
  type Module,
  type RawModule,
} from "@bridgeboard/shared";

export interface Check {
  name: string;
  ok: boolean;
  /** What was wrong, or the count that was found. */
  detail?: string;
}

export type Status = "matched" | "mismatched" | "skipped";

export interface ModuleReport {
  code: string;
  title: string;
  status: Status;
  checks: Check[];
}

const check = (name: string, missing: string[] = [], found?: string): Check =>
  missing.length === 0 ? { name, ok: true, detail: found } : { name, ok: false, detail: `missing: ${missing.join(" | ")}` };

const findItem = (items: BbItem[], parentFolder: string | null, type: BbItem["type"], title: string) =>
  items.find((i) => i.parentFolder === parentFolder && i.type === type && i.title === title);

/**
 * Does BB hold what SITS says it should? Uses the SITS record (ground truth), never the agent's
 * extracted data, so an extraction mistake cannot hide here.
 */
export function checkModule(raw: RawModule, db: BbDb): ModuleReport {
  const code = raw.code ?? "(no code)";
  const title = raw.title ?? "(no title)";
  const items = db.items.filter((i) => i.courseCode === raw.code);
  const parsed = ModuleSchema.safeParse(raw);

  // A module that fails validation must not exist in BB at all.
  if (!parsed.success) {
    const created = items.length === 0;
    return {
      code,
      title,
      status: created ? "skipped" : "mismatched",
      checks: [
        {
          name: "flagged in SITS, so nothing created",
          ok: created,
          detail: created ? undefined : `${items.length} item(s) exist in BB: ${items.map((i) => i.title).join(", ")}`,
        },
      ],
    };
  }

  const m: Module = parsed.data;
  const report = (checks: Check[]): ModuleReport => ({
    code,
    title,
    status: checks.every((c) => c.ok) ? "matched" : "mismatched",
    checks,
  });

  const shell = db.courses.find((c) => c.courseCode === m.code);
  const folder = findItem(items, null, "folder", BB_STRUCTURE.folder);
  const overview = folder && findItem(items, folder.id, "document", BB_STRUCTURE.overview);
  const assessments = folder && findItem(items, folder.id, "document", BB_STRUCTURE.assessments);

  // If the shape is wrong, stop here: field-by-field checks on a missing document say nothing new.
  const shape: Check[] = [
    { name: "course exists in Blackboard", ok: !!shell, detail: shell?.title },
    { name: `folder “${BB_STRUCTURE.folder}”`, ok: !!folder },
    { name: `document “${BB_STRUCTURE.overview}” inside it`, ok: !!overview },
    { name: `document “${BB_STRUCTURE.assessments}” inside it`, ok: !!assessments },
  ];
  if (shape.some((c) => !c.ok)) return report(shape);

  const created = [folder, overview, assessments].filter((i): i is BbItem => !!i);
  const visible = created.filter((i) => i.visibility !== "hidden");
  const overviewText = plainText(overview!.bodyHtml);
  const assessmentText = plainText(assessments!.bodyHtml);

  const visibleMissing = created.map((i) => i.title).filter((t) => visible.some((v) => v.title === t));
  const hiddenCheck: Check = {
    name: "everything hidden from students",
    ok: visible.length === 0,
    detail: visible.length === 0 ? undefined : `visible: ${visibleMissing.join(", ")}`,
  };

  return report([
    ...shape,
    hiddenCheck,
    check("overview: description", missingLines(overviewText, [m.description])),
    check("overview: module details", missingLines(overviewText, overviewFieldLines(m))),
    check(
      "overview: learning outcomes",
      missingLines(overviewText, overviewOutcomeLines(m)),
      `${m.learningOutcomes.length} outcome(s)`,
    ),
    check(
      "assessment information: every assessment",
      missingLines(assessmentText, assessmentItemLines(m)),
      `${m.assessments.length} assessment(s)`,
    ),
  ]);
}

/**
 * One line for the summary, e.g. "3/3 modules matched, 1 flagged and skipped".
 * Skipped modules are counted separately: they are meant to be absent from Blackboard.
 */
export function summarise(reports: ModuleReport[]): string {
  const skipped = reports.filter((r) => r.status === "skipped").length;
  const matched = reports.filter((r) => r.status === "matched").length;
  return `${matched}/${reports.length - skipped} modules matched, ${skipped} flagged and skipped`;
}
