// Run log: every step with timing, attempts and outcome, plus per-module results and flags.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RawModule } from "@bridgeboard/shared";

export const MAX_RETRIES = 2;

export interface StepEntry {
  name: string;
  module?: string;
  status: "ok" | "failed";
  attempts: number;
  ms: number;
  error?: string;
}

export interface ModuleEntry {
  status: "valid" | "flagged" | "failed" | "skipped" | "created";
  flags: string[];
  extracted?: RawModule;
  extractedWith?: "page" | "page+screenshot";
  error?: string;
}

const c = { green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m" };
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export class RunLog {
  readonly startedAt = new Date();
  readonly steps: StepEntry[] = [];
  readonly modules: Record<string, ModuleEntry> = {};

  constructor(private readonly meta: Record<string, unknown>) {}

  /**
   * Run one step. On failure, wait, let `onRetry` re-observe the page, and try again (up to MAX_RETRIES).
   * Throws after the last attempt so the caller can fail the module gracefully.
   */
  async step<T>(name: string, fn: (attempt: number) => Promise<T>, opts: { module?: string; onRetry?: () => Promise<void> } = {}): Promise<T> {
    const start = Date.now();
    const label = `${opts.module ? `[${opts.module}] ` : ""}${name}`;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const result = await fn(attempt);
        const ms = Date.now() - start;
        this.steps.push({ name, module: opts.module, status: "ok", attempts: attempt, ms });
        console.log(`${c.green}✔${c.reset} ${label} ${c.dim}(${secs(ms)}${attempt > 1 ? `, attempt ${attempt}` : ""})${c.reset}`);
        return result;
      } catch (err) {
        lastError = err;
        if (attempt <= MAX_RETRIES) {
          console.log(`${c.yellow}↻${c.reset} ${label} ${c.dim}failed (${message(err)}), re-observing and retrying…${c.reset}`);
          await new Promise((r) => setTimeout(r, 800));
          await opts.onRetry?.().catch(() => {});
        }
      }
    }
    const ms = Date.now() - start;
    this.steps.push({ name, module: opts.module, status: "failed", attempts: MAX_RETRIES + 1, ms, error: message(lastError) });
    console.log(`${c.red}✘${c.reset} ${label} ${c.dim}(${secs(ms)})${c.reset} ${message(lastError)}`);
    throw lastError;
  }

  setModule(code: string, entry: ModuleEntry) {
    this.modules[code] = entry;
  }

  flag(code: string, flags: string[], extra: Partial<ModuleEntry> = {}) {
    this.modules[code] = { ...this.modules[code], ...extra, status: "flagged", flags };
    console.log(`${c.yellow}⚑ [${code}] FLAGGED, nothing will be created:${c.reset}`);
    for (const f of flags) console.log(`${c.yellow}    - ${f}${c.reset}`);
  }

  info(text: string) {
    console.log(`${c.bold}${text}${c.reset}`);
  }

  save(dir: string): string {
    mkdirSync(dir, { recursive: true });
    const finishedAt = new Date();
    const file = join(dir, `run-${this.startedAt.toISOString().replace(/[:.]/g, "-")}.json`);
    const body = { ...this.meta, startedAt: this.startedAt, finishedAt, durationMs: +finishedAt - +this.startedAt, steps: this.steps, modules: this.modules };
    writeFileSync(file, JSON.stringify(body, null, 2));
    writeFileSync(join(dir, "latest.json"), JSON.stringify(body, null, 2));
    return file;
  }

  summary() {
    const all = Object.entries(this.modules);
    const count = (s: ModuleEntry["status"]) => all.filter(([, m]) => m.status === s).length;
    this.info(`\nSummary: ${all.length} module(s) — ${count("valid") + count("created")} valid, ${count("flagged")} flagged, ${count("failed")} failed, ${count("skipped")} skipped.`);
    for (const [code, m] of all) {
      const icon = m.status === "flagged" ? "⚑" : m.status === "failed" ? "✘" : "✔";
      console.log(`  ${icon} ${code}: ${m.status}${m.flags.length ? ` — ${m.flags.join(" ")}` : ""}${m.error ? ` — ${m.error}` : ""}`);
    }
  }
}

export function message(err: unknown): string {
  return err instanceof Error ? err.message.split("\n")[0]! : String(err);
}
