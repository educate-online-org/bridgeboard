import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BB_STRUCTURE,
  ModuleSchema,
  RawModuleSchema,
  assessmentItemLines,
  overviewFieldLines,
  overviewLines,
  type BbDb,
  type BbItem,
  type RawModule,
} from "@bridgeboard/shared";
import seed from "../seed/modules.json" with { type: "json" };
import { checkModule } from "./checks";

const modules = (seed as unknown[]).map((m) => RawModuleSchema.parse(m));
const valid = ModuleSchema.parse(modules[0] as RawModule);
const broken = modules.find((m) => m.code === "U24CS150") as RawModule;

const asHtml = (lines: string[]) =>
  lines.map((l) => (l.startsWith("- ") ? `<ul><li>${l.slice(2)}</li></ul>` : l ? `<p>${l}</p>` : "")).join("");

const item = (title: string, type: BbItem["type"], parentFolder: string | null, bodyHtml = ""): BbItem => ({
  id: `${title}`,
  courseCode: valid.code,
  parentFolder,
  type,
  title,
  bodyHtml,
  visibility: "hidden",
  createdAt: "2026-01-01T00:00:00.000Z",
});

function goodDb(): BbDb {
  const folder = item(BB_STRUCTURE.folder, "folder", null);
  return {
    layout: "v1",
    courses: [{ courseCode: valid.code, title: valid.title }],
    items: [
      folder,
      item(BB_STRUCTURE.overview, "document", folder.id, asHtml(overviewLines(valid))),
      item(BB_STRUCTURE.assessments, "document", folder.id, asHtml(["", ...assessmentItemLines(valid)])),
    ],
  };
}

test("a correct course matches on every check", () => {
  const r = checkModule(valid, goodDb());
  assert.equal(r.status, "matched");
  assert.ok(r.checks.every((c) => c.ok));
  assert.ok(r.checks.some((c) => c.name.includes("learning outcomes")));
});

test("a missing document is reported, with no field-by-field noise", () => {
  const db = goodDb();
  db.items = db.items.filter((i) => i.title !== BB_STRUCTURE.assessments);
  const r = checkModule(valid, db);
  assert.equal(r.status, "mismatched");
  assert.deepEqual(r.checks.filter((c) => !c.ok).map((c) => c.name), [`document “${BB_STRUCTURE.assessments}” inside it`]);
});

test("visible content fails the hidden check", () => {
  const db = goodDb();
  db.items[0]!.visibility = "visible";
  const r = checkModule(valid, db);
  const hidden = r.checks.find((c) => c.name.includes("hidden"))!;
  assert.equal(hidden.ok, false);
  assert.match(hidden.detail ?? "", /Module Information/);
});

test("a wrong value is caught, not just a missing one", () => {
  const db = goodDb();
  const overview = db.items.find((i) => i.title === BB_STRUCTURE.overview)!;
  overview.bodyHtml = overview.bodyHtml.replace("- Level: 4", "- Level: 7").replace(/Level: 4/, "Level: 7");
  const r = checkModule(valid, db);
  const details = r.checks.find((c) => c.name.includes("module details"))!;
  assert.equal(details.ok, false);
  assert.equal(overviewFieldLines(valid).length, 5); // sanity: five fields are checked at once
});

test("nothing is created for a module that fails validation", () => {
  const empty: BbDb = { layout: "v1", courses: [], items: [] };
  assert.equal(checkModule(broken, empty).status, "skipped");
  // Someone did create content for the broken module: that is a mismatch, not a skip.
  const created: BbDb = { ...empty, items: [{ ...item(BB_STRUCTURE.folder, "folder", null), courseCode: broken.code! }] };
  assert.equal(checkModule(broken, created).status, "mismatched");
});
