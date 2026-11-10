// SITS reader. Every action is described in natural language; no selectors or URLs beyond the start page.
import { z } from "zod";
import { RawModuleSchema, validateModule, type RawModule } from "@bridgeboard/shared";
import { ensure, waitForUrl, type System } from "../browser";
import { config } from "../config";
import type { RunLog } from "../log";
import { fillField } from "./common";
import { status } from "../overlay";
import { act, extract as readPage } from "./model";

const EXTRACT_INSTRUCTION = `Extract the details of the module shown on this page.
Rules:
- Copy values exactly as displayed. Do not correct, complete or rephrase anything.
- If a field is not shown, or its value is blank, return null. Never guess, infer or fill in a value.
- learningOutcomes: every learning outcome, in order. If the page says there are none, return an empty list.
- assessments: every assessment listed. weightPercent is the number only (e.g. 40 for "40%").
- dueDate: convert the displayed date to YYYY-MM-DD. If no date is shown for an assessment, return null.
- level and credits are numbers.`;

export async function loginSits(s: System, log: RunLog) {
  await log.step("Open SITS", async () => {
    await s.page.goto(config.sitsUrl);
  });
  await log.step("Log in to SITS", async () => {
    await fillField(s, "username input on the login form", config.sits.username);
    await fillField(s, "password input on the login form", config.sits.password);
    ensure(await act(s, "click the log in button", "Logging in to SITS"), "log in");
    await waitForUrl(s.page, (u) => !u.includes("/login"));
  });
}

export async function listModuleCodes(s: System, log: RunLog): Promise<string[]> {
  await status(s, "Reading the module list from SITS", "", true);
  await openModuleList(s, log);
  return log.step("Read module list", async () => {
    const { data } = await readPage(
      s,
      "List every module shown on this page with its module code (the reference like U24CS101) and title.",
      z.object({ modules: z.array(z.object({ code: z.string(), title: z.string() })) }),
    );
    if (data.modules.length === 0) throw new Error("No modules found on the page");
    return data.modules.map((m) => m.code.trim());
  });
}

async function openModuleList(s: System, log: RunLog, module?: string) {
  await log.step(
    "Open module list",
    async () => {
      ensure(await act(s, "open the list of all modules from the main navigation menu", "Opening the module list"), "open module list");
      await s.page.waitForLoadState("load");
    },
    { module },
  );
}

/**
 * Open a module's page and extract it. If the result fails validation, take a second look using a
 * screenshot as well, so a module is only flagged after both readings agree something is missing.
 */
export async function readModule(s: System, log: RunLog, code: string): Promise<{ raw: RawModule; method: "page" | "page+screenshot" }> {
  await status(s, `Reading module ${code}`, "from the SITS record", true);
  await openModuleList(s, log, code);
  await log.step(
    "Open module details",
    async () => {
      ensure(await act(s, `open the details page for the module with code ${code}`, `Opening module ${code}`), "open module");
      await waitForUrl(s.page, (u) => u.includes(code)).catch(() => {}); // best effort; extraction checks the code anyway
    },
    { module: code, onRetry: () => openModuleList(s, log, code) },
  );

  const extract = (screenshot: boolean) =>
    log.step(
      screenshot ? "Extract module details (second look, with screenshot)" : "Extract module details",
      async (attempt) => {
        const wantScreenshot = config.allowScreenshots && (screenshot || attempt > 2);
        const { data } = await readPage(s, EXTRACT_INSTRUCTION, RawModuleSchema, { screenshot: wantScreenshot });
        if (data.code?.trim() !== code) throw new Error(`Page shows module ${data.code ?? "?"}, expected ${code}`);
        return data;
      },
      { module: code },
    );

  const first = await extract(false);
  if (validateModule(first).ok) return { raw: first, method: "page" };
  const second = await extract(true);
  return { raw: second, method: "page+screenshot" };
}
