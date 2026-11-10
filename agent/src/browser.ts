import { tmpdir } from "node:os";
import { join } from "node:path";
import { localBrowser, Stagehand, type Page } from "@browserbasehq/stagehand";
import { config } from "./config";

/** One system in its own browser window, with its own profile and cookies. */
export interface System {
  stagehand: Stagehand;
  page: Page;
}

export interface Session {
  sits: System;
  bb: System;
  close: () => Promise<void>;
}

/**
 * Two systems, two browsers. Each gets its own profile directory, so the logins and cookies are
 * genuinely separate (as they would be for someone with SITS in one window and Blackboard in
 * another), and both stay on screen during a run. Browserbase cloud browsers can't reach localhost,
 * so this is local Chrome.
 */
async function openSystem(name: "sits" | "bb"): Promise<{ system: System; close: () => Promise<void> }> {
  const browser = await localBrowser.launch({
    headless: config.headless,
    viewport: { width: 1400, height: 900 },
    userDataDir: join(tmpdir(), `bridgeboard-chrome-${name}-${process.pid}`),
  });
  const stagehand = await Stagehand.create({
    browser,
    model: { modelName: config.modelName, apiKey: config.apiKey },
  });
  const [page] = await browser.context.pages();
  if (!page) throw new Error(`No browser page available for ${name}`);
  return { system: { stagehand, page }, close: async () => browser.close().catch(() => {}) };
}

/** Give the human time to start recording before anything appears on screen. */
async function countdown(seconds: number) {
  if (seconds <= 0) return;
  for (let left = seconds; left > 0; left--) {
    console.log(`\n  Starting in ${left}s — start your screen recording now.\n`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function openSession(): Promise<Session> {
  await countdown(Math.round(config.startDelayMs / 1000));
  const [sits, bb] = await Promise.all([openSystem("sits"), openSystem("bb")]);
  return {
    sits: sits.system,
    bb: bb.system,
    close: async () => {
      await Promise.all([sits.close(), bb.close()]);
    },
  };
}

/** Wait until the URL satisfies a condition (used to confirm navigation, not to act). */
export async function waitForUrl(page: Page, test: (url: string) => boolean, timeoutMs = 10_000): Promise<string> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const url = await page.url();
    if (test(url)) return url;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for navigation (at ${await page.url()})`);
}

/** Throw if Stagehand reports that an act() did not succeed, so the step gets retried. */
export function ensure(result: { data: { success: boolean; message: string } }, what: string) {
  if (!result.data.success) throw new Error(`${what}: ${result.data.message}`);
}
