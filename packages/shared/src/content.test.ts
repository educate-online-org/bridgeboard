import { test } from "node:test";
import assert from "node:assert/strict";
import { ModuleSchema, RawModuleSchema } from "./schema";
import { assessmentLines, formatDate, missingLines, overviewLines, plainText } from "./content";
import seed from "../../../seed/modules.json" with { type: "json" };

const module = ModuleSchema.parse(RawModuleSchema.parse((seed as unknown[])[0]));

test("formatDate reads like a date a person would type", () => {
  assert.equal(formatDate("2026-11-27"), "27 November 2026");
  assert.equal(formatDate("2027-01-20"), "20 January 2027");
});

test("overview has the description, the facts and every outcome", () => {
  const lines = overviewLines(module);
  assert.equal(lines[0], module.description);
  assert.ok(lines.includes("- Level: 4"));
  assert.ok(lines.includes("- Module leader: Dr Amelia Hart"));
  for (const o of module.learningOutcomes) assert.ok(lines.includes(`- ${o}`));
});

test("assessments are one bullet each, with type, weighting and a spoken date", () => {
  const lines = assessmentLines(module);
  assert.deepEqual(lines.slice(2), [
    "- Programming Exercises Portfolio — Portfolio, 40%, due 27 November 2026",
    "- Mini Project — Coursework, 60%, due 15 January 2027",
  ]);
});

test("plainText strips Quill's markup and entities", () => {
  const html = `<p>Intro &amp; aims</p><ul><li>LO&nbsp;one</li><li>LO two</li></ul><h2>Done</h2>`;
  assert.equal(plainText(html), "Intro & aims LO one LO two Done");
});

test("missingLines ignores the bullet marker", () => {
  const text = plainText("<ul><li>Module code: U24CS101</li></ul>");
  assert.deepEqual(missingLines(text, ["- Module code: U24CS101"]), []);
  assert.deepEqual(missingLines(text, ["- Module code: U24CS999"]), ["- Module code: U24CS999"]);
});
