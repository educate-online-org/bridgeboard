// pnpm agent:egress [--module CODE]
// Dev tool, no model calls: capture exactly what the agent would send to the model provider for a
// SITS module page — the accessibility tree Stagehand builds — and write it to agent/runs/ for
// inspection. Credentials are filled with plain locators here on purpose: this tool must never
// call observe()/act()/extract(), or it would send the very thing it is meant to inspect.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { openSession, waitForUrl } from "./browser";
import { clickText } from "./connectors/dom";
import { config } from "./config";

const args = process.argv.slice(2);
const code = (args.includes("--module") ? args[args.indexOf("--module") + 1] : undefined) ?? "U24CS101";

const session = await openSession();
const sits = session.sits;

try {
  await sits.page.goto(config.sitsUrl);
  await sits.page.locator('input[name="username"]').fill(config.sits.username);
  await sits.page.locator('input[name="password"]').fill(config.sits.password);
  await sits.page.locator('button[type="submit"]').click();
  await waitForUrl(sits.page, (u) => !u.includes("/login"));

  await clickText(sits, "module");
  await clickText(sits, code);
  await waitForUrl(sits.page, (u) => u.includes(code));

  const snapshot = await sits.page.snapshot();
  const tree = snapshot.formattedTree;

  const out = join(config.runsDir, "egress-preview.txt");
  writeFileSync(out, tree);

  const approxTokens = Math.round(tree.length / 4);
  console.log(`Page: ${await sits.page.url()}`);
  console.log(`Accessibility tree: ${tree.length} characters, roughly ${approxTokens} tokens`);
  console.log(`Written to: ${out.replace(`${process.cwd()}/`, "")}`);
  console.log("\n--- first 1200 characters ---\n");
  console.log(tree.slice(0, 1200));
} finally {
  await session.close();
}
