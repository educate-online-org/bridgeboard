import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Layout, RawModule, SitsDb } from "@bridgeboard/shared";

// data/ lives at the repo root; the app runs with cwd = apps/fake-sits.
const DB_PATH = process.env.SITS_DB_PATH ?? join(process.cwd(), "..", "..", "data", "sits.json");

export function readDb(): SitsDb {
  if (!existsSync(DB_PATH)) throw new Error(`No SITS data at ${DB_PATH}. Run "pnpm seed" first.`);
  return JSON.parse(readFileSync(DB_PATH, "utf8"));
}

export function getLayout(): Layout {
  return readDb().layout;
}

export function setLayout(layout: Layout) {
  const db = readDb();
  db.layout = layout;
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getModule(code: string): RawModule | undefined {
  return readDb().modules.find((m) => m.code === code);
}
