// pnpm preflight — everything that must be true before a live run. No browser, no model calls.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BbDb, SitsDb } from "@bridgeboard/shared";

const ROOT = dirname(fileURLToPath(import.meta.url));
const envFile = join(ROOT, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const c = { green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m" };
let failed = 0;
let warned = 0;

const ok = (what: string, detail = "") => console.log(`${c.green}✔${c.reset} ${what}${detail ? ` ${c.dim}${detail}${c.reset}` : ""}`);
const bad = (what: string, detail: string) => {
  failed++;
  console.log(`${c.red}✘${c.reset} ${what} ${c.dim}— ${detail}${c.reset}`);
};
const warn = (what: string, detail: string) => {
  warned++;
  console.log(`${c.yellow}⚠${c.reset} ${what} ${c.dim}— ${detail}${c.reset}`);
};

const read = <T>(file: string): T | null => {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
};

console.log(`${c.bold}Preflight${c.reset} ${c.dim}(fake systems, config, data)${c.reset}\n`);

// 1. Node and config
const major = Number(process.versions.node.split(".")[0]);
major >= 20 ? ok("Node.js", process.versions.node) : bad("Node.js", `found ${process.versions.node}, need 20 or newer`);

existsSync(envFile) ? ok(".env") : bad(".env", "missing — copy .env.example and fill it in");
const model = process.env.MODEL_NAME;
const key = process.env.OPENAI_API_KEY;
model ? ok("MODEL_NAME", model) : bad("MODEL_NAME", "not set (format: provider/model)");
key ? ok("OPENAI_API_KEY", `${key.slice(0, 3)}…, ${key.length} characters`) : bad("OPENAI_API_KEY", "not set — the agent cannot make a single call without it");

// 2. Data
const sits = read<SitsDb>(join(ROOT, "data", "sits.json"));
const bb = read<BbDb>(join(ROOT, "data", "bb.json"));
if (!sits || !bb) {
  bad("seeded data", "data/sits.json or data/bb.json missing — run `pnpm seed`");
} else {
  ok("seeded data", `${sits.modules.length} SITS module(s), ${bb.courses.length} BB course shell(s), ${bb.items.length} BB item(s)`);

  const missingShells = sits.modules.filter((m) => !bb.courses.some((c) => c.courseCode === m.code)).map((m) => m.code);
  missingShells.length === 0 ? ok("BB course shells", "one per SITS module") : bad("BB course shells", `missing for ${missingShells.join(", ")}`);

  sits.layout === bb.layout ? ok("layouts match", sits.layout) : warn("layouts differ", `SITS ${sits.layout}, BB ${bb.layout} — run \`pnpm layout ${bb.layout}\` for a clean demo`);
  if (bb.items.length > 0) {
    const done = new Set(bb.items.filter((i) => i.parentFolder === null && i.title === "Module Information").map((i) => i.courseCode));
    warn("BB already has content", `${bb.items.length} item(s)${done.size ? `; ${[...done].join(", ")} will be skipped as already set up` : ""} — \`pnpm reset\` for a clean run`);
  }
}

// 3. Both apps up (and the login page rendering)
for (const [name, url] of [
  ["fake SITS", process.env.SITS_URL ?? "http://localhost:3001"],
  ["fake Blackboard", process.env.BB_URL ?? "http://localhost:3002"],
] as const) {
  try {
    const res = await fetch(`${url}/login`, { signal: AbortSignal.timeout(3000) });
    res.ok ? ok(`${name} is up`, url) : bad(`${name} is up`, `${url}/login returned ${res.status}`);
  } catch {
    bad(`${name} is up`, `${url} did not answer — start it with \`pnpm dev\``);
  }
}

console.log();
if (failed === 0 && warned === 0) console.log(`${c.green}Ready${c.reset} — \`pnpm agent:run\` will read SITS and set up every valid module.`);
else if (failed === 0) console.log(`${c.yellow}Ready with ${warned} warning(s)${c.reset} — the run will work, but the demo may not be clean.`);
else console.log(`${c.red}${failed} problem(s) to fix before running.${c.reset}`);

process.exitCode = failed === 0 ? 0 : 1;
