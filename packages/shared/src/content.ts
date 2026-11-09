import type { Module } from "./schema";

/**
 * What goes into the two BB documents. The agent types these lines, and verify/
 * looks for the same lines in BB, so both sides can never drift apart.
 * One line in, one line typed (or one bullet, if it starts with "- ").
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 2026-11-27 → "27 November 2026" (how a person would say it). */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export const OUTCOMES_HEADING = "Learning outcomes";
export const ASSESSMENTS_HEADING = "Assessments";

export const overviewFieldLines = (m: Module): string[] => [
  `- Module code: ${m.code}`,
  `- Level: ${m.level}`,
  `- Credits: ${m.credits}`,
  `- Term: ${m.term}`,
  `- Module leader: ${m.leader}`,
];

export const overviewOutcomeLines = (m: Module): string[] => m.learningOutcomes.map((o) => `- ${o}`);

export const assessmentItemLines = (m: Module): string[] =>
  m.assessments.map((a) => `- ${a.name} — ${a.type}, ${a.weightPercent}%, due ${formatDate(a.dueDate)}`);

/** Everything typed into "Module Overview", in order. An empty string is a paragraph break. */
export const overviewLines = (m: Module): string[] => [
  m.description,
  "",
  ...overviewFieldLines(m),
  "",
  OUTCOMES_HEADING,
  "",
  ...overviewOutcomeLines(m),
];

/** Everything typed into "Assessment Information", in order. */
export const assessmentLines = (m: Module): string[] => [
  ASSESSMENTS_HEADING,
  "",
  ...assessmentItemLines(m),
];

/** A typed line without its bullet marker — the text verify searches for in BB. */
export const expectedText = (line: string): string => line.replace(/^-\s+/, "");

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

/** BB stores HTML; compare on visible text only. */
export function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|ul|ol|div)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}

/** Which of these lines are missing from the text (empty for a perfect match). */
export function missingLines(text: string, lines: string[]): string[] {
  return lines.filter((line) => !text.includes(expectedText(line)));
}
