// pnpm verify — compare the fake SITS database (ground truth) with the fake BB database.
// The agent's own extracted data is never used here, so an extraction mistake cannot hide.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BbDb, SitsDb } from "@bridgeboard/shared";
import { checkModule, summarise, type ModuleReport } from "./checks";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = <T>(file: string): T | null => (existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : null);

const sits = read<SitsDb>(join(ROOT, "data", "sits.json"));
const bb = read<BbDb>(join(ROOT, "data", "bb.json"));
if (!sits || !bb) {
  console.error("No data yet. Run `pnpm seed` (or `pnpm reset`) first.");
  process.exit(1);
}

const reports = sits.modules.map((m) => checkModule(m, bb));
const failed = reports.filter((r) => r.status === "mismatched");

// --- console -------------------------------------------------------------------------------------
const c = { green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m" };
const icon = (r: ModuleReport) => (r.status === "matched" ? `${c.green}✔${c.reset}` : r.status === "skipped" ? `${c.yellow}⚑${c.reset}` : `${c.red}✘${c.reset}`);

console.log(`${c.bold}SITS → Blackboard verification${c.reset} ${c.dim}(SITS database vs BB database)${c.reset}\n`);
for (const r of reports) {
  console.log(`${icon(r)} ${c.bold}${r.code}${c.reset} ${r.title} ${c.dim}— ${r.status}${c.reset}`);
  for (const check of r.checks) {
    console.log(`   ${check.ok ? `${c.green}✅${c.reset}` : `${c.red}❌${c.reset}`} ${check.name}${check.detail ? ` ${c.dim}(${check.detail})${c.reset}` : ""}`);
  }
  console.log();
}
console.log(`${failed.length === 0 ? `${c.green}✔${c.reset}` : `${c.red}✘${c.reset}`} ${summarise(reports)}.`);

// --- HTML report (for the demo screen) -----------------------------------------------------------
const reportsDir = join(ROOT, "verify", "reports");
mkdirSync(reportsDir, { recursive: true });
const when = new Date().toLocaleString("en-GB");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const chip = (r: ModuleReport) => `<span class="chip ${r.status}">${r.status}</span>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Verification report</title>
<style>
  :root { --ink:#1f1f23; --muted:#6b6b74; --line:#e5e5ea; --ok:#1f7a4d; --bad:#b3261e; --warn:#8a5a00; }
  body { margin:0; font:15px/1.55 "Segoe UI", system-ui, sans-serif; color:var(--ink); background:#f6f6f8; }
  .wrap { max-width:960px; margin:0 auto; padding:40px 24px 64px; }
  h1 { font-size:26px; margin:0 0 4px; }
  .sub { color:var(--muted); margin-bottom:24px; }
  .banner { background:#fff; border:1px solid var(--line); border-left:6px solid ${failed.length ? "var(--bad)" : "var(--ok)"}; border-radius:10px; padding:16px 20px; font-size:17px; font-weight:600; }
  .banner span { display:block; font-weight:400; color:var(--muted); font-size:14px; margin-top:4px; }
  section { background:#fff; border:1px solid var(--line); border-radius:10px; margin-top:20px; overflow:hidden; }
  header { display:flex; align-items:baseline; gap:10px; padding:14px 20px; border-bottom:1px solid var(--line); }
  header h2 { font-size:16px; margin:0; }
  header .code { color:var(--muted); font-size:14px; }
  .chip { margin-left:auto; font-size:12px; text-transform:uppercase; letter-spacing:.6px; padding:3px 10px; border-radius:999px; }
  .chip.matched { background:#e2f5ea; color:var(--ok); } .chip.mismatched { background:#fde8e6; color:var(--bad); } .chip.skipped { background:#fff1d6; color:var(--warn); }
  table { width:100%; border-collapse:collapse; }
  td { padding:8px 20px; border-top:1px solid var(--line); vertical-align:top; }
  td.tick { width:28px; } td.detail { color:var(--muted); font-size:13px; }
  footer { color:var(--muted); font-size:13px; margin-top:28px; }
</style></head>
<body><div class="wrap">
  <h1>Verification report</h1>
  <p class="sub">SITS database vs Blackboard database — generated ${esc(when)}.</p>
  <div class="banner">${esc(summarise(reports))}<span>${failed.length === 0 ? "Every valid module matches SITS." : `${failed.length} module(s) differ from SITS.`}</span></div>
  ${reports
    .map(
      (r) => `<section>
    <header><h2>${esc(r.title)}</h2><span class="code">${esc(r.code)}</span>${chip(r)}</header>
    <table>${r.checks
      .map(
        (c) => `<tr><td class="tick">${c.ok ? "✅" : "❌"}</td><td>${esc(c.name)}</td><td class="detail">${esc(c.detail ?? "")}</td></tr>`,
      )
      .join("")}</table>
  </section>`,
    )
    .join("\n")}
  <footer>Checks read the SITS database directly, never the agent's extracted data. Content created by the agent is hidden from students until a human publishes it.</footer>
</div></body></html>`;

const reportPath = join(reportsDir, "report.html");
writeFileSync(reportPath, html);

console.log(`\n${c.dim}Report: ${reportPath.replace(`${ROOT}/`, "")}${c.reset}`);
process.exitCode = failed.length === 0 ? 0 : 1;
