import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BbDb } from "@bridgeboard/shared";

// data/ lives at the repo root; the app runs with cwd = apps/fake-bb.
const DB_PATH = process.env.BB_DB_PATH ?? join(process.cwd(), "..", "..", "data", "bb.json");

export function readDb(): BbDb {
  if (!existsSync(DB_PATH)) throw new Error(`No BB data at ${DB_PATH}. Run "pnpm seed" first.`);
  return JSON.parse(readFileSync(DB_PATH, "utf8"));
}

export function writeDb(db: BbDb) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
