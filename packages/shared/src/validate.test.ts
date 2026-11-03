import { test } from "node:test";
import assert from "node:assert/strict";
import { validateModule, RawModuleSchema, type RawModule } from "./index";
import seed from "../../../seed/modules.json" with { type: "json" };

const modules = (seed as unknown[]).map((m) => RawModuleSchema.parse(m));
const byCode = (code: string) => modules.find((m) => m.code === code) as RawModule;

test("seed has 3 valid modules and 1 broken", () => {
  const results = modules.map(validateModule);
  assert.equal(results.filter((r) => r.ok).length, 3);
  assert.equal(results.filter((r) => !r.ok).length, 1);
});

test("broken module is flagged for all three problems", () => {
  const r = validateModule(byCode("U24CS150"));
  assert.equal(r.ok, false);
  if (r.ok) return;
  const text = r.flags.join("\n");
  assert.match(text, /no learning outcomes/i);
  assert.match(text, /no due date/i);
  assert.match(text, /sum to 90%/);
  assert.equal(r.flags.length, 3, `unexpected flags:\n${text}`);
});

test("nulls are flagged, never filled in", () => {
  const m = structuredClone(byCode("U24CS101"));
  m.leader = null;
  const r = validateModule(m);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.flags.join(), /leader/);
});
