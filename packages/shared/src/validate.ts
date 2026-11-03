import { ModuleSchema, type Module, type RawModule } from "./schema";

export type ValidationResult =
  | { ok: true; module: Module }
  | { ok: false; flags: string[] };

/**
 * Business rules first (clear, human-readable flags), then the strict schema for everything else.
 * Never fixes or fills in data: it only accepts or flags.
 */
export function validateModule(raw: RawModule): ValidationResult {
  const flags: string[] = [];
  const covered = new Set<string>();

  if (raw.learningOutcomes.length === 0) {
    flags.push("No learning outcomes listed.");
    covered.add("learningOutcomes");
  }

  raw.assessments.forEach((a, i) => {
    if (!a.dueDate) {
      flags.push(`Assessment "${a.name ?? `#${i + 1}`}" has no due date.`);
      covered.add(`assessments.${i}.dueDate`);
    }
  });

  const weights = raw.assessments.map((a) => a.weightPercent);
  if (raw.assessments.length > 0 && weights.every((w) => w !== null)) {
    const total = weights.reduce<number>((sum, w) => sum + (w ?? 0), 0);
    if (total !== 100) flags.push(`Assessment weights sum to ${total}%, not 100%.`);
  }

  const parsed = ModuleSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (covered.has(path)) continue;
      flags.push(`${path || "module"}: ${issue.message}`);
    }
  }

  return flags.length === 0 && parsed.success
    ? { ok: true, module: parsed.data }
    : { ok: false, flags };
}
