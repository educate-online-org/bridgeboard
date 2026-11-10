import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const envFile = join(ROOT, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
  return v;
}

export const config = {
  modelName: (process.env.MODEL_NAME ?? "openai/gpt-5.6-sol") as `openai/${string}`,
  apiKey: required("OPENAI_API_KEY"),
  sitsUrl: process.env.SITS_URL ?? "http://localhost:3001",
  bbUrl: process.env.BB_URL ?? "http://localhost:3002",
  headless: process.env.HEADLESS === "true",
  // Sending a page screenshot to the model provider is the one data flow a DPO is most likely to
  // refuse. Off with ALLOW_SCREENSHOTS=false; see docs/DATA_FLOW_DPIA.md.
  allowScreenshots: process.env.ALLOW_SCREENSHOTS !== "false",
  // Seconds to wait before the browser windows open, so a screen recording can be started first.
  startDelayMs: Number(process.env.START_DELAY_MS ?? 0) || 0,
  // Ring, pointer and caption drawn over the page so a screen recording shows what the agent does.
  demoOverlay: process.env.DEMO_OVERLAY !== "false",
  // Fake-system defaults; real systems would supply their own credentials.
  sits: { username: process.env.SITS_USERNAME ?? "sits_admin", password: process.env.SITS_PASSWORD ?? "demo123" },
  bb: { username: process.env.BB_USERNAME ?? "bb_admin", password: process.env.BB_PASSWORD ?? "demo123" },
  runsDir: join(ROOT, "agent", "runs"),
};
