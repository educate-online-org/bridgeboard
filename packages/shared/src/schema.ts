import { z } from "zod";

export const ASSESSMENT_TYPES = ["Coursework", "Exam", "Presentation", "Portfolio"] as const;
export const AssessmentType = z.enum(ASSESSMENT_TYPES);
export type AssessmentType = z.infer<typeof AssessmentType>;

const NOT_SHOWN = "Use null if this is not shown on the page. Never guess or infer a value.";

/**
 * Lenient schema: used by the agent's extract() and to type SITS records.
 * Every field may be null so the model can say "not on the page" instead of inventing a value.
 */
export const RawAssessmentSchema = z.object({
  name: z.string().nullable().describe(`Assessment name. ${NOT_SHOWN}`),
  type: AssessmentType.nullable().describe(`Assessment type. ${NOT_SHOWN}`),
  weightPercent: z
    .number()
    .nullable()
    .describe(`Weighting as a number of percent, e.g. 40 for "40%". ${NOT_SHOWN}`),
  dueDate: z
    .string()
    .nullable()
    .describe(`Due date as an ISO date (YYYY-MM-DD). ${NOT_SHOWN}`),
});

export const RawModuleSchema = z.object({
  code: z.string().nullable().describe(`Module code, e.g. "U24CS101". ${NOT_SHOWN}`),
  title: z.string().nullable().describe(`Module title. ${NOT_SHOWN}`),
  level: z.number().int().nullable().describe(`Module level (4, 5, 6 or 7). ${NOT_SHOWN}`),
  credits: z.number().int().nullable().describe(`Credit value. ${NOT_SHOWN}`),
  term: z.string().nullable().describe(`Term, e.g. "2026/27 Semester 1". ${NOT_SHOWN}`),
  leader: z.string().nullable().describe(`Module leader / convenor name. ${NOT_SHOWN}`),
  description: z.string().nullable().describe(`Module description. ${NOT_SHOWN}`),
  learningOutcomes: z
    .array(z.string())
    .describe("Learning outcomes exactly as listed. Use an empty array if none are shown."),
  assessments: z
    .array(RawAssessmentSchema)
    .describe("Every assessment listed. Use an empty array if none are shown."),
});
export type RawAssessment = z.infer<typeof RawAssessmentSchema>;
export type RawModule = z.infer<typeof RawModuleSchema>;

/** Strict schema: data must pass this (plus the rules in validate.ts) before anything is created in BB. */
export const AssessmentSchema = z.object({
  name: z.string().min(1),
  type: AssessmentType,
  weightPercent: z.number().min(0).max(100),
  dueDate: z.iso.date(),
});

export const ModuleSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]+$/, "must be uppercase letters/digits"),
  title: z.string().min(1),
  level: z.number().int().min(4).max(7),
  credits: z.number().int().positive(),
  term: z.string().min(1),
  leader: z.string().min(1),
  description: z.string().min(1),
  learningOutcomes: z.array(z.string().min(1)),
  assessments: z.array(AssessmentSchema).min(1),
});
export type Assessment = z.infer<typeof AssessmentSchema>;
export type Module = z.infer<typeof ModuleSchema>;
