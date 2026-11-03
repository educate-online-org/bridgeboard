import { localBrowser, Stagehand, type Page } from "@browserbasehq/stagehand";
import { config } from "./config";

export interface Session {
  stagehand: Stagehand;
  page: Page;
  close: () => Promise<void>;
}

/** Local Chrome (required: Browserbase cloud browsers can't reach localhost) driven by Stagehand. */
export async function openSession(): Promise<Session> {
  const browser = await localBrowser.launch({ headless: config.headless, viewport: { width: 1400, height: 900 } });
  const stagehand = await Stagehand.create({
    browser,
    model: { modelName: config.modelName, apiKey: config.apiKey },
  });
  const [page] = await browser.context.pages();
  if (!page) throw new Error("No browser page available");
  return {
    stagehand,
    page,
    close: async () => {
      await stagehand.close().catch(() => {});
      await browser.close().catch(() => {});
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
