// Dev check for milestone 4: compare the latest run's extracted data with the SITS ground truth.
// (Not the verification report: that compares BB with SITS and never uses the agent's data.)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { SitsDb } from "@bridgeboard/shared";
import { ROOT } from "./config";

const run = JSON.parse(readFileSync(join(ROOT, "agent", "runs", "latest.json"), "utf8"));
const sits: SitsDb = JSON.parse(readFileSync(join(ROOT, "data", "sits.json"), "utf8"));

let bad = 0;
for (const [code, entry] of Object.entries<{ extracted?: unknown }>(run.modules)) {
  const truth = sits.modules.find((m) => m.code === code);
  if (!entry.extracted) { console.log(`– ${code}: nothing extracted`); continue; }
  if (isDeepStrictEqual(entry.extracted, truth)) { console.log(`✔ ${code}: extraction matches SITS exactly`); continue; }
  bad++;
  console.log(`✘ ${code}: differences`);
  for (const key of Object.keys(truth ?? {}) as (keyof typeof truth)[]) {
    const a = JSON.stringify((entry.extracted as Record<string, unknown>)[key as string]);
    const b = JSON.stringify(truth?.[key]);
    if (a !== b) console.log(`    ${String(key)}:\n      extracted ${a}\n      SITS      ${b}`);
  }
}
process.exitCode = bad ? 1 : 0;
