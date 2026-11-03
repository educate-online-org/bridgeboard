// Seeds both fake systems. With --keep-layout (pnpm reset), the current layout of each app is preserved.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { RawModuleSchema, type BbDb, type Layout, type SitsDb } from "@bridgeboard/shared";
import rawModules from "./modules.json" with { type: "json" };
import { BB_DB, DATA_DIR, SITS_DB } from "./paths";

const keepLayout = process.argv.includes("--keep-layout");
const currentLayout = (file: string): Layout =>
  keepLayout && existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")).layout ?? "v1") : "v1";

const modules = rawModules.map((m) => RawModuleSchema.parse(m));

const sits: SitsDb = { layout: currentLayout(SITS_DB), modules };
const bb: BbDb = {
  layout: currentLayout(BB_DB),
  courses: modules.map((m) => ({ courseCode: m.code!, title: m.title! })),
  items: [],
};

mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(SITS_DB, JSON.stringify(sits, null, 2));
writeFileSync(BB_DB, JSON.stringify(bb, null, 2));

console.log(`SITS: ${modules.length} modules (layout ${sits.layout})`);
console.log(`BB:   ${bb.courses.length} empty course shells, content wiped (layout ${bb.layout})`);
