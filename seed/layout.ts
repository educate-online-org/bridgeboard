// pnpm layout v1|v2 — switch the stored layout of both fake systems. Apps read it per request, so it applies live.
import { readFileSync, writeFileSync } from "node:fs";
import { LAYOUTS, type Layout } from "@bridgeboard/shared";
import { BB_DB, SITS_DB } from "./paths";

const layout = process.argv[2] as Layout;
if (!LAYOUTS.includes(layout)) {
  console.error(`Usage: pnpm layout <${LAYOUTS.join("|")}>`);
  process.exit(1);
}

for (const file of [SITS_DB, BB_DB]) {
  const db = JSON.parse(readFileSync(file, "utf8"));
  db.layout = layout;
  writeFileSync(file, JSON.stringify(db, null, 2));
}
console.log(`Both systems switched to layout ${layout}.`);
